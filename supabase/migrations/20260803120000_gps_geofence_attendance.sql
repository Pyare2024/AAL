-- ==============================================================================
-- MIGRATION: GPS Geofencing Attendance Locations & Secure RPC Verification
-- Description: Creates attendance_locations, attendance_location_assignments, 
--              attendance_audit_logs, updates attendance_records schema,
--              and registers check_in_with_location / check_out_with_location RPCs.
-- ==============================================================================

-- 1. Create attendance_locations table
CREATE TABLE IF NOT EXISTS public.attendance_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_name TEXT NOT NULL,
  address TEXT,
  latitude NUMERIC(10,7) NOT NULL CHECK (latitude BETWEEN -90 AND 90),
  longitude NUMERIC(10,7) NOT NULL CHECK (longitude BETWEEN -180 AND 180),
  allowed_radius_meters INTEGER NOT NULL DEFAULT 100 CHECK (allowed_radius_meters > 0),
  maximum_accuracy_meters INTEGER NOT NULL DEFAULT 100 CHECK (maximum_accuracy_meters > 0),
  check_in_start_time TIME DEFAULT '08:00:00',
  check_in_end_time TIME DEFAULT '12:00:00',
  check_out_start_time TIME DEFAULT '16:00:00',
  check_out_end_time TIME DEFAULT '21:00:00',
  active_from DATE DEFAULT CURRENT_DATE,
  active_until DATE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Create attendance_location_assignments table
CREATE TABLE IF NOT EXISTS public.attendance_location_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id UUID NOT NULL REFERENCES public.attendance_locations(id) ON DELETE CASCADE,
  assignment_type TEXT NOT NULL CHECK (assignment_type IN ('all', 'problem_statement', 'college', 'city', 'selected_interns')),
  intern_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  problem_statement_id UUID REFERENCES public.problem_statements(id) ON DELETE CASCADE,
  college_id UUID,
  city TEXT,
  assigned_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  active_from DATE DEFAULT CURRENT_DATE,
  active_until DATE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Enhance attendance_records table with geofence evidence
ALTER TABLE public.attendance_records
  ADD COLUMN IF NOT EXISTS attendance_location_id UUID REFERENCES public.attendance_locations(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS attendance_date DATE DEFAULT CURRENT_DATE,
  ADD COLUMN IF NOT EXISTS check_in_time TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS check_in_latitude NUMERIC(10,7),
  ADD COLUMN IF NOT EXISTS check_in_longitude NUMERIC(10,7),
  ADD COLUMN IF NOT EXISTS check_in_accuracy NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS check_in_distance_meters NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS check_out_time TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS check_out_latitude NUMERIC(10,7),
  ADD COLUMN IF NOT EXISTS check_out_longitude NUMERIC(10,7),
  ADD COLUMN IF NOT EXISTS check_out_accuracy NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS check_out_distance_meters NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS working_minutes INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS attendance_status TEXT DEFAULT 'present',
  ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'verified';

-- Ensure unique daily record per intern
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'unique_intern_daily_attendance'
  ) THEN
    ALTER TABLE public.attendance_records
      ADD CONSTRAINT unique_intern_daily_attendance UNIQUE (intern_id, attendance_date);
  END IF;
END $$;

-- 4. Create attendance_audit_logs table
CREATE TABLE IF NOT EXISTS public.attendance_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attendance_id UUID REFERENCES public.attendance_records(id) ON DELETE CASCADE,
  intern_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  old_values JSONB,
  new_values JSONB,
  reason TEXT,
  performed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS on newly created tables
ALTER TABLE public.attendance_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_location_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_audit_logs ENABLE ROW LEVEL SECURITY;

-- Super Admin Full RLS Policies
CREATE POLICY "Super admin full access attendance_locations" 
  ON public.attendance_locations FOR ALL TO authenticated 
  USING (public.is_super_admin());

CREATE POLICY "Super admin full access attendance_location_assignments" 
  ON public.attendance_location_assignments FOR ALL TO authenticated 
  USING (public.is_super_admin());

CREATE POLICY "Super admin full access attendance_audit_logs" 
  ON public.attendance_audit_logs FOR ALL TO authenticated 
  USING (public.is_super_admin());

-- Intern Read Policies for Assigned Locations
CREATE POLICY "Interns read active attendance_locations" 
  ON public.attendance_locations FOR SELECT TO authenticated 
  USING (status = 'active');

CREATE POLICY "Interns read own location assignments" 
  ON public.attendance_location_assignments FOR SELECT TO authenticated 
  USING (intern_id = auth.uid() OR assignment_type = 'all');

-- 5. Haversine Distance Calculation Helper Function (meters)
CREATE OR REPLACE FUNCTION public.calculate_haversine_distance(
  lat1 NUMERIC, lon1 NUMERIC, lat2 NUMERIC, lon2 NUMERIC
) RETURNS NUMERIC AS $$
DECLARE
  r NUMERIC := 6371000; -- Earth radius in meters
  dlat NUMERIC := radians(lat2 - lat1);
  dlon NUMERIC := radians(lon2 - lon1);
  a NUMERIC;
  c NUMERIC;
BEGIN
  a := sin(dlat/2)^2 + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlon/2)^2;
  c := 2 * atan2(sqrt(a), sqrt(1-a));
  RETURN r * c;
END;
$$ LANGUAGE plpgsql IMMUTABLE SECURITY DEFINER;

-- 6. SECURE RPC: Check-in with location verification
CREATE OR REPLACE FUNCTION public.check_in_with_location(
  p_location_id UUID,
  p_current_latitude NUMERIC,
  p_current_longitude NUMERIC,
  p_gps_accuracy NUMERIC
) RETURNS JSONB AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_today DATE := CURRENT_DATE;
  v_loc public.attendance_locations%ROWTYPE;
  v_dist NUMERIC;
  v_rec_id UUID;
  v_now TIMESTAMPTZ := NOW();
BEGIN
  IF v_uid IS NULL THEN
    RETURN jsonb_build_object('success', false, 'message', 'Authentication required.');
  END IF;

  -- Fetch assigned location
  SELECT * INTO v_loc FROM public.attendance_locations WHERE id = p_location_id AND status = 'active';
  IF v_loc.id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'message', 'Assigned attendance location is inactive or missing.');
  END IF;

  -- Validate GPS accuracy threshold
  IF p_gps_accuracy > v_loc.maximum_accuracy_meters THEN
    RETURN jsonb_build_object('success', false, 'message', 'Your location accuracy is too low. Move to an open area and try again.');
  END IF;

  -- Calculate Backend Distance
  v_dist := public.calculate_haversine_distance(v_loc.latitude, v_loc.longitude, p_current_latitude, p_current_longitude);

  -- Validate Allowed Radius
  IF v_dist > v_loc.allowed_radius_meters THEN
    RETURN jsonb_build_object(
      'success', false, 
      'message', 'You are outside the assigned attendance area.', 
      'distance_meters', round(v_dist, 1), 
      'allowed_radius_meters', v_loc.allowed_radius_meters
    );
  END IF;

  -- Check for existing daily record
  SELECT id INTO v_rec_id FROM public.attendance_records WHERE intern_id = v_uid AND attendance_date = v_today;
  IF v_rec_id IS NOT NULL THEN
    RETURN jsonb_build_object('success', false, 'message', 'You have already checked in today.');
  END IF;

  -- Create new record
  INSERT INTO public.attendance_records (
    session_id,
    intern_id,
    attendance_location_id,
    attendance_date,
    status,
    marked_at,
    check_in_time,
    check_in_latitude,
    check_in_longitude,
    check_in_accuracy,
    check_in_distance_meters,
    attendance_status,
    verification_status
  ) VALUES (
    v_loc.id, -- fallback session_id map
    v_uid,
    v_loc.id,
    v_today,
    'present',
    v_now,
    v_now,
    p_current_latitude,
    p_current_longitude,
    p_gps_accuracy,
    round(v_dist, 1),
    'present',
    'verified'
  ) RETURNING id INTO v_rec_id;

  -- Log Audit Trail
  INSERT INTO public.attendance_audit_logs (attendance_id, intern_id, action, new_values, reason, performed_by)
  VALUES (v_rec_id, v_uid, 'CHECK_IN', jsonb_build_object('distance', v_dist, 'lat', p_current_latitude, 'lng', p_current_longitude), 'GPS verified Check-in', v_uid);

  RETURN jsonb_build_object(
    'success', true,
    'status', 'checked_in',
    'message', 'Check-in successful! Attendance verified by GPS.',
    'distance_meters', round(v_dist, 1),
    'allowed_radius_meters', v_loc.allowed_radius_meters,
    'attendance_id', v_rec_id,
    'server_timestamp', v_now
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. SECURE RPC: Check-out with location verification
CREATE OR REPLACE FUNCTION public.check_out_with_location(
  p_attendance_id UUID,
  p_current_latitude NUMERIC,
  p_current_longitude NUMERIC,
  p_gps_accuracy NUMERIC
) RETURNS JSONB AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_rec public.attendance_records%ROWTYPE;
  v_loc public.attendance_locations%ROWTYPE;
  v_dist NUMERIC;
  v_now TIMESTAMPTZ := NOW();
  v_minutes INTEGER;
BEGIN
  IF v_uid IS NULL THEN
    RETURN jsonb_build_object('success', false, 'message', 'Authentication required.');
  END IF;

  SELECT * INTO v_rec FROM public.attendance_records WHERE id = p_attendance_id AND intern_id = v_uid;
  IF v_rec.id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'message', 'No active Check-in record found for today.');
  END IF;

  IF v_rec.check_out_time IS NOT NULL THEN
    RETURN jsonb_build_object('success', false, 'message', 'You have already checked out today.');
  END IF;

  -- Fetch assigned location
  SELECT * INTO v_loc FROM public.attendance_locations WHERE id = v_rec.attendance_location_id;
  IF v_loc.id IS NOT NULL THEN
    IF p_gps_accuracy > v_loc.maximum_accuracy_meters THEN
      RETURN jsonb_build_object('success', false, 'message', 'Your location accuracy is too low. Move to an open area and try again.');
    END IF;
    v_dist := public.calculate_haversine_distance(v_loc.latitude, v_loc.longitude, p_current_latitude, p_current_longitude);
    IF v_dist > v_loc.allowed_radius_meters THEN
      RETURN jsonb_build_object(
        'success', false, 
        'message', 'You are outside the assigned attendance area for Check-out.', 
        'distance_meters', round(v_dist, 1), 
        'allowed_radius_meters', v_loc.allowed_radius_meters
      );
    END IF;
  ELSE
    v_dist := 0;
  END IF;

  -- Calculate Working Minutes
  v_minutes := GREATEST(0, ROUND(EXTRACT(EPOCH FROM (v_now - v_rec.check_in_time)) / 60));

  -- Update Attendance Record
  UPDATE public.attendance_records
  SET 
    check_out_time = v_now,
    check_out_latitude = p_current_latitude,
    check_out_longitude = p_current_longitude,
    check_out_accuracy = p_gps_accuracy,
    check_out_distance_meters = round(v_dist, 1),
    working_minutes = v_minutes,
    updated_at = v_now
  WHERE id = v_rec.id;

  -- Audit Log
  INSERT INTO public.attendance_audit_logs (attendance_id, intern_id, action, new_values, reason, performed_by)
  VALUES (v_rec.id, v_uid, 'CHECK_OUT', jsonb_build_object('working_minutes', v_minutes, 'distance', v_dist), 'GPS verified Check-out', v_uid);

  RETURN jsonb_build_object(
    'success', true,
    'status', 'checked_out',
    'message', 'Check-out successful! Attendance record completed.',
    'distance_meters', round(v_dist, 1),
    'working_minutes', v_minutes,
    'attendance_id', v_rec.id,
    'server_timestamp', v_now
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

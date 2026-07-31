-- Migration script for Attendance Management (Sessions, Password Hash, GPS Radius, Reopen Cycle & Correction Log)

-- Add missing columns to attendance_sessions if not present
ALTER TABLE public.attendance_sessions 
  ADD COLUMN IF NOT EXISTS session_code TEXT,
  ADD COLUMN IF NOT EXISTS cycle_number INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS parent_session_id UUID REFERENCES public.attendance_sessions(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'live', -- 'live', 'paused', 'closed', 'scheduled'
  ADD COLUMN IF NOT EXISTS default_duration_minutes INTEGER NOT NULL DEFAULT 15,
  ADD COLUMN IF NOT EXISTS max_extension_minutes INTEGER NOT NULL DEFAULT 60;

-- Add missing columns to attendance_records for status, distance, accuracy and correction tracking
ALTER TABLE public.attendance_records
  ADD COLUMN IF NOT EXISTS distance_meters NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS gps_accuracy NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS correction_reason TEXT,
  ADD COLUMN IF NOT EXISTS correction_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS cycle_number INTEGER NOT NULL DEFAULT 1;

-- Add 'manual_present', 'not_marked' values to attendance_status type if applicable or handle in check constraint
-- Create Attendance Correction Audit Table
CREATE TABLE IF NOT EXISTS public.attendance_correction_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  record_id UUID REFERENCES public.attendance_records(id) ON DELETE CASCADE,
  session_id UUID NOT NULL REFERENCES public.attendance_sessions(id) ON DELETE CASCADE,
  intern_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  old_status TEXT,
  new_status TEXT NOT NULL,
  reason TEXT NOT NULL,
  corrected_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Attendance System Settings Table
CREATE TABLE IF NOT EXISTS public.attendance_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  default_duration_minutes INTEGER NOT NULL DEFAULT 15,
  default_radius_meters INTEGER NOT NULL DEFAULT 100,
  late_threshold_minutes INTEGER NOT NULL DEFAULT 5,
  require_gps BOOLEAN NOT NULL DEFAULT TRUE,
  require_password BOOLEAN NOT NULL DEFAULT TRUE,
  allow_reopen BOOLEAN NOT NULL DEFAULT TRUE,
  max_extension_minutes INTEGER NOT NULL DEFAULT 60,
  updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insert default settings row if empty
INSERT INTO public.attendance_settings (default_duration_minutes, default_radius_meters, late_threshold_minutes, require_gps, require_password, allow_reopen, max_extension_minutes)
SELECT 15, 100, 5, true, true, true, 60
WHERE NOT EXISTS (SELECT 1 FROM public.attendance_settings);

-- Enable RLS
ALTER TABLE public.attendance_correction_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Super admins manage attendance_settings" ON public.attendance_settings FOR ALL TO authenticated USING (public.is_super_admin());
CREATE POLICY "Authenticated users view attendance_settings" ON public.attendance_settings FOR SELECT TO authenticated USING (true);

CREATE POLICY "Super admins manage attendance_correction_logs" ON public.attendance_correction_logs FOR ALL TO authenticated USING (public.is_super_admin());
CREATE POLICY "Authenticated users view attendance_correction_logs" ON public.attendance_correction_logs FOR SELECT TO authenticated USING (true);

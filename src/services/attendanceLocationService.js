import { supabase } from '../lib/supabase';
import { calculateGpsDistanceMeters } from '../utils/attendanceUtils';


/**
 * Fetch all attendance locations for Super Admin management
 */
export async function fetchAttendanceLocations() {
  try {
    const { data, error } = await supabase
      .from('attendance_locations')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return data || [];
  } catch (err) {
    console.error('[AttendanceService] Error fetching locations:', err);
    throw err;
  }
}

/**
 * Save / Create / Update Attendance Location (Super Admin)
 */
export async function saveAttendanceLocation(locationData) {
  try {
    const payload = {
      location_name: locationData.location_name,
      address: locationData.address || '',
      latitude: parseFloat(locationData.latitude),
      longitude: parseFloat(locationData.longitude),
      allowed_radius_meters: parseInt(locationData.allowed_radius_meters, 10) || 100,
      maximum_accuracy_meters: parseInt(locationData.maximum_accuracy_meters, 10) || 100,
      check_in_start_time: locationData.check_in_start_time || '08:00:00',
      check_in_end_time: locationData.check_in_end_time || '12:00:00',
      check_out_start_time: locationData.check_out_start_time || '16:00:00',
      check_out_end_time: locationData.check_out_end_time || '21:00:00',
      status: locationData.status || 'active',
      active_from: locationData.active_from || new Date().toISOString().split('T')[0]
    };

    if (locationData.id) {
      const { data, error } = await supabase
        .from('attendance_locations')
        .update(payload)
        .eq('id', locationData.id)
        .select()
        .single();

      if (error) throw error;
      return { success: true, data };
    } else {
      const { data, error } = await supabase
        .from('attendance_locations')
        .insert([payload])
        .select()
        .single();

      if (error) throw error;

      // Insert assignment mapping
      if (data?.id) {
        await supabase.from('attendance_location_assignments').insert([{
          location_id: data.id,
          assignment_type: locationData.assignment_type || 'all',
          problem_statement_id: locationData.problem_statement_id || null,
          college_id: locationData.college_id || null,
          city: locationData.city || null,
          intern_id: locationData.intern_id || null
        }]);
      }

      return { success: true, data };
    }
  } catch (err) {
    console.error('[AttendanceService] Error saving location:', err);
    return { success: false, message: err.message || 'Failed to save location' };
  }
}

/**
 * Toggle location status (active/inactive)
 */
export async function toggleLocationStatus(locationId, currentStatus) {
  try {
    const nextStatus = currentStatus === 'active' ? 'inactive' : 'active';
    const { data, error } = await supabase
      .from('attendance_locations')
      .update({ status: nextStatus })
      .eq('id', locationId)
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (err) {
    return { success: false, message: err.message };
  }
}

/**
 * Delete location
 */
export async function deleteAttendanceLocation(locationId) {
  try {
    const { error } = await supabase
      .from('attendance_locations')
      .delete()
      .eq('id', locationId);

    if (error) throw error;
    return { success: true };
  } catch (err) {
    return { success: false, message: err.message };
  }
}

/**
 * Fetch intern's assigned active attendance location
 */
export async function fetchAssignedInternLocation(userId) {
  try {
    // 1. Direct location lookup
    const { data: locs, error } = await supabase
      .from('attendance_locations')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) throw error;

    if (locs && locs.length > 0) {
      return locs[0];
    }

    return null;
  } catch (err) {
    console.error('[AttendanceService] Error fetching assigned location:', err);
    throw err;
  }
}

/**
 * Secure Backend Check-in call
 */
export async function performCheckInWithLocation({ locationId, latitude, longitude, accuracy }) {
  try {
    const { data, error } = await supabase.rpc('check_in_with_location', {
      p_location_id: locationId,
      p_current_latitude: latitude,
      p_current_longitude: longitude,
      p_gps_accuracy: accuracy
    });

    if (error) {
      console.error('[AttendanceService] RPC check_in_with_location error:', error);
      throw error;
    }

    return data;
  } catch (err) {
    console.error('[AttendanceService] Check-in error:', err);
    return { success: false, message: err.message || 'Check-in verification failed.' };
  }
}

/**
 * Secure Backend Check-out call
 */
export async function performCheckOutWithLocation({ attendanceId, latitude, longitude, accuracy }) {
  try {
    const { data, error } = await supabase.rpc('check_out_with_location', {
      p_attendance_id: attendanceId,
      p_current_latitude: latitude,
      p_current_longitude: longitude,
      p_gps_accuracy: accuracy
    });

    if (error) {
      console.error('[AttendanceService] RPC check_out_with_location error:', error);
      throw error;
    }

    return data;
  } catch (err) {
    console.error('[AttendanceService] Check-out error:', err);
    return { success: false, message: err.message || 'Check-out verification failed.' };
  }
}

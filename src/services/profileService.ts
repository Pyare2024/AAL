import { supabase } from '../lib/supabase';
import { ProfileData } from '../types/profileTypes';

/**
 * Fetch intern profile details
 */
export async function fetchProfileData(userId: string): Promise<ProfileData> {
  try {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select(`
        *,
        problem_statements:problem_statement_id ( title )
      `)
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      throw error;
    }
    
    if (!profile) {
      const notFoundErr = new Error('Profile not found');
      (notFoundErr as any).code = 'PROFILE_NOT_FOUND';
      throw notFoundErr;
    }

    return mapDbProfileToProfileData(profile);
  } catch (err) {
    console.error('[ProfileService] Error fetching profile:', err);
    throw err;
  }
}

/**
 * Update editable personal information
 */
export async function updatePersonalInformation(userId: string, personalData: Partial<ProfileData['personal']>) {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .update({
        full_name: personalData.fullName,
        mobile: personalData.mobile,
        whatsapp_number: personalData.whatsappNumber,
        date_of_birth: personalData.dateOfBirth ? personalData.dateOfBirth : null,
        gender: personalData.gender,
        city: personalData.city,
        state: personalData.state,
        country: personalData.country,
        professional_bio: personalData.professionalBio,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error('[ProfileService] Update failed:', error.message);
      throw error;
    }

    return { success: true, message: 'Your profile has been updated successfully.', data };
  } catch (err) {
    console.error('[ProfileService] Error updating profile:', err);
    throw err;
  }
}

function mapDbProfileToProfileData(p: any): ProfileData {
  const shortId = p.id ? `AAL-INT-${p.id.slice(0, 5).toUpperCase()}` : '';
  return {
    id: p.id,
    profilePhotoUrl: p.profile_photo_url || undefined,
    completionPercentage: p.completion_percentage || 0,
    personal: {
      fullName: p.full_name || '',
      email: p.email || '',
      internId: shortId,
      mobile: p.mobile || '',
      whatsappNumber: p.whatsapp_number || '',
      dateOfBirth: p.date_of_birth || '',
      gender: p.gender || '',
      city: p.city || '',
      state: p.state || '',
      country: p.country || '',
      professionalBio: p.professional_bio || ''
    },
    internship: {
      problemStatement: p.problem_statements?.title || 'Unassigned',
      assignedAdmin: p.assigned_admin || 'Unassigned',
      status: p.account_status || 'inactive',
      internshipStartDate: p.internship_start_date || '',
      internshipEndDate: p.internship_end_date || '',
      currentWeek: p.current_week || 1,
      duration: p.duration || '6 Months',
      batch: p.batch || '',
      workMode: p.work_mode || '',
      assignedLocation: p.assigned_location || ''
    }
  };
}

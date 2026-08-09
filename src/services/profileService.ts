import { supabase } from '../lib/supabase';
import { ProfileData } from '../types/profileTypes';

/**
 * Fetch intern profile details
 */
export async function fetchProfileData(userId: string): Promise<ProfileData> {
  if (!userId) {
    throw new Error('User ID is required to fetch profile data.');
  }

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

    let assignedAdminName = 'Unassigned';

    // Secondary secure lookup for Assigned Admin
    if (profile.problem_statement_id) {
      const { data: adminAlloc, error: allocError } = await supabase
        .from('admin_problem_statements')
        .select('admin_id')
        .eq('problem_statement_id', profile.problem_statement_id)
        .limit(1)
        .maybeSingle();

      if (allocError) {
        throw allocError;
      }

      if (adminAlloc?.admin_id) {
        const { data: adminProfile, error: adminError } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', adminAlloc.admin_id)
          .maybeSingle();
        
        if (adminError) {
          throw adminError;
        }

        if (adminProfile) {
          assignedAdminName = adminProfile.full_name;
        }
      }
    }

    return mapDbProfileToProfileData(profile, assignedAdminName);
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
        date_of_birth: personalData.dateOfBirth ? personalData.dateOfBirth : null,
        gender: personalData.gender,
        city: personalData.city,
        linkedin_url: personalData.linkedInUrl,
        github_url: personalData.githubUrl,
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

function mapDbProfileToProfileData(p: any, assignedAdminName: string = 'Unassigned'): ProfileData {
  const shortId = p.id ? `AAL-INT-${p.id.slice(0, 5).toUpperCase()}` : '';
  
  const personal = {
    fullName: p.full_name || '',
    email: p.email || '',
    internId: shortId,
    mobile: p.mobile || '',
    dateOfBirth: p.date_of_birth || '',
    gender: p.gender || '',
    city: p.city || '',
    linkedInUrl: p.linkedin_url || '',
    githubUrl: p.github_url || ''
  };

  // Dynamic Profile Completion Calculation
  const fieldsToCheck = [
    personal.fullName,
    personal.mobile,
    personal.dateOfBirth,
    personal.gender,
    personal.city,
    personal.linkedInUrl,
    personal.githubUrl
  ];
  
  const filledFields = fieldsToCheck.filter(field => field && field.toString().trim() !== '').length;
  const completionPercentage = Math.round((filledFields / fieldsToCheck.length) * 100);

  return {
    id: p.id,
    profilePhotoUrl: p.profile_photo_url || undefined,
    completionPercentage,
    personal,
    internship: {
      problemStatement: p.problem_statements?.title || 'Unassigned',
      assignedAdmin: assignedAdminName,
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

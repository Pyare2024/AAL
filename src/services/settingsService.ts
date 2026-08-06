import { supabase } from '../lib/supabase';
import { GeneralPreferences, ReadOnlyAccountInfo } from '../types/settingsTypes';

/**
 * Fetch Account Summary and User Preferences
 */
export async function fetchGeneralSettings(userId: string): Promise<{
  accountInfo: ReadOnlyAccountInfo;
  preferences: GeneralPreferences;
}> {
  try {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      throw error;
    }
    
    if (!profile) {
      const err = new Error('Profile not found');
      (err as any).code = 'PROFILE_NOT_FOUND';
      throw err;
    }

    const shortId = profile.id ? `AAL-INT-${profile.id.slice(0, 5).toUpperCase()}` : '';

    return {
      accountInfo: {
        fullName: profile.full_name || '',
        email: profile.email || '',
        internId: shortId,
        role: 'INTERN',
        profilePhotoUrl: profile.profile_photo_url || undefined
      },
      preferences: {
        displayName: profile.full_name || '',
        mobile: profile.mobile || '',
        whatsappNumber: profile.whatsapp_number || '',
        preferredLanguage: 'English',
        timezone: 'Asia/Kolkata',
        dateFormat: 'DD/MM/YYYY'
      }
    };
  } catch (err) {
    console.error('[SettingsService] Error:', err);
    throw err;
  }
}

/**
 * Save updated General Preferences to backend
 */
export async function saveGeneralPreferences(userId: string, updated: GeneralPreferences): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: updated.displayName,
        mobile: updated.mobile,
        whatsapp_number: updated.whatsappNumber,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (error) {
      console.error('[SettingsService] Update error:', error.message);
      throw error;
    }
    return true;
  } catch (err) {
    console.error('[SettingsService] Save failed:', err);
    throw err;
  }
}

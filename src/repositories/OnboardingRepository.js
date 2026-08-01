import { supabase } from '../lib/supabase';

/**
 * Onboarding Repository Abstraction
 * Encapsulates direct database queries for public.onboarding_progress table
 */
export class OnboardingRepository {
  static async getByInternId(internId) {
    const { data, error } = await supabase
      .from('onboarding_progress')
      .select('*')
      .eq('intern_id', internId)
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  static async getByInternIds(internIds) {
    if (!internIds || internIds.length === 0) return [];
    const { data, error } = await supabase
      .from('onboarding_progress')
      .select('*')
      .in('intern_id', internIds);

    if (error) throw error;
    return data || [];
  }

  static async upsertProgress(payload) {
    const { data, error } = await supabase
      .from('onboarding_progress')
      .upsert(payload, { onConflict: 'intern_id' })
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}

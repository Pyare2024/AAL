import { supabase } from '../lib/supabase';

/**
 * Profile Repository Abstraction
 * Enapsulates direct database queries for public.profiles table
 */
export class ProfileRepository {
  static async getById(userId) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  static async getByIdWithProblemStatement(userId) {
    const { data, error } = await supabase
      .from('profiles')
      .select(`
        *,
        problem_statements!problem_statement_id (id, title, slug)
      `)
      .eq('id', userId)
      .single();

    if (error) throw error;
    return data;
  }

  static async getByIds(userIds) {
    if (!userIds || userIds.length === 0) return [];
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .in('id', userIds);

    if (error) throw error;
    return data || [];
  }

  static async updateProfile(userId, updates) {
    const { data, error } = await supabase
      .from('profiles')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}

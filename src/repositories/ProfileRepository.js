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
      .select('id, full_name, email, mobile, account_status, onboarding_status, created_at')
      .in('id', userIds);

    if (error) throw error;
    return data || [];
  }

  static async getPaginatedProfiles({ page = 1, pageSize = 20, search = '' }) {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase
      .from('profiles')
      .select('id, full_name, email, account_status, onboarding_status, created_at', { count: 'exact' });

    if (search && search.trim()) {
      query = query.or(`full_name.ilike.%${search.trim()}%,email.ilike.%${search.trim()}%`);
    }

    const { data, count, error } = await query.range(from, to).order('created_at', { ascending: false });

    if (error) throw error;
    return { data: data || [], total: count || 0, page, pageSize };
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

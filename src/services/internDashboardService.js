import { supabase } from '../lib/supabase';

/**
 * Service encapsulating Intern Dashboard summary aggregation RPC
 */
export async function fetchInternDashboardSummary() {
  const { data, error } = await supabase.rpc('get_intern_dashboard_summary');

  if (error) {
    console.error('Error executing get_intern_dashboard_summary RPC:', error);
    throw error;
  }

  return data || {};
}

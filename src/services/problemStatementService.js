import { supabase } from '../lib/supabase';

export const problemStatementService = {
  /**
   * Fetch all problem statements with accurate allocated admin and intern counts securely.
   */
  async fetchProblemStatements() {
    const { data, error } = await supabase.rpc('get_problem_statements_with_counts');
    if (error) {
      console.error('[ProblemStatementService] fetchProblemStatements error:', error);
      throw new Error(error.message || 'Failed to fetch problem statements');
    }
    return data || [];
  },

  /**
   * Create a new problem statement.
   */
  async createProblemStatement(payload) {
    const { data, error } = await supabase
      .from('problem_statements')
      .insert([{
        title: payload.title.trim(),
        slug: payload.slug.trim(),
        description: payload.description.trim(),
        status: payload.status,
        created_by: payload.created_by,
      }])
      .select()
      .single();

    if (error) {
      console.error('[ProblemStatementService] createProblemStatement error:', error);
      throw new Error(error.message || 'Failed to create problem statement');
    }
    return data;
  },

  /**
   * Update an existing problem statement's details.
   */
  async updateProblemStatement(id, payload) {
    const { data, error } = await supabase
      .from('problem_statements')
      .update({
        title: payload.title.trim(),
        slug: payload.slug.trim(),
        description: payload.description.trim(),
        status: payload.status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('[ProblemStatementService] updateProblemStatement error:', error);
      throw new Error(error.message || 'Failed to update problem statement');
    }
    return data;
  },

  /**
   * Activate or Deactivate a problem statement.
   */
  async updateProblemStatementStatus(id, newStatus) {
    const { data, error } = await supabase
      .from('problem_statements')
      .update({
        status: newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('[ProblemStatementService] updateProblemStatementStatus error:', error);
      throw new Error(error.message || `Failed to change status to ${newStatus}`);
    }
    return data;
  },

  /**
   * Safe delete a problem statement through RPC.
   */
  async deleteProblemStatement(id) {
    const { data, error } = await supabase.rpc('delete_problem_statement_safe', { p_id: id });

    if (error) {
      console.error('[ProblemStatementService] deleteProblemStatement error:', error);
      // Format error for UI cleanly based on PostgreSQL exception text
      let safeErrorMsg = 'Unable to delete Problem Statement. Please try again.';
      if (error.message) {
        if (error.message.includes('DEPENDENCY:')) {
          safeErrorMsg = 'This Problem Statement cannot be deleted because it has existing allocations or history. Deactivate it instead.';
        } else if (error.message.includes('NOT_FOUND:')) {
          safeErrorMsg = 'Problem Statement not found.';
        } else if (error.message.includes('UNAUTHORIZED:')) {
          safeErrorMsg = 'You are not authorized to delete Problem Statements.';
        } else {
          // Keep other technical details in console, but return safe string
          safeErrorMsg = 'Unable to delete Problem Statement due to an unexpected error.';
        }
      }
      throw new Error(safeErrorMsg);
    }

    return data;
  }
};

import { supabase } from '../lib/supabase';

/**
 * Service layer for sending optional interview email notifications.
 * Invokes the 'send-interview-email' Supabase Edge Function securely.
 * Failure to send an email NEVER breaks or reverts the saved Interview record.
 */
export async function sendInterviewEmailNotification({ internId, interviewId }) {
  if (!internId || !interviewId) {
    throw new Error('Intern ID and Interview ID are required to send an interview email.');
  }

  try {
    const { data, error } = await supabase.functions.invoke('send-interview-email', {
      body: {
        intern_id: internId,
        interview_id: interviewId,
      },
    });

    if (error) {
      console.warn('Edge function send-interview-email returned error:', error);
      return {
        success: false,
        error: error.message || 'Failed to dispatch email via Edge Function.',
      };
    }

    return {
      success: true,
      emailSent: data?.email_sent ?? true,
      message: data?.message || 'Interview email dispatched successfully.',
    };
  } catch (err) {
    console.warn('Network or Edge Function invocation exception:', err);
    return {
      success: false,
      error: err.message || 'Network exception while connecting to email service.',
    };
  }
}

import { useEffect, useState, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { ONBOARDING_INTERNS_QUERY_KEY } from './useOnboardingInterns';

/**
 * Reusable Supabase Realtime Hook for Super Admin Onboarding Management.
 * Subscribes to changes on:
 * - profiles
 * - onboarding_progress
 * - questionnaire_responses
 * - onboarding_final_submissions
 * - interviews
 *
 * Automatically invalidates/refetches TanStack Query key and tracks connection status.
 */
export function useOnboardingRealtime(onNotification) {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState('CONNECTING'); // 'LIVE' | 'CONNECTING' | 'DISCONNECTED'
  const notificationCallbackRef = useRef(onNotification);

  // Keep ref up to date to avoid stale closures in event handler
  useEffect(() => {
    notificationCallbackRef.current = onNotification;
  }, [onNotification]);

  useEffect(() => {
    let debounceTimer = null;

    const handleRealtimeChange = (payload) => {
      // Debounce rapid events within 300ms
      if (debounceTimer) clearTimeout(debounceTimer);

      debounceTimer = setTimeout(() => {
        // Invalidate and refetch onboarding interns query in TanStack Query
        queryClient.invalidateQueries({ queryKey: ONBOARDING_INTERNS_QUERY_KEY });

        // Fire toast notification if callback supplied
        if (notificationCallbackRef.current) {
          const tableName = payload.table;
          const eventType = payload.eventType;
          let msg = 'Onboarding data updated in real-time.';

          if (tableName === 'onboarding_progress') {
            msg = 'An Intern updated their onboarding progress step.';
          } else if (tableName === 'profiles') {
            msg = 'Intern profile information was updated.';
          } else if (tableName === 'questionnaire_responses') {
            msg = 'An Intern submitted questionnaire responses.';
          } else if (tableName === 'onboarding_final_submissions') {
            msg = 'An Intern submitted their 7 Activities folder.';
          } else if (tableName === 'interviews') {
            msg = 'Interview schedule or evaluation status updated.';
          }

          notificationCallbackRef.current({
            id: `notif-${Date.now()}`,
            message: msg,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            eventType,
            tableName,
          });
        }
      }, 300);
    };

    // Create a single shared channel subscription
    const channel = supabase.channel('super-admin-onboarding-realtime');

    channel
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'profiles' },
        handleRealtimeChange
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'onboarding_progress' },
        handleRealtimeChange
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'questionnaire_responses' },
        handleRealtimeChange
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'onboarding_final_submissions' },
        handleRealtimeChange
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'interviews' },
        handleRealtimeChange
      )
      .subscribe((subscribeStatus, err) => {
        if (subscribeStatus === 'SUBSCRIBED') {
          setStatus('LIVE');
        } else if (subscribeStatus === 'CHANNEL_ERROR') {
          console.warn('Supabase Realtime channel error:', err);
          setStatus('DISCONNECTED');
        } else if (subscribeStatus === 'CLOSED') {
          setStatus('DISCONNECTED');
        } else {
          setStatus('CONNECTING');
        }
      });

    return () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return { status };
}

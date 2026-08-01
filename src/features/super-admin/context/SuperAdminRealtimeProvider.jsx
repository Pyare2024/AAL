import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../features/auth/context/AuthContext';

const SuperAdminRealtimeContext = createContext(null);

export function SuperAdminRealtimeProvider({ children }) {
  const { user, role } = useAuth();
  const [realtimeData, setRealtimeData] = useState(null);

  useEffect(() => {
    // Only subscribe if authenticated user is a super_admin
    if (!user || role !== 'super_admin') return;

    // Single domain-scoped channel instance for Super Admin portal
    const channelName = 'aal-super-admin-realtime';
    const channel = supabase.channel(channelName);

    channel
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'onboarding_progress' },
        (payload) => {
          setRealtimeData({ table: 'onboarding_progress', event: payload.eventType, new: payload.new });
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'profiles' },
        (payload) => {
          setRealtimeData({ table: 'profiles', event: payload.eventType, new: payload.new });
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log(`[Realtime] Subscribed to domain channel: ${channelName}`);
        }
      });

    return () => {
      console.log(`[Realtime] Unsubscribing & removing domain channel: ${channelName}`);
      supabase.removeChannel(channel);
    };
  }, [user?.id, role]);

  return (
    <SuperAdminRealtimeContext.Provider value={{ realtimeData }}>
      {children}
    </SuperAdminRealtimeContext.Provider>
  );
}

export function useSuperAdminRealtime() {
  return useContext(SuperAdminRealtimeContext);
}

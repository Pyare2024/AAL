import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabase';

const AuthContext = createContext({
  user: null,
  profile: null,
  role: null,
  onboardingProgress: null,
  loading: true,
  signUp: async () => {},
  signIn: async () => {},
  signOut: async () => {},
  resetPassword: async () => {},
  updatePassword: async () => {},
  refreshUserData: async () => {},
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [role, setRole] = useState(null);
  const [onboardingProgress, setOnboardingProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const fetchPromiseRef = React.useRef(null);
  const lastAuthUserId = React.useRef(null);

  const fetchUserData = async (authUser) => {
    if (!authUser) {
      setUser(null);
      setProfile(null);
      setRole(null);
      setOnboardingProgress(null);
      setLoading(false);
      lastAuthUserId.current = null;
      return;
    }

    if (fetchPromiseRef.current && lastAuthUserId.current === authUser.id) {
      return fetchPromiseRef.current;
    }

    const performFetch = async () => {
      try {
        setUser(authUser);

      // Consolidated Single RPC Call for User Context
      const { data: ctxData, error: ctxErr } = await supabase.rpc('get_current_user_context');

      if (ctxErr) {
        console.error('RPC Error:', ctxErr);
        throw new Error('Failed to retrieve user context.');
      }

      // Enforce account_status security for Admins and Interns
      let activeProfile = ctxData?.profile;
      if (activeProfile && activeProfile.account_status !== 'active') {
        console.warn('AuthContext: Account is inactive. Signing out.');
        
        // Prevent double logout if already logged out
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
           await supabase.auth.signOut();
        }
        
        setUser(null);
        setProfile(null);
        setRole(null);
        setOnboardingProgress(null);
        setLoading(false);
        throw new Error('Your account is no longer active.');
      }

      if (ctxData && ctxData.authenticated) {
        if (ctxData.profile) setProfile(ctxData.profile);
        if (ctxData.user?.role) setRole(ctxData.user.role);
        if (ctxData.onboarding_progress) setOnboardingProgress(ctxData.onboarding_progress);

        return {
          user: authUser,
          profile: ctxData.profile,
          role: ctxData.user?.role,
          onboardingProgress: ctxData.onboarding_progress,
        };
      }

      return null;
      } catch (err) {
        if (err.message === 'Your account is no longer active.') {
          // Expected controlled rejection
          throw err;
        }
        console.error('Error loading user auth context state:', err);
        return null;
      } finally {
        setLoading(false);
      }
    };

    fetchPromiseRef.current = performFetch();
    lastAuthUserId.current = authUser.id;

    try {
      return await fetchPromiseRef.current;
    } finally {
      fetchPromiseRef.current = null;
    }
  };


  useEffect(() => {
    let isMounted = true;
    // Initial Session Check
    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        if (isMounted) {
          fetchUserData(session?.user || null).catch((err) => {
            if (err.message !== 'Your account is no longer active.') {
              console.error('Session user fetch error:', err);
            }
          });
        }
      })
      .catch((err) => {
        console.error('Session get error:', err);
        if (isMounted) setLoading(false);
      });

    // Fallback Safety Timeout in case Supabase API network call is pending/unconfigured
    const timer = setTimeout(() => {
      if (isMounted && loading) {
        setLoading(false);
      }
    }, 1200);

    // Listen to Auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (isMounted) {
        fetchUserData(session?.user || null).catch((err) => {
          if (err.message !== 'Your account is no longer active.') {
            console.error('Auth listener fetch error:', err);
          }
        });
      }
    });

    return () => {
      isMounted = false;
      clearTimeout(timer);
      subscription.unsubscribe();
    };
  }, []);

  const signUp = async ({ email, password, fullName, mobile }) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName ? fullName.trim() : '',
          mobile: mobile ? mobile.trim() : null,
        },
      },
    });

    if (error) throw error;
    const authUser = data.user;
    if (!authUser) throw new Error('Registration failed. No user object returned.');

    await fetchUserData(authUser);
    return data;
  };

  const signIn = async ({ email, password }) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    
    // fetchUserData will deduplicate if onAuthStateChange also triggered it
    const userData = await fetchUserData(data.user);
    return userData;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setUser(null);
    setProfile(null);
    setRole(null);
    setOnboardingProgress(null);
  };

  const resetPassword = async (email) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) throw error;
  };

  const updatePassword = async (newPassword) => {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw error;
  };

  const refreshUserData = async () => {
    if (user) {
      return await fetchUserData(user);
    }
    return null;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        role,
        onboardingProgress,
        loading,
        signUp,
        signIn,
        signOut,
        resetPassword,
        updatePassword,
        refreshUserData,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

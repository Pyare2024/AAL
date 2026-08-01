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

  const fetchUserData = async (authUser) => {
    if (!authUser) {
      setUser(null);
      setProfile(null);
      setRole(null);
      setOnboardingProgress(null);
      setLoading(false);
      return;
    }

    try {
      setUser(authUser);

      // Consolidated Single RPC Call for User Context
      const { data: ctxData, error: ctxErr } = await supabase.rpc('get_current_user_context');

      if (!ctxErr && ctxData && ctxData.authenticated) {
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

      // Fallback in case RPC is not deployed in local development environment
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .maybeSingle();

      if (profileData) setProfile(profileData);

      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', authUser.id)
        .maybeSingle();

      if (roleData) setRole(roleData.role);

      let fetchedProgress = null;
      if (roleData?.role === 'intern' || !roleData) {
        const { data: onboardingData } = await supabase
          .from('onboarding_progress')
          .select('*')
          .eq('intern_id', authUser.id)
          .maybeSingle();

        if (onboardingData) {
          setOnboardingProgress(onboardingData);
          fetchedProgress = onboardingData;
        }
      }

      return {
        user: authUser,
        profile: profileData,
        role: roleData?.role,
        onboardingProgress: fetchedProgress,
      };
    } catch (err) {
      console.error('Error loading user auth context state:', err);
      return null;
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    let isMounted = true;
    // Initial Session Check
    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        if (isMounted) fetchUserData(session?.user || null);
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
      if (isMounted) fetchUserData(session?.user || null);
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
    await fetchUserData(data.user);
    return data;
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

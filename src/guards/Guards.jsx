import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../features/auth/context/AuthContext';
import { 
  getNextOnboardingRoute, 
  isOnboardingCompleted, 
  STEP_ORDER, 
  ONBOARDING_ROUTES 
} from '../utils/onboardingUtils';
import { Loader2 } from 'lucide-react';

export function AuthGuard({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F7F7F7] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 text-[#FF3D00] animate-spin" />
          <span className="text-xs font-semibold text-[#9A9A9A]">Verifying Session...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}

export function RoleGuard({ allowedRoles, children }) {
  const { role, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F7F7F7] flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-[#FF3D00] animate-spin" />
      </div>
    );
  }

  if (!role || !allowedRoles.includes(role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
}

/**
 * OnboardingGuard protects all Intern Dashboard routes (/intern/*).
 * Locks dashboard access until onboarding is 100% completed in onboarding_progress.
 * Always redirects incomplete interns to their exact required step.
 */
export function OnboardingGuard({ children }) {
  const { role, profile, onboardingProgress, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F7F7F7] flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-[#FF3D00] animate-spin" />
      </div>
    );
  }

  if (role === 'intern') {
    const isCompleted = isOnboardingCompleted(onboardingProgress) || profile?.onboarding_status === 'completed';
    if (!isCompleted) {
      const requiredRoute = getNextOnboardingRoute(onboardingProgress);
      return <Navigate to={requiredRoute} replace />;
    }
  }

  return children;
}

/**
 * OnboardingStepGuard protects individual /onboarding/* routes to enforce strict sequential completion.
 * Prevents an intern from skipping forward to later onboarding steps.
 */
export function OnboardingStepGuard({ children }) {
  const { role, profile, onboardingProgress, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F7F7F7] flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-[#FF3D00] animate-spin" />
      </div>
    );
  }

  if (role === 'intern') {
    const isCompleted = isOnboardingCompleted(onboardingProgress) || profile?.onboarding_status === 'completed';
    if (isCompleted) {
      if (process.env.NODE_ENV !== 'production') {
        console.log('Guard requested path:', location.pathname);
        console.log('Guard redirect destination:', ONBOARDING_ROUTES.DASHBOARD);
      }
      return <Navigate to={ONBOARDING_ROUTES.DASHBOARD} replace />;
    }

    const requiredRoute = getNextOnboardingRoute(onboardingProgress);

    const currentAttemptedOrder = STEP_ORDER[location.pathname] || 1;
    const requiredOrder = STEP_ORDER[requiredRoute] || 1;

    if (process.env.NODE_ENV !== 'production') {
      console.log('Current onboarding status:', profile?.onboarding_status);
      console.log('Guard requested path:', location.pathname);
      console.log('Required onboarding route:', requiredRoute);
      if (currentAttemptedOrder > requiredOrder) {
        console.log('Guard redirect destination:', requiredRoute);
      }
    }

    // If intern tries to skip ahead to a future step, force redirect to the required step
    if (currentAttemptedOrder > requiredOrder) {
      return <Navigate to={requiredRoute} replace />;
    }
  }

  return children;
}


import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

export function Unauthorized() {
  return (
    <div className="text-center py-6 space-y-4">
      <div className="w-14 h-14 rounded-2xl bg-[#FF3D00]/10 border border-[#FF3D00]/20 text-[#FF3D00] flex items-center justify-center mx-auto">
        <ShieldAlert className="h-8 w-8" />
      </div>
      <h2 className="text-xl font-bold text-[#0D0D0D]">Access Denied</h2>
      <p className="text-xs text-[#9A9A9A] max-w-xs mx-auto">
        You do not have permission to access this portal or resource.
      </p>
      <div className="pt-2">
        <Link
          to="/login"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#FF8A00] to-[#FF3D00] text-white font-semibold text-xs rounded-xl shadow-md shadow-[#FF3D00]/20 hover:opacity-95 transition-all"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Return to Sign In</span>
        </Link>
      </div>
    </div>
  );
}

export function SessionExpired() {
  return (
    <div className="text-center py-6 space-y-4">
      <div className="w-14 h-14 rounded-2xl bg-gradient-to-r from-[#FF8A00]/10 to-[#FF3D00]/10 border border-[#FF8A00]/20 text-[#FF3D00] flex items-center justify-center mx-auto">
        <ShieldAlert className="h-8 w-8" />
      </div>
      <h2 className="text-xl font-bold text-[#0D0D0D]">Session Expired</h2>
      <p className="text-xs text-[#9A9A9A] max-w-xs mx-auto">
        Your security session has expired. Please log in again to continue.
      </p>
      <div className="pt-2">
        <Link
          to="/login"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#FF8A00] to-[#FF3D00] text-white font-semibold text-xs rounded-xl shadow-md shadow-[#FF3D00]/20 hover:opacity-95 transition-all"
        >
          <span>Log In Again</span>
        </Link>
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Lock, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { validatePassword, validateConfirmPassword } from '../validators/authValidators';

export function ResetPassword() {
  const navigate = useNavigate();
  const { updatePassword } = useAuth();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const pwdErr = validatePassword(password);
    if (pwdErr) return setError(pwdErr);

    const confirmErr = validateConfirmPassword(password, confirmPassword);
    if (confirmErr) return setError(confirmErr);

    setLoading(true);
    try {
      await updatePassword(password);
      setSuccess(true);
      setTimeout(() => {
        navigate('/login');
      }, 1500);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to update password.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="text-center py-4 space-y-3">
        <div className="w-12 h-12 rounded-full bg-gradient-to-r from-[#FF8A00] to-[#FF3D00] text-white flex items-center justify-center mx-auto shadow-md">
          <CheckCircle2 className="h-6 w-6" />
        </div>
        <h2 className="text-lg font-bold text-[#0D0D0D]">Password Updated!</h2>
        <p className="text-xs text-[#9A9A9A]">Redirecting to Sign In...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 bg-[#FF3D00]/10 border border-[#FF3D00]/20 rounded-xl flex items-start gap-2 text-xs font-semibold text-[#FF3D00]">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <div>
        <label className="block text-xs font-bold text-[#0D0D0D] mb-1">New Password</label>
        <div className="relative">
          <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9A9A9A]" />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            className="w-full pl-10 pr-3 py-2.5 bg-white border border-[#D4D4D4] rounded-xl text-[#0D0D0D] text-xs focus:outline-none focus:border-[#FF8A00] transition-all"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-bold text-[#0D0D0D] mb-1">Confirm New Password</label>
        <div className="relative">
          <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9A9A9A]" />
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="••••••••"
            required
            className="w-full pl-10 pr-3 py-2.5 bg-white border border-[#D4D4D4] rounded-xl text-[#0D0D0D] text-xs focus:outline-none focus:border-[#FF8A00] transition-all"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 px-4 bg-gradient-to-r from-[#FF8A00] to-[#FF3D00] text-white font-semibold text-xs rounded-xl shadow-md shadow-[#FF3D00]/20 hover:opacity-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <span>Update Password</span>}
      </button>
    </form>
  );
}

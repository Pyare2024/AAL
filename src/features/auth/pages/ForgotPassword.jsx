import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, ArrowLeft, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { validateEmail } from '../validators/authValidators';

export function ForgotPassword() {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const emailErr = validateEmail(email);
    if (emailErr) return setError(emailErr);

    setLoading(true);
    try {
      await resetPassword(email);
      setSent(true);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to send reset link. Please check your email.');
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="text-center py-4 space-y-4">
        <div className="w-12 h-12 rounded-full bg-gradient-to-r from-[#FF8A00] to-[#FF3D00] text-white flex items-center justify-center mx-auto shadow-md shadow-[#FF3D00]/20">
          <CheckCircle2 className="h-6 w-6" />
        </div>
        <h2 className="text-lg font-bold text-[#0D0D0D]">Reset Link Sent!</h2>
        <p className="text-xs text-[#9A9A9A]">
          We have sent password reset instructions to <span className="font-semibold text-[#0D0D0D]">{email}</span>.
        </p>
        <Link to="/login" className="inline-block pt-2 text-xs font-bold text-[#FF8A00] hover:underline">
          Back to Sign In
        </Link>
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
        <label className="block text-xs font-bold text-[#0D0D0D] mb-1.5">Registered Email Address</label>
        <div className="relative">
          <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-[#9A9A9A]" />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@example.com"
            required
            className="w-full pl-11 pr-4 py-3 bg-white border border-[#D4D4D4] rounded-xl text-[#0D0D0D] text-xs focus:outline-none focus:border-[#FF8A00] transition-all"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 px-4 bg-gradient-to-r from-[#FF8A00] to-[#FF3D00] text-white font-semibold text-xs rounded-xl shadow-md shadow-[#FF3D00]/20 hover:opacity-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <span>Send Reset Instructions</span>}
      </button>

      <div className="text-center pt-2">
        <Link to="/login" className="inline-flex items-center gap-1 text-xs font-bold text-[#9A9A9A] hover:text-[#0D0D0D] transition-colors">
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Sign In</span>
        </Link>
      </div>
    </form>
  );
}

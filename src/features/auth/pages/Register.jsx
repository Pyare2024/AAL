import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, User, Phone, ArrowRight, AlertCircle, Loader2, CheckCircle2 } from 'lucide-react';
import { validateEmail, validatePassword, validateConfirmPassword, validateFullName, validateMobile } from '../validators/authValidators';

export function Register() {
  const navigate = useNavigate();
  const { signUp } = useAuth();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const nameErr = validateFullName(fullName);
    if (nameErr) return setError(nameErr);

    const emailErr = validateEmail(email);
    if (emailErr) return setError(emailErr);

    const mobileErr = validateMobile(mobile);
    if (mobileErr) return setError(mobileErr);

    const pwdErr = validatePassword(password);
    if (pwdErr) return setError(pwdErr);

    const confirmErr = validateConfirmPassword(password, confirmPassword);
    if (confirmErr) return setError(confirmErr);

    setLoading(true);
    try {
      await signUp({ email, password, fullName, mobile });
      setSuccess(true);
      setTimeout(() => {
        navigate('/onboarding/profile');
      }, 1500);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Registration failed. Email may already be registered.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="text-center py-6 space-y-4">
        <div className="w-12 h-12 rounded-full bg-gradient-to-r from-[#FF8A00] to-[#FF3D00] text-white flex items-center justify-center mx-auto shadow-md shadow-[#FF3D00]/25">
          <CheckCircle2 className="h-6 w-6" />
        </div>
        <h2 className="text-xl font-bold text-[#0D0D0D]">Account Created!</h2>
        <p className="text-xs text-[#9A9A9A]">Redirecting to profile onboarding...</p>
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
        <label className="block text-xs font-bold text-[#0D0D0D] mb-1">Full Name</label>
        <div className="relative">
          <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9A9A9A]" />
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="John Doe"
            required
            className="w-full pl-10 pr-3 py-2.5 bg-white border border-[#D4D4D4] rounded-xl text-[#0D0D0D] text-xs focus:outline-none focus:border-[#FF8A00] transition-all"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-bold text-[#0D0D0D] mb-1">Email Address</label>
        <div className="relative">
          <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9A9A9A]" />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="intern@example.com"
            required
            className="w-full pl-10 pr-3 py-2.5 bg-white border border-[#D4D4D4] rounded-xl text-[#0D0D0D] text-xs focus:outline-none focus:border-[#FF8A00] transition-all"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-bold text-[#0D0D0D] mb-1">Mobile (Optional)</label>
        <div className="relative">
          <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9A9A9A]" />
          <input
            type="tel"
            value={mobile}
            onChange={(e) => setMobile(e.target.value)}
            placeholder="+91 9876543210"
            className="w-full pl-10 pr-3 py-2.5 bg-white border border-[#D4D4D4] rounded-xl text-[#0D0D0D] text-xs focus:outline-none focus:border-[#FF8A00] transition-all"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-xs font-bold text-[#0D0D0D] mb-1">Password</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#9A9A9A]" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full pl-8 pr-2 py-2 bg-white border border-[#D4D4D4] rounded-xl text-[#0D0D0D] text-xs focus:outline-none focus:border-[#FF8A00] transition-all"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-[#0D0D0D] mb-1">Confirm</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#9A9A9A]" />
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full pl-8 pr-2 py-2 bg-white border border-[#D4D4D4] rounded-xl text-[#0D0D0D] text-xs focus:outline-none focus:border-[#FF8A00] transition-all"
            />
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 px-4 bg-gradient-to-r from-[#FF8A00] to-[#FF3D00] text-white font-semibold text-xs rounded-xl shadow-md shadow-[#FF3D00]/20 hover:opacity-95 transition-all flex items-center justify-center gap-2 group disabled:opacity-50 mt-2"
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <>
            <span>Register as Intern</span>
            <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
          </>
        )}
      </button>

      <div className="text-center pt-1">
        <p className="text-xs text-[#9A9A9A]">
          Already have an account?{' '}
          <Link to="/login" className="font-bold text-[#0D0D0D] hover:text-[#FF8A00] transition-colors">
            Sign In
          </Link>
        </p>
      </div>
    </form>
  );
}

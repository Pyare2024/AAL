import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';
import { useAuth } from '../../features/auth/context/AuthContext';

export function LoginPage() {
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setIsSubmitting(true);
    
    try {
      const userData = await signIn({ email, password });
      const userRole = userData?.role;
      
      if (userRole === 'super_admin') navigate('/super-admin/dashboard');
      else if (userRole === 'admin') navigate('/admin/dashboard');
      else navigate('/intern/dashboard');
    } catch (err) {
      setErrorMsg(err.message || 'Invalid login credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {errorMsg && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-xl flex items-center gap-2 text-sm font-medium">
          <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div>
        <label className="block text-xs font-bold text-[#0D0D0D] mb-1.5">Email Address</label>
        <div className="relative">
          <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-[#9A9A9A]" />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@example.com"
            required
            className="w-full pl-11 pr-4 py-3 bg-white border border-[#D4D4D4] rounded-xl text-[#0D0D0D] text-sm focus:outline-none focus:border-[#FF8A00] focus:ring-2 focus:ring-[#FF8A00]/20 transition-all"
          />
        </div>
      </div>

      <div>
        <div className="flex justify-between items-center mb-1.5">
          <label className="block text-xs font-bold text-[#0D0D0D]">Password</label>
          <Link to="/forgot-password" className="text-xs font-semibold text-[#FF8A00] hover:underline">
            Forgot?
          </Link>
        </div>
        <div className="relative">
          <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-[#9A9A9A]" />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            className="w-full pl-11 pr-4 py-3 bg-white border border-[#D4D4D4] rounded-xl text-[#0D0D0D] text-sm focus:outline-none focus:border-[#FF8A00] focus:ring-2 focus:ring-[#FF8A00]/20 transition-all"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full py-3.5 px-4 bg-gradient-to-r from-[#FF8A00] to-[#FF3D00] text-white font-semibold text-sm rounded-xl shadow-lg shadow-[#FF3D00]/25 hover:opacity-95 hover:shadow-xl hover:shadow-[#FF3D00]/35 disabled:opacity-70 transition-all flex items-center justify-center gap-2 group"
      >
        <span>{isSubmitting ? 'Signing in...' : 'Sign In to Dashboard'}</span>
        {!isSubmitting && <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />}
      </button>

      <div className="text-center pt-2">
        <p className="text-xs text-[#9A9A9A]">
          Don't have an account?{' '}
          <Link to="/register" className="font-bold text-[#0D0D0D] hover:text-[#FF8A00] transition-colors">
            Register here
          </Link>
        </p>
      </div>
    </form>
  );
}

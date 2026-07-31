import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../../../lib/supabase';
import { Mail, Lock, ArrowRight, AlertCircle, Loader2 } from 'lucide-react';
import { validateEmail } from '../validators/authValidators';

export function Login() {
  const navigate = useNavigate();
  const { signIn } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const emailErr = validateEmail(email);
    if (emailErr) {
      setError(emailErr);
      return;
    }

    if (!password) {
      setError('Password is required.');
      return;
    }

    setLoading(true);
    try {
      const res = await signIn({ email, password });
      const authUser = res?.user;

      if (authUser) {
        // Query user's assigned role from user_roles
        const { data: roleData } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', authUser.id)
          .maybeSingle();

        const userRole = roleData?.role || 'intern';

        if (userRole === 'super_admin') {
          navigate('/super-admin/dashboard', { replace: true });
        } else if (userRole === 'admin') {
          navigate('/admin/dashboard', { replace: true });
        } else {
          navigate('/intern/dashboard', { replace: true });
        }
      } else {
        navigate('/intern/dashboard', { replace: true });
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="p-3.5 bg-[#FF3D00]/10 border border-[#FF3D00]/20 rounded-xl flex items-start gap-2.5 text-xs font-semibold text-[#FF3D00]">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{error}</span>
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
            placeholder="user@example.com"
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
        disabled={loading}
        className="w-full py-3.5 px-4 bg-gradient-to-r from-[#FF8A00] to-[#FF3D00] text-white font-semibold text-sm rounded-xl shadow-lg shadow-[#FF3D00]/25 hover:opacity-95 transition-all flex items-center justify-center gap-2 group disabled:opacity-50"
      >
        {loading ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <>
            <span>Sign In to Launchpad</span>
            <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </>
        )}
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

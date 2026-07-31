import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, ArrowRight, ShieldCheck } from 'lucide-react';

export function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('intern');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (role === 'super_admin') navigate('/super-admin/dashboard');
    else if (role === 'admin') navigate('/admin/dashboard');
    else navigate('/intern/dashboard');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-[#9A9A9A] mb-2">Select Portal</label>
        <div className="grid grid-cols-3 gap-2 p-1 bg-[#F7F7F7] border border-[#EDEDED] rounded-xl">
          {[
            { id: 'intern', label: 'Intern' },
            { id: 'admin', label: 'Admin' },
            { id: 'super_admin', label: 'Super Admin' },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setRole(item.id)}
              className={`py-2 text-xs font-semibold rounded-lg transition-all ${
                role === item.id
                  ? 'bg-gradient-to-r from-[#FF8A00] to-[#FF3D00] text-white shadow-sm'
                  : 'text-[#0D0D0D] hover:text-[#FF8A00]'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

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
        className="w-full py-3.5 px-4 bg-gradient-to-r from-[#FF8A00] to-[#FF3D00] text-white font-semibold text-sm rounded-xl shadow-lg shadow-[#FF3D00]/25 hover:opacity-95 hover:shadow-xl hover:shadow-[#FF3D00]/35 transition-all flex items-center justify-center gap-2 group"
      >
        <span>Sign In to Dashboard</span>
        <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
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

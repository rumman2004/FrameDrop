import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Camera, Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import api from '../../lib/api';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password)
      return setError('Please fill in all fields');

    setLoading(true);
    setError('');
    try {
      const { data } = await api.post('/auth/login', form);
      login(data.user, data.token);
      navigate(data.user.isAdmin ? '/admin' : '/dashboard', { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col lg:flex-row">

      {/* ── Left Panel — hidden on mobile, visible lg+ ── */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden
                      bg-gradient-to-br from-zinc-900 via-zinc-950 to-violet-950
                      flex-col items-center justify-center p-12">
        <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-violet-600/15
                        rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-60 h-60 bg-blue-600/10
                        rounded-full blur-[80px] pointer-events-none" />
        <div className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px),
                              linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)`,
            backgroundSize: '40px 40px',
          }} />

        <div className="relative z-10 max-w-md text-center space-y-8">
          <div className="flex items-center justify-center gap-3">
            <div className="p-3 bg-violet-600 rounded-2xl shadow-2xl shadow-violet-500/30">
              <Camera size={28} />
            </div>
            <span className="text-3xl font-black tracking-tight">
              Frame<span className="text-violet-400">Drop</span>
            </span>
          </div>

          <div className="space-y-3">
            <h2 className="text-4xl font-black leading-tight">
              Your work,
              <br />
              <span className="text-gradient">delivered safely.</span>
            </h2>
            <p className="text-zinc-400 text-lg leading-relaxed">
              Share high-quality photos and videos with your clients
              through secure, time-limited links.
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-2">
            {['🔐 PIN Protected', '⏱ Auto Expires', '📸 Full Quality', '🚀 Instant Share'].map((pill) => (
              <span key={pill} className="px-3 py-1.5 bg-zinc-800/60 border border-zinc-700
                                          rounded-full text-sm text-zinc-300">
                {pill}
              </span>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Photographers', value: '2.4k+' },
              { label: 'Files Shared',  value: '180k+' },
              { label: 'Countries',     value: '40+' },
            ].map(({ label, value }) => (
              <div key={label} className="bg-zinc-800/40 border border-zinc-700/50
                                          rounded-xl p-3 text-center">
                <p className="text-xl font-bold text-violet-400">{value}</p>
                <p className="text-zinc-500 text-xs mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right Panel — Form ── */}
      <div className="w-full lg:w-1/2 flex items-center justify-center
                      min-h-screen px-4 py-8 sm:px-6 sm:py-12">
        <div className="w-full max-w-sm sm:max-w-md space-y-6 sm:space-y-8">

          {/* Logo — always visible on mobile */}
          <div className="flex items-center justify-center gap-2.5">
            <div className="p-1.5 bg-violet-600 rounded-lg">
              <Camera size={18} />
            </div>
            <span className="font-bold text-xl tracking-tight">
              Frame<span className="text-violet-400">Drop</span>
            </span>
          </div>

          {/* Heading */}
          <div className="text-center">
            <h1 className="text-2xl sm:text-3xl font-black">Welcome back</h1>
            <p className="text-zinc-400 mt-1.5 sm:mt-2 text-sm sm:text-base">
              Sign in to your account to continue sharing
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
            {error && (
              <div className="px-4 py-3 bg-red-500/10 border border-red-500/30
                              rounded-xl text-red-400 text-xs sm:text-sm">
                {error}
              </div>
            )}

            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-xs sm:text-sm font-medium text-zinc-300">
                Email address
              </label>
              <div className="relative">
                <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input
                  type="email" name="email" value={form.email}
                  onChange={handleChange} placeholder="you@example.com"
                  autoComplete="email"
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl
                             pl-10 pr-4 py-2.5 sm:py-3 text-sm text-white
                             placeholder-zinc-500 focus:outline-none focus:border-violet-500
                             focus:ring-2 focus:ring-violet-500/20 transition-all"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="text-xs sm:text-sm font-medium text-zinc-300">
                Password
              </label>
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password" value={form.password}
                  onChange={handleChange} placeholder="Enter your password"
                  autoComplete="current-password"
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl
                             pl-10 pr-12 py-2.5 sm:py-3 text-sm text-white
                             placeholder-zinc-500 focus:outline-none focus:border-violet-500
                             focus:ring-2 focus:ring-violet-500/20 transition-all"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2
                             text-zinc-500 hover:text-zinc-300 transition-colors p-1">
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* Forgot */}
            <div className="flex justify-end">
              <button type="button"
                className="text-xs text-violet-400 hover:text-violet-300 transition-colors">
                Forgot password?
              </button>
            </div>

            {/* Submit */}
            <button type="submit" disabled={loading}
              className="w-full flex items-center justify-center gap-2
                         py-2.5 sm:py-3 bg-violet-600 hover:bg-violet-500
                         disabled:opacity-50 disabled:cursor-not-allowed
                         rounded-xl font-semibold text-sm transition-all">
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white
                                   rounded-full animate-spin" />
                  Signing in...
                </>
              ) : (
                <>Sign In <ArrowRight size={15} /></>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-zinc-800" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-3 bg-zinc-950 text-zinc-500">Don't have an account?</span>
            </div>
          </div>

          {/* Register link */}
          <Link to="/register"
            className="flex items-center justify-center gap-2 w-full py-2.5 sm:py-3
                       border border-zinc-700 hover:border-violet-500/50 rounded-xl
                       text-xs sm:text-sm font-medium text-zinc-300
                       hover:text-white transition-all">
            Create a free account
            <ArrowRight size={14} />
          </Link>

          <p className="text-center text-zinc-600 text-xs">
            By signing in, you agree to our{' '}
            <a href="#" className="text-zinc-500 hover:text-zinc-300 transition-colors">Terms</a>
            {' '}and{' '}
            <a href="#" className="text-zinc-500 hover:text-zinc-300 transition-colors">Privacy Policy</a>
          </p>
        </div>
      </div>
    </div>
  );
}
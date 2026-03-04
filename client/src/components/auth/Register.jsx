import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Camera, Mail, Lock, Eye, EyeOff,
  User, ArrowRight, CheckCircle,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import api from '../../lib/api';

function getPasswordStrength(password) {
  if (!password) return { score: 0, label: '', color: '' };
  let score = 0;
  if (password.length >= 8)          score++;
  if (/[A-Z]/.test(password))        score++;
  if (/[0-9]/.test(password))        score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  return [
    { score: 0, label: '',       color: '' },
    { score: 1, label: 'Weak',   color: 'bg-red-500' },
    { score: 2, label: 'Fair',   color: 'bg-amber-500' },
    { score: 3, label: 'Good',   color: 'bg-blue-500' },
    { score: 4, label: 'Strong', color: 'bg-green-500' },
  ][score];
}

function Requirement({ met, label }) {
  return (
    <div className={`flex items-center gap-1.5 text-xs transition-colors
                     ${met ? 'text-green-400' : 'text-zinc-500'}`}>
      <CheckCircle size={11} className={met ? 'opacity-100' : 'opacity-30'} />
      {label}
    </div>
  );
}

export default function Register() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const strength = getPasswordStrength(form.password);

  const requirements = [
    { met: form.password.length >= 8,           label: 'At least 8 characters' },
    { met: /[A-Z]/.test(form.password),          label: 'One uppercase letter' },
    { met: /[0-9]/.test(form.password),          label: 'One number' },
    { met: /[^A-Za-z0-9]/.test(form.password),  label: 'One special character' },
  ];

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password || !form.confirmPassword)
      return setError('Please fill in all fields');
    if (form.password !== form.confirmPassword)
      return setError('Passwords do not match');
    if (form.password.length < 8)
      return setError('Password must be at least 8 characters');

    setLoading(true);
    setError('');
    try {
      const { data } = await api.post('/auth/register', {
        name: form.name, email: form.email, password: form.password,
      });
      login(data.user, data.token);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col lg:flex-row">

      {/* ── Left Panel — lg+ only ── */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden
                      bg-gradient-to-br from-zinc-900 via-zinc-950 to-violet-950
                      flex-col items-center justify-center p-12">
        <div className="absolute top-1/3 left-1/3 w-80 h-80 bg-violet-600/15
                        rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-60 h-60 bg-pink-600/10
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
              Join thousands of
              <br />
              <span className="text-gradient">photographers.</span>
            </h2>
            <p className="text-zinc-400 text-lg leading-relaxed">
              Create your free account and start delivering your work
              the way it deserves — beautifully and securely.
            </p>
          </div>

          <div className="space-y-3 text-left">
            {[
              { step: '01', text: 'Sign up for free in 30 seconds' },
              { step: '02', text: 'Upload your photos & videos' },
              { step: '03', text: 'Share a secure, PIN-protected link' },
              { step: '04', text: 'Files auto-delete after expiry' },
            ].map(({ step, text }) => (
              <div key={step} className="flex items-center gap-4">
                <span className="text-xs font-bold text-violet-400 w-6 shrink-0">{step}</span>
                <div className="flex-1 h-px bg-zinc-800" />
                <span className="text-zinc-300 text-sm">{text}</span>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap justify-center gap-2 pt-2">
            {['✅ Free forever plan', '🔒 No data sold', '⚡ Setup in 30s'].map((badge) => (
              <span key={badge} className="px-3 py-1.5 bg-zinc-800/60 border border-zinc-700
                                           rounded-full text-xs text-zinc-300">
                {badge}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right Panel — Form ── */}
      <div className="w-full lg:w-1/2 flex items-start justify-center
                      min-h-screen px-4 py-8 sm:px-6 sm:py-10 overflow-y-auto">
        <div className="w-full max-w-sm sm:max-w-md space-y-5 sm:space-y-6 pt-2">

          {/* Logo */}
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
            <h1 className="text-2xl sm:text-3xl font-black">Create your account</h1>
            <p className="text-zinc-400 mt-1.5 text-sm sm:text-base">
              Free forever. No credit card required.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
            {error && (
              <div className="px-4 py-3 bg-red-500/10 border border-red-500/30
                              rounded-xl text-red-400 text-xs sm:text-sm">
                {error}
              </div>
            )}

            {/* Full Name */}
            <div className="space-y-1.5">
              <label className="text-xs sm:text-sm font-medium text-zinc-300">Full Name</label>
              <div className="relative">
                <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input type="text" name="name" value={form.name}
                  onChange={handleChange} placeholder="John Doe" autoComplete="name"
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl
                             pl-10 pr-4 py-2.5 sm:py-3 text-sm text-white
                             placeholder-zinc-500 focus:outline-none focus:border-violet-500
                             focus:ring-2 focus:ring-violet-500/20 transition-all" />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-xs sm:text-sm font-medium text-zinc-300">Email address</label>
              <div className="relative">
                <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input type="email" name="email" value={form.email}
                  onChange={handleChange} placeholder="you@example.com" autoComplete="email"
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl
                             pl-10 pr-4 py-2.5 sm:py-3 text-sm text-white
                             placeholder-zinc-500 focus:outline-none focus:border-violet-500
                             focus:ring-2 focus:ring-violet-500/20 transition-all" />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="text-xs sm:text-sm font-medium text-zinc-300">Password</label>
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input type={showPassword ? 'text' : 'password'}
                  name="password" value={form.password}
                  onChange={handleChange} placeholder="Create a strong password"
                  autoComplete="new-password"
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl
                             pl-10 pr-12 py-2.5 sm:py-3 text-sm text-white
                             placeholder-zinc-500 focus:outline-none focus:border-violet-500
                             focus:ring-2 focus:ring-violet-500/20 transition-all" />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2
                             text-zinc-500 hover:text-zinc-300 transition-colors p-1">
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>

              {/* Strength indicator */}
              {form.password && (
                <div className="space-y-1.5 pt-1">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i}
                        className={`h-1 flex-1 rounded-full transition-all duration-300
                          ${i <= strength.score ? strength.color : 'bg-zinc-800'}`} />
                    ))}
                  </div>
                  <p className={`text-xs font-medium
                    ${strength.score <= 1 ? 'text-red-400'
                      : strength.score === 2 ? 'text-amber-400'
                      : strength.score === 3 ? 'text-blue-400'
                      : 'text-green-400'}`}>
                    {strength.label} password
                  </p>
                  <div className="grid grid-cols-2 gap-1">
                    {requirements.map((req) => (
                      <Requirement key={req.label} {...req} />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div className="space-y-1.5">
              <label className="text-xs sm:text-sm font-medium text-zinc-300">Confirm Password</label>
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input type={showConfirm ? 'text' : 'password'}
                  name="confirmPassword" value={form.confirmPassword}
                  onChange={handleChange} placeholder="Repeat your password"
                  autoComplete="new-password"
                  className={`w-full bg-zinc-900 border rounded-xl pl-10 pr-12
                             py-2.5 sm:py-3 text-sm text-white placeholder-zinc-500
                             focus:outline-none focus:ring-2 transition-all
                             ${form.confirmPassword
                               ? form.confirmPassword === form.password
                                 ? 'border-green-500 focus:border-green-500 focus:ring-green-500/20'
                                 : 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
                               : 'border-zinc-700 focus:border-violet-500 focus:ring-violet-500/20'}`} />
                <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2
                             text-zinc-500 hover:text-zinc-300 transition-colors p-1">
                  {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {form.confirmPassword && form.confirmPassword !== form.password && (
                <p className="text-red-400 text-xs">Passwords do not match</p>
              )}
              {form.confirmPassword && form.confirmPassword === form.password && (
                <p className="text-green-400 text-xs flex items-center gap-1">
                  <CheckCircle size={10} /> Passwords match
                </p>
              )}
            </div>

            {/* Submit */}
            <button type="submit" disabled={loading}
              className="w-full flex items-center justify-center gap-2
                         py-2.5 sm:py-3 bg-violet-600 hover:bg-violet-500
                         disabled:opacity-50 disabled:cursor-not-allowed
                         rounded-xl font-semibold text-sm transition-all mt-1">
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white
                                   rounded-full animate-spin" />
                  Creating account...
                </>
              ) : (
                <>Create Account <ArrowRight size={15} /></>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-zinc-800" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-3 bg-zinc-950 text-zinc-500">Already have an account?</span>
            </div>
          </div>

          {/* Login link */}
          <Link to="/login"
            className="flex items-center justify-center gap-2 w-full py-2.5 sm:py-3
                       border border-zinc-700 hover:border-violet-500/50 rounded-xl
                       text-xs sm:text-sm font-medium text-zinc-300
                       hover:text-white transition-all">
            Sign in instead
            <ArrowRight size={14} />
          </Link>

          <p className="text-center text-zinc-600 text-xs pb-4">
            By creating an account, you agree to our{' '}
            <a href="#" className="text-zinc-500 hover:text-zinc-300 transition-colors">Terms</a>
            {' '}and{' '}
            <a href="#" className="text-zinc-500 hover:text-zinc-300 transition-colors">Privacy Policy</a>
          </p>
        </div>
      </div>
    </div>
  );
}
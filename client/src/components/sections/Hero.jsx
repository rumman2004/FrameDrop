import { Link } from 'react-router-dom';
import { ArrowRight, Shield, Clock, Download } from 'lucide-react';
import CircularGallery from '../ui/CircularGallery';

const pills = [
  { icon: Shield, label: 'PIN Protected' },
  { icon: Clock,  label: 'Auto Expires' },
  { icon: Download, label: 'High Quality' },
];

export default function Hero() {
  return (
    <section className="min-h-screen flex items-center relative overflow-hidden">
      {/* Background glow blobs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-violet-600/10 rounded-full blur-[120px]" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-blue-600/10 rounded-full blur-[100px]" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 w-full">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left — Text */}
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full
                            bg-violet-500/10 border border-violet-500/20 text-violet-400 text-sm">
              <span className="w-2 h-2 bg-violet-400 rounded-full animate-pulse" />
              Built for Photographers
            </div>

            <h1 className="text-5xl lg:text-7xl font-black leading-tight">
              Share Your
              <br />
              <span className="text-gradient">Vision</span>
              <br />
              Securely
            </h1>

            <p className="text-zinc-400 text-lg leading-relaxed max-w-md">
              Upload your best shots. Share with a secure link and PIN.
              Your files stay private, high-quality, and auto-delete after the timer runs out.
            </p>

            <div className="flex flex-wrap gap-3">
              {pills.map(({ icon: Icon, label }) => (
                <div key={label}
                  className="flex items-center gap-2 px-3 py-1.5 bg-zinc-800/60 rounded-lg
                             border border-zinc-700 text-zinc-300 text-sm">
                  <Icon size={14} className="text-violet-400" />
                  {label}
                </div>
              ))}
            </div>

            <div className="flex items-center gap-4">
              <Link
                to="/register"
                className="flex items-center gap-2 px-6 py-3 bg-violet-600 hover:bg-violet-500
                           rounded-xl font-semibold transition-all glow-violet"
              >
                Start Sharing Free
                <ArrowRight size={18} />
              </Link>
              <Link to="/login"
                className="px-6 py-3 text-zinc-300 hover:text-white rounded-xl
                           border border-zinc-700 hover:border-zinc-600 transition-all font-medium">
                Login
              </Link>
            </div>
          </div>

          {/* Right — Animated Gallery */}
          <div className="flex justify-center">
            <CircularGallery />
          </div>
        </div>
      </div>
    </section>
  );
}
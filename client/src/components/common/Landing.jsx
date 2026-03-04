import { useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Camera, Upload, Link2, Lock, Clock, Download,
  ArrowRight, Star, Eye, Zap, Shield, CheckCircle, Menu, X,
} from 'lucide-react';
import { useState } from 'react';
import Footer from '../sections/Footer';

function SectionTag({ children }) {
  return (
    <span className="inline-flex items-center gap-2 px-3 py-1 sm:px-4 sm:py-1.5 rounded-full
                     bg-violet-500/10 border border-violet-500/20 text-violet-400
                     text-xs sm:text-sm mb-3 sm:mb-4">
      {children}
    </span>
  );
}

function StoryStep({ number, icon: Icon, title, description, side = 'left', color = 'violet' }) {
  const colors = {
    violet: { bg: 'bg-violet-600/10', border: 'border-violet-500/20', text: 'text-violet-400', num: 'text-violet-500' },
    blue:   { bg: 'bg-blue-600/10',   border: 'border-blue-500/20',   text: 'text-blue-400',   num: 'text-blue-500' },
    pink:   { bg: 'bg-pink-600/10',   border: 'border-pink-500/20',   text: 'text-pink-400',   num: 'text-pink-500' },
    green:  { bg: 'bg-green-600/10',  border: 'border-green-500/20',  text: 'text-green-400',  num: 'text-green-500' },
  };
  const c = colors[color];

  return (
    <div className={`flex flex-col ${side === 'right' ? 'md:flex-row-reverse' : 'md:flex-row'}
                     items-center gap-8 md:gap-16`}>
      {/* Visual — smaller on mobile */}
      <div className="flex-1 flex justify-center w-full">
        <div className={`relative w-44 h-44 sm:w-56 sm:h-56 md:w-64 md:h-64
                         ${c.bg} border ${c.border} rounded-3xl
                         flex flex-col items-center justify-center gap-3`}>
          <span className={`text-5xl sm:text-7xl font-black opacity-10 absolute top-3 left-5 ${c.num}`}>
            {String(number).padStart(2, '0')}
          </span>
          <div className={`p-3 sm:p-5 ${c.bg} border ${c.border} rounded-2xl`}>
            <Icon size={28} className={`sm:w-10 sm:h-10 ${c.text}`} />
          </div>
          <p className={`text-xs sm:text-sm font-medium ${c.text} px-4 text-center`}>{title}</p>
        </div>
      </div>

      {/* Text */}
      <div className="flex-1 space-y-3 sm:space-y-4 text-center md:text-left">
        <p className={`text-xs uppercase tracking-widest font-semibold ${c.text}`}>
          Step {number}
        </p>
        <h3 className="text-2xl sm:text-3xl md:text-4xl font-black leading-tight">{title}</h3>
        <p className="text-zinc-400 text-sm sm:text-base md:text-lg leading-relaxed">{description}</p>
      </div>
    </div>
  );
}

function Testimonial({ name, role, quote, avatar }) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 sm:p-6
                    hover:border-zinc-700 transition-all">
      <div className="flex gap-1 mb-3">
        {Array(5).fill(0).map((_, i) => (
          <Star key={i} size={12} className="text-amber-400 fill-amber-400" />
        ))}
      </div>
      <p className="text-zinc-300 text-xs sm:text-sm leading-relaxed mb-4">"{quote}"</p>
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-violet-600
                        flex items-center justify-center font-bold text-xs sm:text-sm shrink-0">
          {avatar}
        </div>
        <div>
          <p className="font-semibold text-xs sm:text-sm">{name}</p>
          <p className="text-zinc-500 text-xs">{role}</p>
        </div>
      </div>
    </div>
  );
}

function Feature({ icon: Icon, title, desc }) {
  return (
    <div className="flex gap-3 sm:gap-4 p-4 sm:p-5 bg-zinc-900 border border-zinc-800
                    rounded-2xl hover:border-violet-500/30 transition-all group">
      <div className="p-2 sm:p-2.5 bg-violet-600/10 border border-violet-500/20 rounded-xl
                      shrink-0 group-hover:bg-violet-600/20 transition-all">
        <Icon size={16} className="sm:w-5 sm:h-5 text-violet-400" />
      </div>
      <div>
        <h4 className="font-semibold text-xs sm:text-sm mb-1">{title}</h4>
        <p className="text-zinc-400 text-xs leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}

export default function Landing() {
  const storyRef = useRef(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="bg-zinc-950 text-white min-h-screen">

      {/* ── Navbar ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-zinc-800/60
                      bg-zinc-950/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-violet-600 rounded-lg">
                <Camera size={16} className="sm:w-[18px] sm:h-[18px]" />
              </div>
              <span className="font-bold text-base sm:text-lg tracking-tight">
                Frame<span className="text-violet-400">Drop</span>
              </span>
            </div>

            {/* Desktop links */}
            <div className="hidden sm:flex items-center gap-2 sm:gap-3">
              <Link to="/login"
                className="px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm text-zinc-300
                           hover:text-white rounded-lg hover:bg-zinc-800 transition-all">
                Login
              </Link>
              <Link to="/register"
                className="px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-medium
                           bg-violet-600 hover:bg-violet-500 rounded-lg transition-all">
                Get Started
              </Link>
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="sm:hidden p-2 rounded-lg text-zinc-400 hover:bg-zinc-800 transition-all"
            >
              {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>

          {/* Mobile dropdown */}
          {mobileMenuOpen && (
            <div className="sm:hidden border-t border-zinc-800 py-3 space-y-2 pb-4">
              <Link to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-4 py-2.5 text-sm text-zinc-300 hover:text-white
                           hover:bg-zinc-800 rounded-lg transition-all">
                Login
              </Link>
              <Link to="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-4 py-2.5 text-sm font-medium bg-violet-600
                           hover:bg-violet-500 rounded-lg transition-all text-center">
                Get Started Free
              </Link>
            </div>
          )}
        </div>
      </nav>

      {/* ── CHAPTER 1 — Hero ── */}
      <section className="relative min-h-screen flex items-center pt-14 sm:pt-16 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(139,92,246,0.12),transparent_70%)]" />
        <div className="absolute top-1/3 right-0 w-64 sm:w-96 lg:w-[600px] h-64 sm:h-96 lg:h-[600px]
                        bg-violet-600/5 rounded-full blur-[100px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 w-full">
          <div className="max-w-3xl mx-auto text-center space-y-5 sm:space-y-8">
            <SectionTag>
              <Eye size={12} className="sm:w-3.5 sm:h-3.5" />
              The Story of Every Photographer
            </SectionTag>

            <h1 className="text-4xl sm:text-6xl lg:text-8xl font-black leading-none tracking-tight">
              You captured
              <br />
              <span className="text-gradient">something</span>
              <br />
              incredible.
            </h1>

            <p className="text-zinc-400 text-base sm:text-xl leading-relaxed max-w-xl mx-auto px-2">
              Hours behind the lens. Perfect lighting. That one shot that made everything worth it.
              And then someone asks —{' '}
              <em className="text-zinc-200">"Can you send me those photos?"</em>
            </p>

            <p className="text-zinc-500 text-sm sm:text-lg px-2">
              You fumble with WeTransfer, Google Drive, Dropbox — or worse,
              compressing your masterpieces to fit in an email.
              <span className="text-red-400"> Your work deserves better.</span>
            </p>

            <button
              onClick={() => storyRef.current?.scrollIntoView({ behavior: 'smooth' })}
              className="inline-flex items-center gap-2 px-5 py-2.5 sm:px-6 sm:py-3
                         text-violet-400 hover:text-violet-300 transition-colors
                         text-xs sm:text-sm animate-bounce"
            >
              See how it should work
              <ArrowRight size={14} className="rotate-90" />
            </button>
          </div>
        </div>
      </section>

      {/* ── CHAPTER 2 — Story Steps ── */}
      <section ref={storyRef} className="py-16 sm:py-24 lg:py-32 relative">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(59,130,246,0.05),transparent_60%)]" />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16 sm:space-y-24 lg:space-y-28">
          <div className="text-center">
            <SectionTag>
              <Zap size={12} className="sm:w-3.5 sm:h-3.5" />
              How FrameDrop Works
            </SectionTag>
            <h2 className="text-3xl sm:text-4xl md:text-6xl font-black mt-2">
              Simple as <span className="text-gradient">1, 2, 3</span>
            </h2>
          </div>

          <StoryStep number={1} icon={Upload} color="violet" side="left"
            title="Upload Your Work"
            description="Drag and drop your RAW files, JPEGs, videos — anything up to 200MB per file. We send them straight to the cloud at full quality. No compression. No quality loss." />

          <StoryStep number={2} icon={Lock} color="blue" side="right"
            title="Set Your PIN & Timer"
            description="Choose a 4-digit PIN only your client knows. Set the link to expire in 3 to 5 hours — enough time for a download, not enough for your work to float around forever." />

          <StoryStep number={3} icon={Link2} color="pink" side="left"
            title="Share the Link"
            description="One link. Copy and send via WhatsApp, email, or SMS. Your client opens it, enters the PIN, and sees your photos in a beautiful gallery. Download in full quality." />

          <StoryStep number={4} icon={Clock} color="green" side="right"
            title="It Vanishes. Automatically."
            description="When the timer hits zero, the link dies. Files are deleted from our servers. No lingering copies. No accidental shares. This is how sharing should feel." />
        </div>
      </section>

      {/* ── CHAPTER 3 — Features ── */}
      <section className="py-16 sm:py-24 lg:py-32 bg-zinc-900/30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10 sm:mb-16">
            <SectionTag>
              <Shield size={12} className="sm:w-3.5 sm:h-3.5" />
              Our Promise to You
            </SectionTag>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black mt-2">
              Built around your <span className="text-gradient">privacy</span>
            </h2>
            <p className="text-zinc-400 mt-3 sm:mt-4 max-w-xl mx-auto text-sm sm:text-base px-4">
              Every feature we built exists to protect your work and your clients.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {[
              { icon: Lock,        title: 'PIN Protection',     desc: 'Every share requires a PIN. Only your intended recipient can access your files.' },
              { icon: Clock,       title: 'Auto Expiry',        desc: 'Links expire in 3–5 hours. Files are permanently deleted after the timer ends.' },
              { icon: Download,    title: 'Original Quality',   desc: 'We never compress your images or videos. What you upload is what they download.' },
              { icon: Shield,      title: 'JWT Authentication', desc: 'Your account is protected with industry-standard token-based authentication.' },
              { icon: Zap,         title: 'Cloudinary CDN',     desc: 'Files are served through a global CDN for lightning-fast delivery worldwide.' },
              { icon: CheckCircle, title: 'No Surprise Costs',  desc: 'Generous free tier. No hidden fees for the features photographers actually need.' },
            ].map((f) => <Feature key={f.title} {...f} />)}
          </div>
        </div>
      </section>

      {/* ── CHAPTER 4 — Testimonials ── */}
      <section className="py-16 sm:py-24 lg:py-32">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10 sm:mb-16">
            <SectionTag>
              <Star size={12} className="sm:w-3.5 sm:h-3.5" />
              Photographers Love It
            </SectionTag>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black mt-2">
              Real stories, real <span className="text-gradient">results</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
            <Testimonial
              name="Amara Okonkwo" role="Wedding Photographer, Lagos" avatar="A"
              quote="I used to dread sending files to clients. Now I just upload, share the link, and they have everything before I even get home from the venue." />
            <Testimonial
              name="Carlos Mendez" role="Commercial Photographer, Madrid" avatar="C"
              quote="The PIN feature is a game changer. My clients feel like their previews are exclusive — because they actually are. No more worrying about files leaking." />
            <Testimonial
              name="Yuki Tanaka" role="Portrait Photographer, Tokyo" avatar="Y"
              quote="FrameDrop replaced my entire file delivery workflow. The auto-delete feature alone is worth it. Clean, fast, and my clients love the gallery view." />
          </div>
        </div>
      </section>

      {/* ── CHAPTER 5 — CTA ── */}
      <section className="py-16 sm:py-24 lg:py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(139,92,246,0.15),transparent_60%)]" />
        <div className="max-w-3xl mx-auto px-4 text-center relative space-y-6 sm:space-y-8">
          <SectionTag>
            <Camera size={12} className="sm:w-3.5 sm:h-3.5" />
            Your Work Deserves This
          </SectionTag>

          <h2 className="text-4xl sm:text-5xl md:text-7xl font-black leading-tight">
            Stop sending
            <br />
            <span className="text-gradient">bad links.</span>
          </h2>

          <p className="text-zinc-400 text-base sm:text-xl leading-relaxed px-4">
            Join photographers who already deliver their work with confidence,
            privacy, and style. It takes 30 seconds to sign up.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 px-4">
            <Link to="/register"
              className="flex items-center justify-center gap-2 w-full sm:w-auto
                         px-6 py-3.5 sm:px-8 sm:py-4 bg-violet-600 hover:bg-violet-500
                         rounded-2xl font-bold text-base sm:text-lg transition-all">
              Start for Free
              <ArrowRight size={18} />
            </Link>
            <Link to="/login"
              className="flex items-center justify-center w-full sm:w-auto
                         px-6 py-3.5 sm:px-8 sm:py-4 rounded-2xl font-bold text-base sm:text-lg
                         border border-zinc-700 hover:border-zinc-500
                         text-zinc-300 hover:text-white transition-all">
              Already have an account
            </Link>
          </div>

          <p className="text-zinc-600 text-xs sm:text-sm px-4">
            No credit card required · Free forever plan · Setup in 30 seconds
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
}
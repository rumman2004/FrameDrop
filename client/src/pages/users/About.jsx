import { Camera, Shield, Clock, Download, Github, Globe } from 'lucide-react';

const features = [
  {
    icon: Shield,
    title: 'Security First',
    desc: 'PIN-protected links and JWT authentication ensure only intended recipients see your work.',
    color: 'text-violet-400',
    bg:   'bg-violet-500/10 border-violet-500/20',
  },
  {
    icon: Clock,
    title: 'Time-Limited Links',
    desc: 'Every share expires automatically. Files are permanently deleted when the timer runs out.',
    color: 'text-amber-400',
    bg:   'bg-amber-500/10 border-amber-500/20',
  },
  {
    icon: Download,
    title: 'Original Quality',
    desc: 'We never compress or re-encode your files. Full resolution, full quality, every time.',
    color: 'text-emerald-400',
    bg:   'bg-emerald-500/10 border-emerald-500/20',
  },
];

export default function About() {
  return (
    <div className="w-full min-h-full px-4 sm:px-6 lg:px-8 xl:px-10 py-12">
      <div className="max-w-3xl mx-auto space-y-12">

        {/* Hero */}
        <div className="text-center space-y-4">
          <div className="inline-flex p-4 bg-violet-600 rounded-3xl
                          shadow-2xl shadow-violet-900/40 mb-2">
            <Camera size={36} className="text-white" />
          </div>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-white">
            About FrameDrop
          </h1>
          <p className="text-zinc-400 text-lg leading-relaxed max-w-xl mx-auto">
            A secure, privacy-first file sharing platform built specifically for photographers.
          </p>
        </div>

        {/* Story */}
        <div className="bg-zinc-900/80 border border-white/[0.05] rounded-3xl p-8 space-y-4">
          <h2 className="text-xl font-bold text-white">The Story</h2>
          <div className="space-y-4 text-zinc-400 leading-relaxed text-sm">
            <p>
              FrameDrop was built to solve a simple but frustrating problem every photographer
              faces — how do you send high-quality images and videos to clients without losing
              quality, worrying about privacy, or dealing with bloated cloud services?
            </p>
            <p>
              We built FrameDrop around three core beliefs: your work should be delivered at
              full quality, your clients should have a seamless experience, and your files
              should not live on the internet forever.
            </p>
          </div>
        </div>

        {/* Feature cards */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-white">Why FrameDrop</h2>
          <div className="grid gap-4">
            {features.map(({ icon: Icon, title, desc, color, bg }) => (
              <div key={title}
                   className="flex gap-5 p-6 bg-zinc-900/80 border border-white/[0.05]
                              rounded-2xl hover:border-white/[0.1] transition-colors">
                <div className={`p-3 border rounded-2xl shrink-0 ${bg}`}>
                  <Icon size={22} className={color} />
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-1.5">{title}</h3>
                  <p className="text-zinc-500 text-sm leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
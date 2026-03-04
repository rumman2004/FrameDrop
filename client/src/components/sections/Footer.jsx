import { Camera, Github, Twitter } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="border-t border-zinc-800 bg-zinc-950 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-violet-600 rounded-lg">
              <Camera size={18} />
            </div>
            <span className="font-bold text-lg">
              Frame<span className="text-violet-400">Drop</span>
            </span>
          </div>

          <div className="flex items-center gap-6 text-sm text-zinc-400">
            <Link to="/about"   className="hover:text-white transition-colors">About</Link>
            <Link to="/pricing" className="hover:text-white transition-colors">Pricing</Link>
            <a href="#" className="hover:text-white transition-colors">Privacy</a>
            <a href="#" className="hover:text-white transition-colors">Terms</a>
          </div>

          <div className="flex items-center gap-3">
            <a href="#" className="p-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-all text-zinc-400 hover:text-white">
              <Github size={18} />
            </a>
            <a href="#" className="p-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-all text-zinc-400 hover:text-white">
              <Twitter size={18} />
            </a>
          </div>
        </div>
        <p className="text-center text-zinc-600 text-sm mt-8">
          © {new Date().getFullYear()} FrameDrop. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
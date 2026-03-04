import { Upload, Check, X } from 'lucide-react';

export default function UploadingModal({ isOpen, progress = 0, done = false, error = null }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 w-full max-w-sm mx-4 text-center">
        <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4
          ${error ? 'bg-red-500/20 border border-red-500/30'
            : done ? 'bg-green-500/20 border border-green-500/30'
            : 'bg-violet-600/20 border border-violet-500/30'}`}>
          {error
            ? <X size={28} className="text-red-400" />
            : done
            ? <Check size={28} className="text-green-400" />
            : <Upload size={28} className="text-violet-400 animate-pulse" />
          }
        </div>
        <h3 className="text-lg font-bold mb-1">
          {error ? 'Upload Failed' : done ? 'Upload Complete!' : 'Uploading Files...'}
        </h3>
        {error && <p className="text-red-400 text-sm">{error}</p>}
        {!done && !error && (
          <div className="mt-4">
            <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-violet-500 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-zinc-400 text-sm mt-2">{progress}%</p>
          </div>
        )}
      </div>
    </div>
  );
}
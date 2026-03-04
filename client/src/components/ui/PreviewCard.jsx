import { useState } from 'react';
import { Download, Play, X, ZoomIn } from 'lucide-react';

export default function PreviewCard({ file }) {
  const [preview, setPreview] = useState(false);

  return (
    <>
      <div
        className="relative group rounded-xl overflow-hidden bg-zinc-800 cursor-pointer
                   ring-1 ring-zinc-700 hover:ring-violet-500 transition-all"
        onClick={() => setPreview(true)}
      >
        {file.type === 'video' ? (
          <div className="relative">
            <video src={file.url} className="w-full object-cover" />
            <div className="absolute inset-0 flex items-center justify-center bg-black/40">
              <Play size={32} className="text-white" />
            </div>
          </div>
        ) : (
          <img
            src={file.url}
            alt={file.originalName}
            className="w-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        )}

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all
                        flex items-end justify-end p-2 opacity-0 group-hover:opacity-100">
          <div className="flex gap-1.5">
            <button
              onClick={(e) => { e.stopPropagation(); setPreview(true); }}
              className="p-1.5 bg-black/60 rounded-lg backdrop-blur-sm"
            >
              <ZoomIn size={14} />
            </button>
            <a
              href={file.url}
              download={file.originalName}
              target="_blank"
              rel="noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="p-1.5 bg-violet-600/80 rounded-lg backdrop-blur-sm"
            >
              <Download size={14} />
            </a>
          </div>
        </div>
      </div>

      {/* Full Preview Modal */}
      {preview && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center
                     justify-center p-4"
          onClick={() => setPreview(false)}
        >
          <button className="absolute top-4 right-4 p-2 bg-zinc-800 rounded-xl text-zinc-300
                             hover:text-white transition-colors">
            <X size={20} />
          </button>
          <div onClick={(e) => e.stopPropagation()} className="max-w-5xl max-h-full">
            {file.type === 'video' ? (
              <video src={file.url} controls autoPlay className="max-h-[85vh] rounded-xl" />
            ) : (
              <img src={file.url} alt={file.originalName}
                className="max-h-[85vh] max-w-full rounded-xl object-contain" />
            )}
            <div className="flex items-center justify-between mt-3">
              <p className="text-zinc-400 text-sm truncate">{file.originalName}</p>
              <a
                href={file.url}
                download={file.originalName}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500
                           rounded-lg text-sm font-medium transition-all"
              >
                <Download size={15} />
                Download
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
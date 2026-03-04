import { useState, useRef, useCallback } from 'react';
import api from '../../lib/api';
import {
  X, Upload, FolderPlus, ImagePlus,
  Loader2, CheckCircle, AlertCircle,
  File as FileIcon, Trash2, Lock, Clock,
} from 'lucide-react';

// ── Constants ──────────────────────────────────────────────────────────────
const EXPIRY_OPTIONS = [
  { label: '1 hour',   value: 1  },
  { label: '3 hours',  value: 3  },
  { label: '6 hours',  value: 6  },
  { label: '12 hours', value: 12 },
  { label: '24 hours', value: 24 },
  { label: '48 hours', value: 48 },
];

// ── Helpers ────────────────────────────────────────────────────────────────
function fmtBytes(bytes = 0) {
  if (bytes < 1024)      return `${bytes} B`;
  if (bytes < 1_048_576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1_048_576).toFixed(2)} MB`;
}

// ── Field wrapper ──────────────────────────────────────────────────────────
function Field({ label, required, hint, children }) {
  return (
    <div className="space-y-2">
      <label className="flex items-center gap-1.5 text-xs font-bold
                        text-zinc-400 uppercase tracking-widest">
        {label}
        {required && <span className="text-red-400 text-sm leading-none">*</span>}
      </label>
      {children}
      {hint && <p className="text-xs text-zinc-600">{hint}</p>}
    </div>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────
export default function UploadModal({ isOpen, onClose }) {
  // Form
  const [folderName, setFolderName] = useState('');
  const [pin,        setPin]        = useState('');
  const [expiry,     setExpiry]     = useState(6);
  const [files,      setFiles]      = useState([]);   // { file, preview, id }

  // Upload
  const [uploading,  setUploading]  = useState(false);
  const [progress,   setProgress]   = useState(0);
  const [done,       setDone]       = useState(false);
  const [error,      setError]      = useState('');

  // Drag
  const [dragging,   setDragging]   = useState(false);

  const fileInputRef = useRef(null);

  // ── Reset ──────────────────────────────────────────────────────────────
  const reset = useCallback(() => {
    setFolderName('');
    setPin('');
    setExpiry(6);
    setFiles([]);
    setUploading(false);
    setProgress(0);
    setDone(false);
    setError('');
    setDragging(false);
  }, []);

  const handleClose = useCallback(() => {
    if (uploading) return;
    reset();
    onClose();
  }, [uploading, reset, onClose]);

  // ── File management ────────────────────────────────────────────────────
  const addFiles = useCallback((incoming) => {
    const next = Array.from(incoming).map(f => ({
      file:    f,
      id:      `${f.name}-${f.size}-${Math.random()}`,
      preview: f.type.startsWith('image/') ? URL.createObjectURL(f) : null,
    }));
    setFiles(prev => {
      const seen = new Set(prev.map(p => `${p.file.name}-${p.file.size}`));
      return [...prev, ...next.filter(n => !seen.has(`${n.file.name}-${n.file.size}`))];
    });
  }, []);

  const removeFile = useCallback((id) => {
    setFiles(prev => {
      const f = prev.find(p => p.id === id);
      if (f?.preview) URL.revokeObjectURL(f.preview);
      return prev.filter(p => p.id !== id);
    });
  }, []);

  const clearFiles = useCallback(() => {
    setFiles(prev => {
      prev.forEach(p => { if (p.preview) URL.revokeObjectURL(p.preview); });
      return [];
    });
  }, []);

  // ── Drag & drop ────────────────────────────────────────────────────────
  const onDragOver  = e => { e.preventDefault(); setDragging(true);  };
  const onDragLeave = e => { e.preventDefault(); setDragging(false); };
  const onDrop      = e => {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
  };

  // ── Validation ─────────────────────────────────────────────────────────
  const validate = () => {
    if (!folderName.trim())               return 'Please enter a folder name.';
    if (files.length === 0)               return 'Please add at least one file.';
    if (pin && (pin.length < 4 || pin.length > 8))
                                          return 'PIN must be 4–8 digits.';
    return null;
  };

  // ── Submit ─────────────────────────────────────────────────────────────
  const handleSubmit = async e => {
    e.preventDefault();
    const err = validate();
    if (err) return setError(err);

    setError('');
    setUploading(true);
    setProgress(0);

    const formData = new FormData();
    formData.append('title',  folderName.trim());
    formData.append('expiry', expiry);
    if (pin) formData.append('pin', pin);
    files.forEach(({ file }) => formData.append('files', file));

    try {
      await api.post('/share', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: evt =>
          setProgress(Math.round((evt.loaded / (evt.total || 1)) * 100)),
      });
      setDone(true);
      setProgress(100);
    } catch (err) {
      setError(err.response?.data?.message || 'Upload failed. Please try again.');
      setUploading(false);
    }
  };

  if (!isOpen) return null;

  const totalSize  = files.reduce((sum, { file }) => sum + file.size, 0);
  const canSubmit  = folderName.trim().length > 0 && files.length > 0 && !uploading;

  // ────────────────────────────────────────────────────────────────────────
  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4
                 bg-black/75 backdrop-blur-sm"
      onClick={handleClose}
    >
      <div
        className="relative w-full max-w-xl bg-zinc-900 border border-white/[0.08]
                   rounded-3xl shadow-2xl shadow-black/70
                   flex flex-col max-h-[92vh] overflow-hidden"
        onClick={e => e.stopPropagation()}
      >

        {/* ── Header ────────────────────────────────────────────────────── */}
        <div className="flex-shrink-0 flex items-center justify-between
                        px-6 py-5 border-b border-white/[0.06]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-violet-500/15
                            border border-violet-500/25">
              <FolderPlus size={18} className="text-violet-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white leading-none">
                New Share
              </h2>
              <p className="text-xs text-zinc-500 mt-0.5">
                Name your folder, pick expiry, then add files
              </p>
            </div>
          </div>

          <button
            onClick={handleClose}
            disabled={uploading}
            className="p-2 rounded-xl text-zinc-500 hover:text-white
                       hover:bg-zinc-800 transition-colors disabled:opacity-40"
          >
            <X size={17} />
          </button>
        </div>

        {/* ── Body ──────────────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto overscroll-contain">

          {/* ── Success ───────────────────────────────────────────────── */}
          {done ? (
            <div className="flex flex-col items-center justify-center
                            gap-5 py-16 px-8 text-center">
              <div className="w-20 h-20 rounded-3xl bg-emerald-500/10
                              border border-emerald-500/20
                              flex items-center justify-center">
                <CheckCircle size={36} className="text-emerald-400" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-white">
                  "{folderName}" is live!
                </h3>
                <p className="text-zinc-500 text-sm leading-relaxed">
                  {files.length} {files.length === 1 ? 'file' : 'files'} uploaded.
                  Share the link with your client — it expires in {expiry} {expiry === 1 ? 'hour' : 'hours'}.
                </p>
              </div>
              <button
                onClick={() => { reset(); onClose(); }}
                className="px-6 py-2.5 bg-violet-600 hover:bg-violet-500
                           rounded-xl text-sm font-semibold text-white
                           transition-colors"
              >
                Done
              </button>
            </div>

          ) : (
            <form
              id="upload-form"
              onSubmit={handleSubmit}
              className="p-6 space-y-6"
            >

              {/* ── Folder name (required) ───────────────────────────── */}
              <Field
                label="Folder Name"
                required
                hint="Your clients will see this name — make it descriptive"
              >
                <div className="relative">
                  <FolderPlus size={15}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500
                               pointer-events-none" />
                  <input
                    type="text"
                    value={folderName}
                    onChange={e => setFolderName(e.target.value)}
                    placeholder="e.g. Smith Wedding — June 2025"
                    maxLength={80}
                    required
                    autoFocus
                    className={`w-full bg-zinc-800/60 border rounded-xl
                                pl-10 pr-4 py-3 text-sm text-white
                                placeholder-zinc-600
                                focus:outline-none focus:bg-zinc-800
                                transition-colors
                                ${folderName.trim()
                                  ? 'border-violet-500/50 focus:border-violet-500'
                                  : 'border-white/[0.07] focus:border-violet-500/60'
                                }`}
                  />
                  {/* Character counter */}
                  <span className="absolute right-3 bottom-3
                                   text-[10px] text-zinc-600 tabular-nums">
                    {folderName.length}/80
                  </span>
                </div>
              </Field>

              {/* ── Expiry + PIN ─────────────────────────────────────── */}
              <div className="grid grid-cols-2 gap-4">

                <Field label="Expires In" hint="Share auto-deletes after this">
                  <div className="relative">
                    <Clock size={14}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2
                                 text-zinc-500 pointer-events-none" />
                    <select
                      value={expiry}
                      onChange={e => setExpiry(Number(e.target.value))}
                      className="w-full bg-zinc-800/60 border border-white/[0.07]
                                 rounded-xl pl-9 pr-3 py-3 text-sm text-white
                                 focus:outline-none focus:border-violet-500/60
                                 focus:bg-zinc-800 transition-colors
                                 appearance-none cursor-pointer"
                    >
                      {EXPIRY_OPTIONS.map(({ label, value }) => (
                        <option key={value} value={value} className="bg-zinc-900">
                          {label}
                        </option>
                      ))}
                    </select>
                  </div>
                </Field>

                <Field label="PIN" hint="Optional — 4 to 8 digits">
                  <div className="relative">
                    <Lock size={14}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2
                                 text-zinc-500 pointer-events-none" />
                    <input
                      type="number"
                      value={pin}
                      onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, 8))}
                      placeholder="Leave blank for no PIN"
                      className="w-full bg-zinc-800/60 border border-white/[0.07]
                                 rounded-xl pl-9 pr-3 py-3 text-sm text-white
                                 placeholder-zinc-600
                                 focus:outline-none focus:border-violet-500/60
                                 focus:bg-zinc-800 transition-colors
                                 [appearance:textfield]
                                 [&::-webkit-inner-spin-button]:appearance-none
                                 [&::-webkit-outer-spin-button]:appearance-none"
                    />
                  </div>
                </Field>
              </div>

              {/* ── Drop zone ────────────────────────────────────────── */}
              <Field label="Files" required>
                <div
                  onDragOver={onDragOver}
                  onDragLeave={onDragLeave}
                  onDrop={onDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`relative border-2 border-dashed rounded-2xl
                               cursor-pointer transition-all duration-200
                               flex flex-col items-center justify-center
                               gap-3 py-10 px-6 text-center select-none
                               ${dragging
                                 ? 'border-violet-500 bg-violet-500/8 scale-[1.01]'
                                 : 'border-zinc-700/60 hover:border-zinc-500 bg-zinc-800/20 hover:bg-zinc-800/40'
                               }`}
                >
                  <div className={`p-4 rounded-2xl transition-colors
                    ${dragging ? 'bg-violet-500/15' : 'bg-zinc-800'}`}>
                    <ImagePlus size={26}
                      className={dragging ? 'text-violet-400' : 'text-zinc-500'} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-zinc-300">
                      {dragging ? 'Drop to add files' : 'Drag & drop files here'}
                    </p>
                    <p className="text-xs text-zinc-600 mt-1">
                      or{' '}
                      <span className="text-violet-400 font-semibold">
                        click to browse
                      </span>
                      {' '}· Images, videos, any format
                    </p>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    className="hidden"
                    onChange={e => e.target.files && addFiles(e.target.files)}
                  />
                </div>
              </Field>

              {/* ── File list ────────────────────────────────────────── */}
              {files.length > 0 && (
                <div className="space-y-2">
                  {/* List header */}
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">
                      {files.length} {files.length === 1 ? 'file' : 'files'}
                      <span className="text-zinc-700 normal-case font-normal ml-2">
                        · {fmtBytes(totalSize)} total
                      </span>
                    </p>
                    <button
                      type="button"
                      onClick={clearFiles}
                      className="text-xs text-zinc-600 hover:text-red-400
                                 transition-colors"
                    >
                      Clear all
                    </button>
                  </div>

                  {/* File rows */}
                  <div className="max-h-48 overflow-y-auto overscroll-contain
                                  space-y-1.5 pr-1">
                    {files.map(({ id, file, preview }) => (
                      <div
                        key={id}
                        className="flex items-center gap-3 px-3 py-2.5
                                   bg-zinc-800/50 border border-white/[0.05]
                                   rounded-xl group/row"
                      >
                        {/* Thumb */}
                        <div className="w-9 h-9 rounded-lg overflow-hidden
                                        flex-shrink-0 bg-zinc-700/50">
                          {preview
                            ? <img src={preview} alt=""
                                   className="w-full h-full object-cover" />
                            : <div className="w-full h-full flex items-center justify-center">
                                <FileIcon size={15} className="text-zinc-500" />
                              </div>
                          }
                        </div>

                        {/* Name + size */}
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-zinc-300 truncate">
                            {file.name}
                          </p>
                          <p className="text-[10px] text-zinc-600 mt-0.5">
                            {fmtBytes(file.size)}
                          </p>
                        </div>

                        {/* Remove */}
                        <button
                          type="button"
                          onClick={() => removeFile(id)}
                          className="p-1.5 rounded-lg text-zinc-600
                                     hover:text-red-400 hover:bg-red-500/10
                                     opacity-0 group-hover/row:opacity-100
                                     transition-all"
                          aria-label="Remove file"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── Error ────────────────────────────────────────────── */}
              {error && (
                <div className="flex items-start gap-2.5 px-4 py-3
                                bg-red-500/8 border border-red-500/20
                                rounded-xl">
                  <AlertCircle size={15}
                    className="text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-300">{error}</p>
                </div>
              )}

              {/* ── Progress ─────────────────────────────────────────── */}
              {uploading && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-500 flex items-center gap-1.5">
                      <Loader2 size={12} className="animate-spin" />
                      Uploading…
                    </span>
                    <span className="text-violet-400 font-bold tabular-nums">
                      {progress}%
                    </span>
                  </div>
                  <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-violet-600
                                 to-violet-400 rounded-full
                                 transition-all duration-300 ease-out"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              )}

            </form>
          )}
        </div>

        {/* ── Footer ────────────────────────────────────────────────────── */}
        {!done && (
          <div className="flex-shrink-0 flex items-center justify-between
                          gap-4 px-6 py-4 border-t border-white/[0.06]
                          bg-zinc-900/60 backdrop-blur-sm">

            {/* Summary */}
            <div className="min-w-0">
              {folderName.trim() ? (
                <p className="text-xs font-semibold text-zinc-400 truncate">
                  📁 {folderName}
                </p>
              ) : (
                <p className="text-xs text-zinc-600">No folder name yet</p>
              )}
              <p className="text-[10px] text-zinc-600 mt-0.5">
                {files.length > 0
                  ? `${files.length} file${files.length !== 1 ? 's' : ''} · ${fmtBytes(totalSize)}`
                  : 'No files selected'
                }
              </p>
            </div>

            {/* Buttons */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                type="button"
                onClick={handleClose}
                disabled={uploading}
                className="px-4 py-2.5 rounded-xl text-sm font-medium
                           text-zinc-400 hover:text-white hover:bg-zinc-800
                           transition-colors disabled:opacity-40"
              >
                Cancel
              </button>

              <button
                type="submit"
                form="upload-form"
                disabled={!canSubmit}
                title={
                  !folderName.trim()
                    ? 'Enter a folder name first'
                    : files.length === 0
                    ? 'Add at least one file'
                    : 'Create share'
                }
                className="flex items-center gap-2 px-5 py-2.5
                           bg-violet-600 hover:bg-violet-500
                           disabled:bg-zinc-800 disabled:text-zinc-500
                           disabled:cursor-not-allowed
                           rounded-xl text-sm font-semibold text-white
                           shadow-lg shadow-violet-900/20
                           transition-all duration-150"
              >
                {uploading
                  ? <><Loader2 size={14} className="animate-spin" />Uploading…</>
                  : <><Upload size={14} />Create Share</>
                }
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
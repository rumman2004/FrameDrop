import { useState, useRef, useEffect } from 'react';
import { Lock, X } from 'lucide-react';

export default function PinModal({ isOpen, onSubmit, onClose, loading, error }) {
  const [pin, setPin] = useState(['', '', '', '']);
  const inputs = useRef([]);

  useEffect(() => {
    if (isOpen) {
      setPin(['', '', '', '']);
      setTimeout(() => inputs.current[0]?.focus(), 100);
    }
  }, [isOpen]);

  const handleChange = (idx, val) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...pin];
    next[idx] = val;
    setPin(next);
    if (val && idx < 3) inputs.current[idx + 1]?.focus();
    if (next.every((d) => d !== '')) onSubmit(next.join(''));
  };

  const handleKeyDown = (idx, e) => {
    if (e.key === 'Backspace' && !pin[idx] && idx > 0) {
      inputs.current[idx - 1]?.focus();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 w-full max-w-sm mx-4 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg"
        >
          <X size={18} />
        </button>

        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-violet-600/20 border border-violet-500/30 rounded-2xl
                          flex items-center justify-center mx-auto mb-4">
            <Lock size={24} className="text-violet-400" />
          </div>
          <h2 className="text-xl font-bold">Enter PIN</h2>
          <p className="text-zinc-400 text-sm mt-1">This share is protected by a 4-digit PIN</p>
        </div>

        <div className="flex justify-center gap-3 mb-4">
          {pin.map((digit, idx) => (
            <input
              key={idx}
              ref={(el) => (inputs.current[idx] = el)}
              type="password"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(idx, e.target.value)}
              onKeyDown={(e) => handleKeyDown(idx, e)}
              className="w-14 h-14 text-center text-2xl font-bold bg-zinc-800 border border-zinc-700
                         rounded-xl focus:outline-none focus:border-violet-500 focus:ring-2
                         focus:ring-violet-500/20 transition-all"
            />
          ))}
        </div>

        {loading && (
          <p className="text-center text-zinc-400 text-sm animate-pulse">Verifying...</p>
        )}
        {error && (
          <p className="text-center text-red-400 text-sm">{error}</p>
        )}
      </div>
    </div>
  );
}
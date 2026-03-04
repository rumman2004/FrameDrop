import { useEffect, useState, useRef, useCallback } from 'react';
import { useAuth } from '../../hooks/useAuth';
import ProfileCard from '../../components/ui/ProfileCard';
import Card from '../../components/ui/Card';
import api from '../../lib/api';
import { Camera, Loader2, CheckCircle, AlertCircle } from 'lucide-react';

export default function Profile() {
  const { user, updateUser } = useAuth();

  const [sessions,        setSessions]        = useState([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [sessionsError,   setSessionsError]   = useState(false);

  // ── Avatar upload state ───────────────────────────────────────────────
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarMsg,       setAvatarMsg]       = useState(null); // { type: 'success'|'error', text }
  const fileInputRef = useRef(null);

  // ── Fetch user's share sessions ───────────────────────────────────────
  useEffect(() => {
    api.get('/share/my')
      .then(({ data }) => {
        setSessions(Array.isArray(data) ? data : []);
        setSessionsError(false);
      })
      .catch(() => setSessionsError(true))
      .finally(() => setSessionsLoading(false));
  }, []);

  // ── Derived stats ─────────────────────────────────────────────────────
  const now     = new Date();
  const active  = sessions.filter((s) => new Date(s.expiresAt) > now);
  const expired = sessions.filter((s) => new Date(s.expiresAt) <= now);

  // ── Handle avatar file pick ───────────────────────────────────────────
  const handleAvatarChange = useCallback(async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Client-side validation
    if (!file.type.startsWith('image/'))
      return setAvatarMsg({ type: 'error', text: 'Please select an image file' });
    if (file.size > 5 * 1024 * 1024)
      return setAvatarMsg({ type: 'error', text: 'Image must be under 5MB' });

    const formData = new FormData();
    formData.append('avatar', file);

    setAvatarUploading(true);
    setAvatarMsg(null);

    try {
      const { data } = await api.patch('/auth/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      updateUser({ avatar: data.avatar });
      setAvatarMsg({ type: 'success', text: 'Profile picture updated!' });
    } catch (err) {
      setAvatarMsg({
        type: 'error',
        text: err.response?.data?.message || 'Upload failed. Try again.',
      });
    } finally {
      setAvatarUploading(false);
      // Reset so the same file can be picked again
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }, [updateUser]);

  // ── Avatar initials fallback ──────────────────────────────────────────
  const initials = user?.name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) ?? '?';

  // ── Format dates safely ───────────────────────────────────────────────
  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    if (isNaN(d)) return '—';
    return d.toLocaleDateString('en-US', {
      year:  'numeric',   // ← was 'month' which is invalid
      month: 'long',
      day:   'numeric',
    });
  };

  const formatDateTime = (dateStr) => {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    if (isNaN(d)) return '—';
    return d.toLocaleString('en-US', {
      year:   'numeric',
      month:  'short',
      day:    'numeric',
      hour:   '2-digit',
      minute: '2-digit',
    });
  };

  // ── Account detail rows ───────────────────────────────────────────────
  const accountDetails = [
    { label: 'Full Name',    value: user?.name },
    { label: 'Email',        value: user?.email },
    { label: 'Role',         value: user?.isAdmin ? 'Administrator' : 'Photographer' },
    { label: 'Member Since', value: formatDate(user?.createdAt) },
    { label: 'Last Login',   value: formatDateTime(user?.lastLogin) },
  ];

  // ── Stat cards ────────────────────────────────────────────────────────
  const stats = [
    { label: 'Total',   value: sessions.length, color: 'text-white'      },
    { label: 'Active',  value: active.length,   color: 'text-green-400'  },
    { label: 'Expired', value: expired.length,  color: 'text-red-400'    },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      <h1 className="text-2xl font-bold">Profile</h1>

      <div className="grid md:grid-cols-3 gap-6">

        {/* ── Left column ───────────────────────────────────────────────── */}
        <div className="space-y-4">
          <ProfileCard
            name={user?.name ?? 'User'}
            handle={user?.email?.split('@')[0] ?? 'user'}
            title={user?.isAdmin ? 'Administrator' : 'Photographer'}
            status="Online"
            avatarUrl={user?.avatar ?? ''}
            miniAvatarUrl={user?.avatar ?? ''}
            contactText="Edit Photo"
            onContactClick={() => fileInputRef.current?.click()}
          />

          {/* ── Avatar upload card ──────────────────────────────────────── */}
          <Card className="p-4">
            <p className="text-sm text-zinc-400 mb-3 font-medium">Profile Picture</p>

            <div className="flex items-center gap-4">

              {/* Preview / initials */}
              <div className="relative flex-shrink-0">
                {user?.avatar ? (
                  <img
                    src={user.avatar}
                    alt={`${user.name ?? 'User'} avatar`}
                    className="w-16 h-16 rounded-full object-cover border-2 border-zinc-700"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-violet-600/30 border-2 border-violet-500/50
                                  flex items-center justify-center text-xl font-bold text-violet-300
                                  select-none">
                    {initials}
                  </div>
                )}

                {/* Camera button overlay */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={avatarUploading}
                  aria-label="Change profile picture"
                  className="absolute -bottom-1 -right-1 p-1.5 bg-violet-600 hover:bg-violet-500
                             rounded-full border-2 border-zinc-900 transition-colors
                             disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {avatarUploading
                    ? <Loader2 size={12} className="animate-spin" />
                    : <Camera size={12} />
                  }
                </button>
              </div>

              {/* Label + feedback */}
              <div className="flex-1 min-w-0">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={avatarUploading}
                  className="text-sm text-violet-400 hover:text-violet-300 font-medium
                             disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {avatarUploading ? 'Uploading...' : 'Change photo'}
                </button>
                <p className="text-xs text-zinc-500 mt-0.5">JPG, PNG, WebP — max 5MB</p>

                {avatarMsg && (
                  <div className={`flex items-center gap-1.5 mt-2 text-xs font-medium
                    ${avatarMsg.type === 'success' ? 'text-green-400' : 'text-red-400'}`}>
                    {avatarMsg.type === 'success'
                      ? <CheckCircle size={12} />
                      : <AlertCircle size={12} />
                    }
                    <span>{avatarMsg.text}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              className="hidden"
              onChange={handleAvatarChange}
            />
          </Card>
        </div>

        {/* ── Right column ──────────────────────────────────────────────── */}
        <div className="md:col-span-2 space-y-4">

          {/* Account details */}
          <Card className="p-6">
            <h3 className="font-semibold mb-4">Account Details</h3>
            <div className="space-y-0 text-sm">
              {accountDetails.map(({ label, value }) => (
                <div
                  key={label}
                  className="flex justify-between py-2.5 border-b border-zinc-800 last:border-0"
                >
                  <span className="text-zinc-400">{label}</span>
                  <span className="font-medium text-right max-w-[60%] truncate">
                    {value ?? '—'}
                  </span>
                </div>
              ))}
            </div>
          </Card>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            {sessionsError ? (
              <Card className="col-span-3 p-4 text-center text-zinc-500 text-sm">
                Failed to load share stats
              </Card>
            ) : (
              stats.map(({ label, value, color }) => (
                <Card key={label} className="p-4 text-center">
                  <p className={`text-3xl font-bold ${color}`}>
                    {sessionsLoading ? (
                      <Loader2 size={24} className="animate-spin mx-auto text-zinc-500" />
                    ) : (
                      value
                    )}
                  </p>
                  <p className="text-zinc-500 text-xs mt-1">{label} Shares</p>
                </Card>
              ))
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
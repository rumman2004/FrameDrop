export default function Button({
  children, variant = 'primary', size = 'md',
  className = '', loading = false, ...props
}) {
  const base = 'inline-flex items-center justify-center gap-2 font-medium rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed';

  const variants = {
    primary:  'bg-violet-600 hover:bg-violet-500 text-white',
    secondary:'bg-zinc-800 hover:bg-zinc-700 text-white',
    danger:   'bg-red-600 hover:bg-red-500 text-white',
    ghost:    'text-zinc-400 hover:text-white hover:bg-zinc-800',
    outline:  'border border-zinc-700 hover:border-violet-500 text-zinc-300 hover:text-white',
  };

  const sizes = {
    sm:  'px-3 py-1.5 text-xs',
    md:  'px-4 py-2 text-sm',
    lg:  'px-6 py-3 text-base',
    xl:  'px-8 py-4 text-lg',
  };

  return (
    <button
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading && (
        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      )}
      {children}
    </button>
  );
}
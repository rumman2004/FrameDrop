export default function Card({ children, className = '', hover = false, ...props }) {
  return (
    <div
      className={`bg-zinc-900 border border-zinc-800 rounded-2xl
                  ${hover ? 'hover:border-zinc-700 transition-all hover:shadow-lg hover:shadow-black/20' : ''}
                  ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
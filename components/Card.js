export default function Card({ children, className = '' }) {
  return (
    <div
      className={`rounded-card border-2 border-line bg-surface p-5 shadow-sm ${className}`}
    >
      {children}
    </div>
  );
}

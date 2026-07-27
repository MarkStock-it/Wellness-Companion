export default function Card({ children, className = '' }) {
  return (
    <div
      className={`rounded-[22px] border border-line/80 bg-surface p-5 shadow-[0_10px_30px_rgba(61,48,35,.06)] ${className}`}
    >
      {children}
    </div>
  );
}

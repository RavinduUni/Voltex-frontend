import { Loader2 } from 'lucide-react';

export function EmptyState({ icon: Icon, title, children, action }) {
  return (
    <div className="empty">
      {Icon && (
        <div className="empty__icon">
          <Icon size={28} strokeWidth={1.6} />
        </div>
      )}
      <h3>{title}</h3>
      {children && <p>{children}</p>}
      {action}
    </div>
  );
}

export function Spinner({ label = 'Loading' }) {
  return (
    <div className="spinner" role="status">
      <Loader2 size={22} className="spin" />
      <span className="sr-only">{label}</span>
    </div>
  );
}

export function GridSkeleton({ count = 8 }) {
  return (
    <div className="grid" aria-hidden>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="card card--skeleton">
          <div className="plinth shimmer" />
          <div className="shimmer line" />
          <div className="shimmer line line--short" />
        </div>
      ))}
    </div>
  );
}

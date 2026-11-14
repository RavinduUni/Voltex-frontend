import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

/** Right-hand side panel with focus handling and Escape to close. */
export default function Sheet({ open, onClose, title, children, footer, width = 440, labelledBy, side = 'right' }) {
  const panelRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement;
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    requestAnimationFrame(() => panelRef.current?.focus());
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
      prev?.focus?.();
    };
  }, [open, onClose]);

  return (
    <div className={`sheet sheet--${side} ${open ? 'is-open' : ''}`} aria-hidden={!open}>
      <div className="sheet__scrim" onClick={onClose} />
      <aside
        className="sheet__panel"
        style={{ '--sheet-w': `${width}px` }}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy || 'sheet-title'}
        tabIndex={-1}
        ref={panelRef}
      >
        <header className="sheet__head">
          <h2 id={labelledBy || 'sheet-title'}>{title}</h2>
          <button className="icon-btn" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </header>
        <div className="sheet__body">{open && children}</div>
        {footer && open && <footer className="sheet__foot">{footer}</footer>}
      </aside>
    </div>
  );
}

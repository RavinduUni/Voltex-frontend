import { Minus, Plus, Loader2 } from 'lucide-react';

export default function QuantityStepper({ value, min = 1, max = 99, onChange, busy = false, size = 'md', label = 'Quantity' }) {
  return (
    <div className={`stepper stepper--${size}`} role="group" aria-label={label}>
      <button
        type="button"
        aria-label="Decrease"
        disabled={busy || value <= min}
        onClick={() => onChange(value - 1)}
      >
        <Minus size={14} />
      </button>
      <output aria-live="polite">{busy ? <Loader2 size={14} className="spin" /> : value}</output>
      <button
        type="button"
        aria-label="Increase"
        disabled={busy || value >= max}
        onClick={() => onChange(value + 1)}
      >
        <Plus size={14} />
      </button>
    </div>
  );
}

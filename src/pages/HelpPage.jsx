import { Mail, Phone } from 'lucide-react';
import { DELIVERY_NOTES, FAQ, SUPPORT } from '../content';

export default function HelpPage() {
  return (
    <div className="page page--narrow help">
      <header className="page__head">
        <div>
          <h1 className="h1">Help</h1>
          <p className="muted">Answers about orders, products and your account.</p>
        </div>
      </header>

      {FAQ.map((g) => (
        <section key={g.group} className="help__group" aria-labelledby={`faq-${g.group}`}>
          <h2 className="h3" id={`faq-${g.group}`}>{g.group}</h2>
          <div className="faq">
            {g.items.map((f) => (
              <details key={f.q}>
                <summary>{f.q}</summary>
                <p>{f.a}</p>
              </details>
            ))}
          </div>
        </section>
      ))}

      <section id="delivery" className="help__group" aria-labelledby="delivery-title">
        <h2 className="h3" id="delivery-title">Delivery and returns</h2>
        <div className="notes">
          {DELIVERY_NOTES.map((n) => (
            <div key={n.title}>
              <h3>{n.title}</h3>
              <p>{n.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="contact" aria-labelledby="contact-title">
        <h2 className="h3" id="contact-title">Still need help?</h2>
        <p>Contact support with your order number and we’ll reply during {SUPPORT.hours.toLowerCase()}.</p>
        <div className="contact__ways">
          <a className="btn btn--primary" href={`mailto:${SUPPORT.email}`}><Mail size={16} /> {SUPPORT.email}</a>
          <a className="btn btn--ghost" href={`tel:${SUPPORT.phone.replace(/\s/g, '')}`}><Phone size={16} /> {SUPPORT.phone}</a>
        </div>
      </section>
    </div>
  );
}

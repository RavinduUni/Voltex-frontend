import { useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { STORE_NAME } from '../config';
import { useAuth } from '../context/AuthContext';
import { errorMessage } from '../api/client';
import { Wordmark } from '../components/Navbar';
import { gsap, useGSAP, reducedMotion } from '../lib/motion';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function Field({ label, error, hint, children, id }) {
  return (
    <div className={`field ${error ? 'has-error' : ''}`}>
      <label htmlFor={id}>{label}</label>
      {children}
      {error ? (
        <span className="field__msg" role="alert">{error}</span>
      ) : (
        hint && <span className="field__hint">{hint}</span>
      )}
    </div>
  );
}

function PasswordInput({ id, value, onChange, autoComplete }) {
  const [show, setShow] = useState(false);
  return (
    <div className="input-wrap">
      <input id={id} type={show ? 'text' : 'password'} value={value} onChange={onChange} autoComplete={autoComplete} />
      <button type="button" className="input-wrap__btn" onClick={() => setShow((s) => !s)} aria-label={show ? 'Hide password' : 'Show password'}>
        {show ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
  );
}

function SignInForm({ onDone }) {
  const { login } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    const next = {};
    if (!EMAIL_RE.test(form.email.trim())) next.email = 'Enter the email you signed up with.';
    if (!form.password) next.password = 'Enter your password.';
    setErrors(next);
    if (Object.keys(next).length) return;

    setBusy(true);
    setFormError('');
    try {
      await login(form.email, form.password);
      onDone();
    } catch (err) {
      const offline = err.isAxiosError && !err.response;
      setFormError(offline ? errorMessage(err) : err.isAxiosError ? 'Email or password is incorrect.' : err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} noValidate className="auth-form">
      {formError && <div className="alert alert--error" role="alert">{formError}</div>}
      <Field id="si-email" label="Email" error={errors.email}>
        <input id="si-email" type="email" autoComplete="email" value={form.email} onChange={set('email')} />
      </Field>
      <Field id="si-password" label="Password" error={errors.password}>
        <PasswordInput id="si-password" value={form.password} onChange={set('password')} autoComplete="current-password" />
      </Field>
      <button className="btn btn--primary btn--block btn--lg" disabled={busy}>
        {busy && <Loader2 size={16} className="spin" />} Sign in
      </button>
    </form>
  );
}

function RegisterForm({ onDone }) {
  const { register } = useAuth();
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', phone: '', password: '' });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    const next = {};
    if (!form.firstName.trim()) next.firstName = 'Enter your first name.';
    if (!EMAIL_RE.test(form.email.trim())) next.email = 'Enter a valid email, like name@example.com.';
    if (form.phone && !/^[+\d][\d\s-]{6,}$/.test(form.phone.trim())) next.phone = 'Use digits only, like 0771234567.';
    if (form.password.length < 6) next.password = 'Use at least 6 characters.';
    setErrors(next);
    if (Object.keys(next).length) return;

    setBusy(true);
    setFormError('');
    try {
      await register({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || null,
        password: form.password,
      });
      onDone(true);
    } catch (err) {
      setFormError(errorMessage(err, 'The account could not be created. That email may already be registered.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} noValidate className="auth-form">
      {formError && <div className="alert alert--error" role="alert">{formError}</div>}
      <div className="field-row">
        <Field id="re-first" label="First name" error={errors.firstName}>
          <input id="re-first" autoComplete="given-name" value={form.firstName} onChange={set('firstName')} />
        </Field>
        <Field id="re-last" label="Last name">
          <input id="re-last" autoComplete="family-name" value={form.lastName} onChange={set('lastName')} />
        </Field>
      </div>
      <Field id="re-email" label="Email" error={errors.email} hint="You’ll use this to sign in.">
        <input id="re-email" type="email" autoComplete="email" value={form.email} onChange={set('email')} />
      </Field>
      <Field id="re-phone" label="Phone (optional)" error={errors.phone}>
        <input id="re-phone" type="tel" autoComplete="tel" value={form.phone} onChange={set('phone')} />
      </Field>
      <Field id="re-password" label="Password" error={errors.password} hint="At least 6 characters.">
        <PasswordInput id="re-password" value={form.password} onChange={set('password')} autoComplete="new-password" />
      </Field>
      <button className="btn btn--primary btn--block btn--lg" disabled={busy}>
        {busy && <Loader2 size={16} className="spin" />} Create account
      </button>
    </form>
  );
}

const READOUT = [
  ['Catalog', 'Laptops, phones, audio, wearables and more'],
  ['Specs', 'Shown up front on every product'],
  ['Compare', 'Up to 3 products, spec by spec'],
  ['Checkout', 'Saved address, receipt straight away'],
  ['Sessions', 'Signed in for 30 minutes at a time'],
];

export default function AuthPage() {
  const [mode, setMode] = useState('signin');
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/';
  const panel = useRef(null);

  useGSAP(
    () => {
      if (reducedMotion()) return;
      const tl = gsap.timeline({ delay: 0.15 });
      tl.from('.auth__mark', { yPercent: 40, opacity: 0, duration: 0.8, ease: 'power4.out' })
        .fromTo('.auth__scan', { top: '0%', opacity: 1 }, { top: '100%', duration: 1.6, ease: 'power1.inOut' }, 0.2)
        .to('.auth__scan', { opacity: 0, duration: 0.3 }, 1.6);
      gsap.utils.toArray('.auth__val', panel.current).forEach((el, i) => {
        tl.fromTo(el, { opacity: 0.3 }, { opacity: 1, duration: 0.8, scrambleText: { text: el.dataset.text, chars: '01<>/#=', speed: 0.6 } }, 0.35 + i * 0.16);
      });
    },
    { scope: panel }
  );

  return (
    <div className="auth">
      <section className="auth__brand" ref={panel} aria-hidden>
        <span className="auth__scan" />
        <div className="auth__top"><Wordmark /></div>
        <div>
          <p className="auth__mark">Tech, chosen by the spec sheet.</p>
          <dl className="auth__readout">
            {READOUT.map(([k, v]) => (
              <div key={k}>
                <dt>{k}</dt>
                <dd className="auth__val" data-text={v}>{v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="auth__panel">
        <div className="auth__card">
          <div className="auth__mobilebrand"><Wordmark /></div>
          <h1>{mode === 'signin' ? 'Welcome back' : 'Create your account'}</h1>
          <p className="muted">
            {mode === 'signin' ? `Sign in to shop ${STORE_NAME}, see your cart and track orders.` : 'It takes less than a minute.'}
          </p>
          <div className="seg" role="tablist" aria-label="Account">
            <button role="tab" aria-selected={mode === 'signin'} onClick={() => setMode('signin')}>Sign in</button>
            <button role="tab" aria-selected={mode === 'register'} onClick={() => setMode('register')}>Create account</button>
          </div>
          {mode === 'signin' ? (
            <SignInForm onDone={() => navigate(from, { replace: true })} />
          ) : (
            <RegisterForm onDone={() => navigate('/', { replace: true })} />
          )}
        </div>
      </section>
    </div>
  );
}

import { useEffect, useRef } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import CartDrawer from './CartDrawer';
import CompareTray from './CompareTray';
import CommandPalette from './CommandPalette';
import { gsap, ScrollTrigger, reducedMotion } from '../lib/motion';

export default function Layout() {
  const { pathname, hash } = useLocation();
  const mainRef = useRef(null);

  // On navigation: scroll to top (or the #anchor) and bring the new page in.
  useEffect(() => {
    if (hash) {
      requestAnimationFrame(() => document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: 'smooth' }));
    } else {
      window.scrollTo(0, 0);
    }
    if (!reducedMotion() && mainRef.current) {
      gsap.fromTo(mainRef.current, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.35, clearProps: 'transform,opacity' });
    }
    // Layout changed: recalculate any scroll-driven animations.
    requestAnimationFrame(() => ScrollTrigger.refresh());
  }, [pathname, hash]);

  return (
    <div className="app">
      <a href="#main" className="skip">Skip to content</a>
      <Navbar />
      <main id="main" className="main" ref={mainRef}>
        <Outlet />
      </main>
      <Footer />
      <CartDrawer />
      <CompareTray />
      <CommandPalette />
    </div>
  );
}

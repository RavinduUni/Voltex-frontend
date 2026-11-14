/**
 * GSAP setup. Plugins are registered once here; import gsap helpers from this file.
 * Every animation checks reducedMotion() so people who ask for less motion get
 * instant state changes instead.
 */
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { ScrambleTextPlugin } from 'gsap/ScrambleTextPlugin';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(ScrollTrigger, SplitText, ScrambleTextPlugin, useGSAP);
gsap.defaults({ ease: 'power3.out', duration: 0.6 });

export const reducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * Sends a copy of a product image from `fromEl` into the cart button
 * (the element marked data-cart-target), then nudges the button.
 */
export function flyToCart(fromEl) {
  const target = document.querySelector('[data-cart-target]');
  if (!fromEl || !target || reducedMotion()) return;
  const img = fromEl.querySelector('img') || fromEl;
  const a = img.getBoundingClientRect();
  const b = target.getBoundingClientRect();
  if (!a.width || !b.width) return;

  const ghost = document.createElement('div');
  ghost.className = 'fly-ghost';
  const size = Math.min(a.width, a.height, 160);
  Object.assign(ghost.style, {
    left: `${a.left + a.width / 2 - size / 2}px`,
    top: `${a.top + a.height / 2 - size / 2}px`,
    width: `${size}px`,
    height: `${size}px`,
  });
  if (img.tagName === 'IMG') ghost.style.backgroundImage = `url("${img.currentSrc || img.src}")`;
  document.body.appendChild(ghost);

  const dx = b.left + b.width / 2 - (a.left + a.width / 2);
  const dy = b.top + b.height / 2 - (a.top + a.height / 2);
  gsap
    .timeline({ onComplete: () => ghost.remove() })
    .to(ghost, { x: dx, duration: 0.75, ease: 'power1.inOut' }, 0)
    .to(ghost, { y: dy, duration: 0.75, ease: 'back.in(1.6)' }, 0)
    .to(ghost, { scale: 0.18, opacity: 0.4, duration: 0.75, ease: 'power2.in' }, 0)
    .fromTo(target, { scale: 1 }, { scale: 1.12, duration: 0.14, yoyo: true, repeat: 1, ease: 'power2.out' }, 0.68);
}

export { gsap, ScrollTrigger, SplitText, useGSAP };

import { Cable, Camera, Cpu, Gamepad2, Headphones, Keyboard, Laptop, Monitor, Mouse, Smartphone, Speaker, Tablet, Watch } from 'lucide-react';

const RULES = [
  [/laptop|notebook|macbook/i, Laptop],
  [/phone|mobile/i, Smartphone],
  [/tablet|ipad/i, Tablet],
  [/audio|headphone|earbud|sound/i, Headphones],
  [/speaker/i, Speaker],
  [/wear|watch|band/i, Watch],
  [/gam|console/i, Gamepad2],
  [/monitor|display|screen|tv/i, Monitor],
  [/camera|photo/i, Camera],
  [/keyboard/i, Keyboard],
  [/mouse|mice/i, Mouse],
  [/accessor|cable|charger|power/i, Cable],
];

/** Picks an icon from the category name; anything unknown gets a chip icon. */
export function categoryIcon(name = '') {
  for (const [re, Icon] of RULES) if (re.test(name)) return Icon;
  return Cpu;
}

export const shopLink = (params = {}) => {
  const q = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => v && q.set(k, v));
  const s = q.toString();
  return s ? `/shop?${s}` : '/shop';
};

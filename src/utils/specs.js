/**
 * Product descriptions are written as an intro paragraph followed by bullet lines:
 *   "16-inch gaming laptop ...\n\n• Intel Core i7-13650HX (14 cores)\n• Weight: about 2.5 kg"
 * This turns them into { intro, specs: [{ label, value }] } for the spec table,
 * chips and the compare page. Lines like "Weight: about 2.5 kg" get a label.
 */
export function parseSpecs(description = '') {
  const intro = [];
  const specs = [];
  for (const raw of String(description || '').split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) continue;
    const bullet = line.match(/^[•\-*·▪►]\s*(.+)$/);
    if (!bullet) {
      intro.push(line);
      continue;
    }
    const text = bullet[1].trim();
    const kv = text.match(/^([^:]{2,30}):\s+(.+)$/);
    specs.push(kv ? { label: kv[1].trim(), value: kv[2].trim() } : { label: null, value: text });
  }
  return { intro: intro.join(' '), specs };
}

/** "Intel Core i7-13650HX (14 cores, ...)" becomes "Intel Core i7-13650HX". */
export function shortSpec(text, max = 26) {
  let s = String(text).split(/\s\(/)[0].split(/,\s/)[0].trim();
  if (s.length > max) s = `${s.slice(0, max - 1).trimEnd()}…`;
  return s;
}

/** Up to `count` short spec chips for cards. */
export function specChips(description, count = 3) {
  return parseSpecs(description).specs.slice(0, count).map((s) => shortSpec(s.value));
}

/** Ordered rules: the first match names the spec. */
const LABEL_RULES = [
  ['Graphics', /\b(rtx|gtx|geforce|radeon|arc a\d|graphics|gpu)\b/i],
  ['Processor', /\b(intel|amd ryzen|ryzen|core i\d|snapdragon|exynos|dimensity|bionic|apple m\d|\bm\d chip|processor|cpu|tensor g\d)\b/i],
  ['Memory', /\b(ram|ddr\d|lpddr)/i],
  ['Storage', /\b(ssd|nvme|hdd|storage|\d+\s?tb\b)/i],
  ['Display', /(display|screen|panel|oled|amoled|\bips\b|\bhz\b|\d+(\.\d+)?["”]\s)/i],
  ['Camera', /\b(\d+\s?mp|camera|lens|\d\.\dk|4k\d{2}|5\.3k)/i],
  ['Video', /\b(4k|8k|1080p|fps)\b/i],
  ['Battery', /\b(battery|mah|playback|playtime|hours|charge)/i],
  ['Audio', /\b(drivers?|ldac|hi-res|hi-fi|audio|sound|anc)\b|noise[- ]cancel/i],
  ['Connectivity', /\b(wi-?fi|bluetooth|usb|thunderbolt|hdmi|nfc|5g|lte|multipoint)\b/i],
  ['Durability', /\b(ip\d{2}|ipx\d|waterproof|water resistance|mil-std|rugged)/i],
  ['Weight', /\b(weight|\d+(\.\d+)?\s?(kg|g)\b)/i],
  ['Software', /\b(windows|macos|android|ios|wear os|os)\b/i],
  ['Health', /\b(heart rate|ecg|sleep|spo2|fitness|workout)/i],
];

/** A short label for a spec line, from its own label or its content. */
export function specLabel(spec) {
  if (spec.label) return spec.label;
  for (const [label, re] of LABEL_RULES) if (re.test(spec.value)) return label;
  return 'Feature';
}

/** Trims to `max` characters at a word boundary, keeping brackets intact otherwise. */
export function clip(text, max = 44) {
  const s = String(text).trim();
  if (s.length <= max) return s;
  const cut = s.slice(0, max - 1);
  return `${cut.slice(0, Math.max(cut.lastIndexOf(' '), max * 0.6)).trimEnd()}…`;
}

// One-shot generator for the PWA app icons (public/icon-192.png + icon-512.png).
// Produces a gold 5-point star on the dark brand background — placeholder
// artwork that matches the ★ used in <AppBar> and <ComingSoon>. Swap the PNGs
// out later if real artwork lands; the rest of the PWA wiring keys off the
// filename, not the content.
//
// Run with: node scripts/gen_icons.mjs
//
// Geometry: the star fits inside the inner 70% of the canvas, which keeps it
// inside the maskable-icon "safe zone" so Android adaptive icons won't crop the
// points. iOS doesn't apply masks but tolerates the padding.

import { Resvg } from "@resvg/resvg-js";
import { writeFileSync } from "node:fs";

const BG = "#0b0f1a";       // brand bg (matches index.html body)
const GOLD = "#FFD700";     // Jeremy's color = brand accent ★

function starPath(cx, cy, outerR, innerR, points = 5) {
  const step = Math.PI / points;
  const coords = [];
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? outerR : innerR;
    const a = i * step - Math.PI / 2; // start at top
    coords.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]);
  }
  return (
    "M " +
    coords.map(([x, y], i) => `${x.toFixed(2)} ${y.toFixed(2)}`).join(" L ") +
    " Z"
  );
}

function makeSvg(size) {
  const cx = size / 2;
  const cy = size / 2;
  const outer = size * 0.36;     // 36% of canvas = 72% diameter → fits maskable safe zone
  const inner = outer * 0.40;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" fill="${BG}"/>
  <path d="${starPath(cx, cy, outer, inner)}" fill="${GOLD}"/>
</svg>`;
}

for (const size of [192, 512]) {
  const svg = makeSvg(size);
  const png = new Resvg(svg, { fitTo: { mode: "width", value: size } })
    .render()
    .asPng();
  const path = `public/icon-${size}.png`;
  writeFileSync(path, png);
  console.log(`✓ wrote ${path} (${png.length} bytes)`);
}

/**
 * Timing data for the landing hero video
 * (/media/arcane-animation-00m08s5-to-00m22s-fullhd.mp4, 13.5 s).
 *
 * `SCENES` are the hard cuts measured with ffmpeg's scene detector; every
 * on-page element (title, stats, wash tint, captions) keys off the active
 * scene so the UI moves with the picture instead of on arbitrary timers.
 *
 * `ENVELOPE` is the clip's loudness (RMS, mono, 100 ms windows, normalised
 * 0..1). It drives the "pulse" CSS variable so glows, scale and bar heights
 * follow the soundtrack even while the video is muted.
 */

export const VIDEO_DURATION = 13.5;

export const SCENES = [
  {
    id: "recon",
    at: 0,
    label: "RECON",
    caption: "Zaun, seen from the rooftops",
    accent: "#9fb2c2",
    mono: true,
  },
  {
    id: "scope",
    at: 2.25,
    label: "TARGET LOCKED",
    caption: "Through the scope",
    accent: "#e2d3a6",
    mono: true,
  },
  {
    id: "jinx",
    at: 4.17,
    label: "JINX",
    caption: "Powder's shadow steps in",
    accent: "#53d8ff",
    mono: false,
  },
  {
    id: "vi",
    at: 8.54,
    label: "VI",
    caption: "Hextech gauntlets, charged",
    accent: "#ff5fa2",
    mono: false,
  },
  {
    id: "blast",
    at: 9.83,
    label: "SHOCKWAVE",
    caption: "Shimmer overload",
    accent: "#ff3fd1",
    mono: false,
  },
  {
    id: "clash",
    at: 13,
    label: "SISTERS",
    caption: "Collision course",
    accent: "#ffe47a",
    mono: false,
  },
];

export const ENVELOPE_STEP = 0.1;
// prettier-ignore
export const ENVELOPE = [
  0.78,0.84,0.74,0.64,0.76,0.7,0.77,0.79,0.79,0.63,0.61,0.59,0.58,0.68,0.84,0.8,0.76,0.73,0.75,0.78,
  0.79,0.82,0.87,0.8,0.78,0.86,0.81,0.89,0.9,0.89,0.82,0.83,0.74,0.62,0.62,0.79,0.72,0.63,0.64,0.62,
  0.62,0.67,0.72,0.73,0.61,0.6,0.54,0.64,0.63,0.75,0.74,0.62,0.63,0.68,0.7,0.71,0.77,0.78,0.7,0.66,
  0.65,0.61,0.7,0.79,0.69,0.67,0.76,0.73,0.81,0.83,0.86,0.77,0.72,0.73,0.83,0.83,0.73,0.78,0.8,0.73,
  0.68,0.69,0.66,0.63,0.76,0.78,0.88,0.79,0.72,0.71,0.63,0.77,0.75,0.83,0.78,0.8,0.79,0.78,0.91,0.85,
  0.81,0.79,0.83,0.8,0.77,0.8,0.78,0.78,0.66,0.64,0.59,0.61,0.7,0.76,0.7,0.59,0.6,0.51,0.59,0.72,
  0.74,0.71,0.55,0.59,0.59,0.65,0.75,0.82,0.74,0.71,0.75,0.73,0.91,1.0,0.97,0.6,
];

export function sceneAt(time) {
  let current = SCENES[0];
  for (const scene of SCENES) {
    if (time >= scene.at) current = scene;
    else break;
  }
  return current;
}

export function pulseAt(time) {
  if (!Number.isFinite(time) || time < 0) return 0;
  const position = time / ENVELOPE_STEP;
  const index = Math.floor(position);
  const a = ENVELOPE[Math.min(index, ENVELOPE.length - 1)];
  const b = ENVELOPE[Math.min(index + 1, ENVELOPE.length - 1)];
  const t = position - index;
  // Re-map the (fairly loud) envelope to a wider 0..1 range for visible motion.
  const raw = a + (b - a) * t;
  return Math.min(1, Math.max(0, (raw - 0.5) / 0.5));
}

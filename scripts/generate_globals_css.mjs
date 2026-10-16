import fs from 'fs';
import path from 'path';

const THEMES_DATA = [
  {
    id: 'mono-dark',
    name: 'Black & White',
    mode: 'dark',
    bg: '#000000',
    fg: '#FFFFFF',
    surface: '#0A0A0A',
    card: '#121212',
    cardHover: '#1C1C1C',
    borderSubtle: '#262626',
    borderBright: '#3F3F46',
    cyan: '#FFFFFF',
    emerald: '#FFFFFF',
    amber: '#E5E5E5',
    rose: '#F87171',
    accentRgb: '255 255 255',
    accent2Rgb: '161 161 170',
    gridRgb: '255 255 255',
    authCardBg: '#0C0C0E',
    authCardBorder: '#27272A',
  },
  {
    id: 'mono-light',
    name: 'White & Black',
    mode: 'light',
    bg: '#F8FAFC',
    fg: '#09090B',
    surface: '#FFFFFF',
    card: '#FFFFFF',
    cardHover: '#F1F5F9',
    borderSubtle: '#E2E8F0',
    borderBright: '#CBD5E1',
    cyan: '#09090B',
    emerald: '#15803D',
    amber: '#B45309',
    rose: '#E11D48',
    accentRgb: '9 9 11',
    accent2Rgb: '113 113 122',
    gridRgb: '60 40 30',
    authCardBg: '#FFFFFF',
    authCardBorder: '#E2E8F0',
  },
  {
    id: 'striking-simple',
    name: 'Striking and Simple',
    mode: 'dark',
    bg: '#0B0C10',
    fg: '#F1F5F9',
    surface: '#10141E',
    card: '#1F2833',
    cardHover: '#283442',
    borderSubtle: '#2D3B4C',
    borderBright: '#45A29E',
    cyan: '#66FCF1',
    emerald: '#45A29E',
    amber: '#F59E0B',
    rose: '#F43F5E',
    accentRgb: '102 252 241',
    accent2Rgb: '69 162 158',
    gridRgb: '255 255 255',
    authCardBg: '#10141E',
    authCardBorder: '#2D3B4C',
  },
  {
    id: 'metallic-chic',
    name: 'Metallic Chic',
    mode: 'light',
    bg: '#EDE8F5',
    fg: '#1E293B',
    surface: '#FFFFFF',
    card: '#FFFFFF',
    cardHover: '#E4DFEE',
    borderSubtle: '#ADBBDA',
    borderBright: '#8697C4',
    cyan: '#3D52A0',
    emerald: '#7091E6',
    amber: '#D97706',
    rose: '#E11D48',
    accentRgb: '61 82 160',
    accent2Rgb: '112 145 230',
    gridRgb: '61 82 160',
    authCardBg: '#FFFFFF',
    authCardBorder: '#ADBBDA',
  },
  {
    id: 'deep-vintage',
    name: 'Deep Vintage Mood',
    mode: 'dark',
    bg: '#1A343D',
    fg: '#FBE9D0',
    surface: '#203F4A',
    card: '#244855',
    cardHover: '#2E5867',
    borderSubtle: '#376270',
    borderBright: '#90AEAD',
    cyan: '#E64833',
    emerald: '#90AEAD',
    amber: '#E64833',
    rose: '#874F41',
    accentRgb: '230 72 51',
    accent2Rgb: '144 174 173',
    gridRgb: '251 233 208',
    authCardBg: '#203F4A',
    authCardBorder: '#376270',
  },
  {
    id: 'cool-collected',
    name: 'Cool and Collected',
    mode: 'dark',
    bg: '#003135',
    fg: '#AFDDE5',
    surface: '#024248',
    card: '#024950',
    cardHover: '#045B64',
    borderSubtle: '#08636C',
    borderBright: '#0FA4AF',
    cyan: '#0FA4AF',
    emerald: '#0FA4AF',
    amber: '#964734',
    rose: '#964734',
    accentRgb: '15 164 175',
    accent2Rgb: '150 71 52',
    gridRgb: '175 221 229',
    authCardBg: '#024248',
    authCardBorder: '#08636C',
  },
  {
    id: 'cosmic-artistry',
    name: 'Cosmic Artistry',
    mode: 'dark',
    bg: '#182026',
    fg: '#D3D9D4',
    surface: '#212A31',
    card: '#2E3944',
    cardHover: '#394654',
    borderSubtle: '#3E4D5B',
    borderBright: '#748D92',
    cyan: '#748D92',
    emerald: '#124E66',
    amber: '#E5A83B',
    rose: '#E05263',
    accentRgb: '116 141 146',
    accent2Rgb: '18 78 102',
    gridRgb: '211 217 212',
    authCardBg: '#212A31',
    authCardBorder: '#3E4D5B',
  },
  {
    id: 'vibrant-calm',
    name: 'Vibrant but Calm',
    mode: 'light',
    bg: '#EBE9E1',
    fg: '#1E1B18',
    surface: '#FFFFFF',
    card: '#FFFFFF',
    cardHover: '#F4F2EB',
    borderSubtle: '#FFA2B6',
    borderBright: '#D6536D',
    cyan: '#E43D12',
    emerald: '#EFB11D',
    amber: '#EFB11D',
    rose: '#D6536D',
    accentRgb: '228 61 18',
    accent2Rgb: '239 177 29',
    gridRgb: '228 61 18',
    authCardBg: '#FFFFFF',
    authCardBorder: '#FFA2B6',
  },
  {
    id: 'texturized-dynamic',
    name: 'Texturized & Dynamic',
    mode: 'dark',
    bg: '#1C3334',
    fg: '#F3F4F6',
    surface: '#243F40',
    card: '#2F4454',
    cardHover: '#385366',
    borderSubtle: '#376E6F',
    borderBright: '#DA7B93',
    cyan: '#DA7B93',
    emerald: '#376E6F',
    amber: '#E5A83B',
    rose: '#DA7B93',
    accentRgb: '218 123 147',
    accent2Rgb: '55 110 111',
    gridRgb: '243 244 246',
    authCardBg: '#243F40',
    authCardBorder: '#376E6F',
  },
  {
    id: 'minimal-warm',
    name: 'Minimal Yet Warm',
    mode: 'light',
    bg: '#EAE7DC',
    fg: '#2A2624',
    surface: '#F6F4EE',
    card: '#F6F4EE',
    cardHover: '#E4E0D4',
    borderSubtle: '#D8C3A5',
    borderBright: '#8E8D8A',
    cyan: '#E85A4F',
    emerald: '#E98074',
    amber: '#D97706',
    rose: '#E85A4F',
    accentRgb: '232 90 79',
    accent2Rgb: '233 128 116',
    gridRgb: '142 141 138',
    authCardBg: '#F6F4EE',
    authCardBorder: '#D8C3A5',
  },
  {
    id: 'vivid-sharp',
    name: 'Vivid and Sharp',
    mode: 'dark',
    bg: '#1D122B',
    fg: '#F8FAFC',
    surface: '#251736',
    card: '#2A1B3D',
    cardHover: '#382552',
    borderSubtle: '#44318D',
    borderBright: '#8F4FA2',
    cyan: '#D83F87',
    emerald: '#A4B3B6',
    amber: '#F59E0B',
    rose: '#D83F87',
    accentRgb: '216 63 135',
    accent2Rgb: '68 49 141',
    gridRgb: '164 179 182',
    authCardBg: '#251736',
    authCardBorder: '#44318D',
  },
  {
    id: 'clean-energetic',
    name: 'Clean and Energetic',
    mode: 'dark',
    bg: '#0E1832',
    fg: '#FFFFFF',
    surface: '#15244C',
    card: '#1A2B56',
    cardHover: '#233973',
    borderSubtle: '#2E478C',
    borderBright: '#5AB9EA',
    cyan: '#5AB9EA',
    emerald: '#84CEEB',
    amber: '#F59E0B',
    rose: '#8860D0',
    accentRgb: '90 185 234',
    accent2Rgb: '136 96 208',
    gridRgb: '193 200 228',
    authCardBg: '#15244C',
    authCardBorder: '#2E478C',
  },
  {
    id: 'youthful-fun',
    name: 'Youthful and Fun',
    mode: 'light',
    bg: '#F5E6CC',
    fg: '#1F1726',
    surface: '#FFFFFF',
    card: '#FFFFFF',
    cardHover: '#EDE0C6',
    borderSubtle: '#FFB48F',
    borderBright: '#A64AC9',
    cyan: '#A64AC9',
    emerald: '#17E9E0',
    amber: '#FCCD04',
    rose: '#FF6B8B',
    accentRgb: '166 74 201',
    accent2Rgb: '23 233 224',
    gridRgb: '166 74 201',
    authCardBg: '#FFFFFF',
    authCardBorder: '#FFB48F',
  },
  {
    id: 'gorgeous-contrast',
    name: 'Gorgeous Contrast',
    mode: 'dark',
    bg: '#181B1D',
    fg: '#F4F5F6',
    surface: '#1F2225',
    card: '#222629',
    cardHover: '#2E3337',
    borderSubtle: '#474B4F',
    borderBright: '#86C232',
    cyan: '#86C232',
    emerald: '#61892F',
    amber: '#EAB308',
    rose: '#F43F5E',
    accentRgb: '134 194 50',
    accent2Rgb: '97 137 47',
    gridRgb: '244 245 246',
    authCardBg: '#1F2225',
    authCardBorder: '#474B4F',
  },
  {
    id: 'close-to-nature',
    name: 'Close to Nature',
    mode: 'light',
    bg: '#F7F9FB',
    fg: '#1E282D',
    surface: '#FFFFFF',
    card: '#FFFFFF',
    cardHover: '#EDF2F6',
    borderSubtle: '#8FC1E3',
    borderBright: '#5085A5',
    cyan: '#31708E',
    emerald: '#687864',
    amber: '#D97706',
    rose: '#E11D48',
    accentRgb: '49 112 142',
    accent2Rgb: '104 120 100',
    gridRgb: '80 133 165',
    authCardBg: '#FFFFFF',
    authCardBorder: '#8FC1E3',
  },
  {
    id: 'loud-in-your-face',
    name: 'Loud and In-Your-Face',
    mode: 'dark',
    bg: '#180D1D',
    fg: '#F9FAFB',
    surface: '#24122C',
    card: '#2D1535',
    cardHover: '#3D1D48',
    borderSubtle: '#5A2768',
    borderBright: '#16FFBD',
    cyan: '#16FFBD',
    emerald: '#12C998',
    amber: '#F59E0B',
    rose: '#F070A1',
    accentRgb: '22 255 189',
    accent2Rgb: '240 112 161',
    gridRgb: '22 255 189',
    authCardBg: '#24122C',
    authCardBorder: '#5A2768',
  },
  {
    id: 'lively-soothing',
    name: 'Lively Yet Soothing',
    mode: 'light',
    bg: '#EDEAE5',
    fg: '#0A2E33',
    surface: '#FFFFFF',
    card: '#FFFFFF',
    cardHover: '#E5E1DB',
    borderSubtle: '#9FEDD7',
    borderBright: '#026670',
    cyan: '#026670',
    emerald: '#026670',
    amber: '#FCE181',
    rose: '#E11D48',
    accentRgb: '2 102 112',
    accent2Rgb: '159 237 215',
    gridRgb: '2 102 112',
    authCardBg: '#FFFFFF',
    authCardBorder: '#9FEDD7',
  },
];

let css = `@import "tailwindcss";

/* ============================================================
   ALGOCRAFT CSS DEPTH SYSTEM (12 PILLARS ARCHITECTURE)
   Ordered CSS Cascade Layers
   ============================================================ */
@layer reset, tokens, materials, components, utilities, a11y;

@layer tokens {
  :root {
    --background: #0b0c10;
    --foreground: #f1f5f9;
    --canvas: #0b0c10;
    --surface: #10141e;
    --card: #1f2833;
    --card-hover: #283442;
    --border-subtle: #2d3b4c;
    --border-bright: #45a29e;
    --cyan-accent: #66fcf1;
    --emerald-accent: #45a29e;
    --amber-accent: #f59e0b;
    --rose-accent: #f43f5e;

    /* Theme-neutral accent triplets; each theme overrides these */
    --accent-rgb: 102 252 241;
    --accent-2-rgb: 69 162 158;
    --danger-rgb: 244 63 94;
    --warn-rgb: 251 191 36;
    --success-rgb: 52 211 153;
    --grid-rgb: 255 255 255;
    --grid-alpha: .04;
    --skel-base: rgb(var(--grid-rgb) / .07);
    --skel-shine: rgb(var(--grid-rgb) / .14);

    /* Depth physics (dark defaults) */
    --shadow-rgb: 0 0 0;
    --shadow-k: 1; /* global shadow strength multiplier */
    --rim-1: inset 0 1px 0 rgb(255 255 255 / .05);
    --rim-2: inset 0 1px 0 rgb(255 255 255 / .08);
    --rim-3: inset 0 1px 0 rgb(255 255 255 / .12);
    --rim-bottom: inset 0 -1px 0 rgb(0 0 0 / .25);
    --channel: inset 0 2px 4px rgb(0 0 0 / .30), inset 0 0 0 1px rgb(0 0 0 / .20);
    --channel-lip: 0 1px 0 rgb(255 255 255 / .04);

    /* Motion */
    --ease-spring: cubic-bezier(.34, 1.56, .64, 1);
    --ease-out: cubic-bezier(.16, 1, .3, 1);
    --dur-fast: 120ms;
    --dur-base: 200ms;
    --dur-slow: 320ms;

    /* Pillar 2: Five-step elevation scale */
    --e0: none;
    --e1: 0 1px 1px rgb(var(--shadow-rgb) / calc(.20 * var(--shadow-k))),
          0 1px 3px rgb(var(--shadow-rgb) / calc(.14 * var(--shadow-k))),
          var(--rim-1);
    --e2: 0 2px 4px -1px rgb(var(--shadow-rgb) / calc(.22 * var(--shadow-k))),
          0 8px 16px -4px rgb(var(--shadow-rgb) / calc(.22 * var(--shadow-k))),
          var(--rim-2);
    --e3: 0 4px 6px -2px rgb(var(--shadow-rgb) / calc(.25 * var(--shadow-k))),
          0 14px 28px -6px rgb(var(--shadow-rgb) / calc(.30 * var(--shadow-k))),
          var(--rim-2);
    --e4: 0 10px 20px -5px rgb(var(--shadow-rgb) / calc(.35 * var(--shadow-k))),
          0 24px 48px -12px rgb(var(--shadow-rgb) / calc(.40 * var(--shadow-k))),
          0 0 0 1px var(--border-bright, rgb(255 255 255 / .08)),
          var(--rim-3);
    --e5: 0 32px 64px -16px rgb(var(--shadow-rgb) / calc(.55 * var(--shadow-k))),
          0 0 0 1px var(--border-bright, rgb(255 255 255 / .1)),
          var(--rim-3);
  }

  [data-mode="light"] {
    --shadow-rgb: 38 30 22; /* warm-tinted shadows read as natural on cream */
    --shadow-k: .38;
    --grid-rgb: 60 40 30;
    --grid-alpha: .07;
    --rim-1: inset 0 1px 0 rgb(255 255 255 / .55);
    --rim-2: inset 0 1px 0 rgb(255 255 255 / .75);
    --rim-3: inset 0 1px 0 rgb(255 255 255 / .9);
    --rim-bottom: inset 0 -1px 0 rgb(0 0 0 / .05);
    --channel: inset 0 1px 3px rgb(0 0 0 / .09), inset 0 0 0 1px rgb(0 0 0 / .04);
    --channel-lip: 0 1px 0 rgb(255 255 255 / .8);
  }

  [data-depth="off"] {
    --shadow-k: 0;
    --rim-1: none;
    --rim-2: none;
    --rim-3: none;
    --rim-bottom: none;
    --channel: none;
    --channel-lip: none;
  }
`;

for (const t of THEMES_DATA) {
  css += `
  [data-theme="${t.id}"] {
    --background: ${t.bg};
    --foreground: ${t.fg};
    --canvas: ${t.bg};
    --surface: ${t.surface};
    --card: ${t.card};
    --card-hover: ${t.cardHover};
    --border-subtle: ${t.borderSubtle};
    --border-bright: ${t.borderBright};
    --cyan-accent: ${t.cyan};
    --emerald-accent: ${t.emerald};
    --amber-accent: ${t.amber};
    --rose-accent: ${t.rose};
    --accent-rgb: ${t.accentRgb};
    --accent-2-rgb: ${t.accent2Rgb};
    --grid-rgb: ${t.gridRgb};
    --grid-alpha: ${t.mode === 'light' ? '.07' : '.04'};
    --skel-base: rgb(var(--grid-rgb) / .07);
    --skel-shine: rgb(var(--grid-rgb) / .14);
    background-color: ${t.bg};
    color: ${t.fg};
  }
`;
}

css += `}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --font-sans: var(--font-geist-sans);
  --font-mono: var(--font-geist-mono);
}

body {
  background: var(--background);
  color: var(--foreground);
  font-family: var(--font-geist-sans), -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  overflow-x: hidden;
  transition: background-color 0.2s ease, color 0.2s ease;
}

/* Custom scrollbars */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}
::-webkit-scrollbar-track {
  background: var(--background);
}
::-webkit-scrollbar-thumb {
  background: var(--border-subtle);
  border-radius: 3px;
}
::-webkit-scrollbar-thumb:hover {
  background: var(--border-bright);
}

.font-code {
  font-family: var(--font-geist-mono), "JetBrains Mono", "Fira Code", monospace;
}

/* ============================================================
   PILLAR 3: MATERIAL UTILITY CLASSES
   ============================================================ */
@layer materials {
  .surface-1 {
    background: var(--surface);
    box-shadow: var(--e1);
    border: 1px solid var(--border-subtle);
  }

  .surface-2 {
    background: var(--surface);
    box-shadow: var(--e2);
    border: 1px solid var(--border-subtle);
    border-radius: 14px;
  }

  .surface-3 {
    background: var(--card);
    box-shadow: var(--e3);
    border: 1px solid var(--border-bright);
    border-radius: 16px;
  }

  /* Sunken wells (Kanban columns, code panes, input groups) */
  .surface-well {
    background: color-mix(in srgb, var(--background) 82%, black 18%);
    box-shadow: var(--channel), var(--channel-lip);
    border-radius: 14px;
  }

  [data-mode="light"] .surface-well {
    background: color-mix(in srgb, var(--background) 94%, black 6%);
  }

  /* Frosted glass: header, popovers, floating toolbars only */
  .glass {
    background: color-mix(in srgb, var(--background) 78%, transparent);
    backdrop-filter: blur(14px) saturate(140%);
    -webkit-backdrop-filter: blur(14px) saturate(140%);
    border: 1px solid color-mix(in srgb, var(--border-subtle) 80%, rgb(255 255 255 / .1));
    box-shadow: var(--e4), var(--rim-bottom);
  }

  /* Pillar 4: Gradient rim borders (the Linear "catch-light" edge) */
  .rim-gradient {
    position: relative;
    isolation: isolate;
  }
  .rim-gradient::before {
    content: "";
    position: absolute;
    inset: 0;
    border-radius: inherit;
    padding: 1px;
    background: linear-gradient(145deg,
      rgb(var(--accent-rgb) / .55), transparent 38%,
      transparent 62%, rgb(var(--accent-2-rgb) / .28));
    -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
    -webkit-mask-composite: xor;
    mask-composite: exclude;
    pointer-events: none;
    z-index: 1;
  }

  /* Pillar 5: Cursor-tracking spotlight */
  .spotlight {
    position: relative;
    isolation: isolate;
  }
  .spotlight::before {
    content: "";
    position: absolute;
    inset: 0;
    border-radius: inherit;
    z-index: -1;
    background: radial-gradient(260px circle at var(--mx, 50%) var(--my, 0%),
      rgb(var(--accent-rgb) / .13), transparent 70%);
    opacity: 0;
    transition: opacity var(--dur-base) var(--ease-out);
    pointer-events: none;
  }
  @media (hover: hover) and (pointer: fine) {
    .spotlight:hover::before {
      opacity: 1;
    }
  }

  /* Pillar 8: Ambient lighting & paper-grid page background */
  .app-canvas {
    background-color: var(--background);
    background-image:
      linear-gradient(to right,  rgb(var(--grid-rgb) / var(--grid-alpha)) 1px, transparent 1px),
      linear-gradient(to bottom, rgb(var(--grid-rgb) / var(--grid-alpha)) 1px, transparent 1px),
      radial-gradient(ellipse 60% 50% at 0% 0%,     rgb(var(--accent-rgb) / .10), transparent 70%),
      radial-gradient(ellipse 60% 50% at 100% 100%, rgb(var(--accent-rgb) / .10), transparent 70%);
    background-size: 52px 52px, 52px 52px, auto, auto;
    background-attachment: fixed;
  }
  .app-shell {
    background: var(--surface);
  }

  @media (prefers-contrast: more) {
    .app-canvas {
      background-image: none;
    }
  }

  /* Film grain overlay */
  body::after {
    content: "";
    position: fixed;
    inset: 0;
    z-index: 9999;
    pointer-events: none;
    opacity: .035;
    mix-blend-mode: overlay;
    background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>");
  }
  [data-mode="light"] body::after {
    opacity: .05;
    mix-blend-mode: multiply;
  }

  /* Technical grid for sprint canvas, DSA workbench, editor */
  .workspace-grid {
    background-size: 28px 28px;
    background-image:
      linear-gradient(to right, rgb(var(--accent-rgb) / .05) 1px, transparent 1px),
      linear-gradient(to bottom, rgb(var(--accent-rgb) / .05) 1px, transparent 1px);
    mask-image: radial-gradient(ellipse at 50% 30%, #000 30%, transparent 80%);
  }
}

/* ============================================================
   PILLAR 6 & 7: INTERACTION & COMPONENT PRIMITIVES
   ============================================================ */
@layer components {
  /* Raised, springy button */
  .btn-haptic {
    background: linear-gradient(180deg, rgb(var(--accent-rgb) / .95), rgb(var(--accent-rgb) / .78));
    box-shadow: var(--e1), inset 0 1px 0 rgb(255 255 255 / .28), inset 0 -1px 0 rgb(0 0 0 / .18);
    transition: transform var(--dur-fast) var(--ease-spring), box-shadow var(--dur-base) var(--ease-out), filter var(--dur-fast);
  }
  @media (hover: hover) and (pointer: fine) {
    .btn-haptic:hover {
      transform: translateY(-1.5px);
      filter: brightness(1.06);
      box-shadow: 0 8px 18px -4px rgb(var(--accent-rgb) / .38), inset 0 1px 0 rgb(255 255 255 / .35), inset 0 -1px 0 rgb(0 0 0 / .18);
    }
  }
  .btn-haptic:active {
    transform: translateY(1px) scale(.985);
    box-shadow: var(--channel);
    filter: brightness(.96);
  }

  /* Ghost / secondary button */
  .btn-quiet {
    background: transparent;
    border: 1px solid var(--border-subtle);
    box-shadow: var(--rim-1);
    transition: background var(--dur-base), border-color var(--dur-base), transform var(--dur-fast) var(--ease-spring);
  }
  .btn-quiet:hover {
    background: rgb(var(--accent-rgb) / .08);
    border-color: rgb(var(--accent-rgb) / .45);
  }
  .btn-quiet:active {
    transform: scale(.98);
    box-shadow: var(--channel);
  }

  /* Interactive card */
  .hover-depth {
    box-shadow: var(--e2);
    transition: transform var(--dur-base) var(--ease-out), box-shadow var(--dur-base) var(--ease-out), border-color var(--dur-base);
  }
  @media (hover: hover) and (pointer: fine) {
    .hover-depth:hover {
      transform: translateY(-2px);
      border-color: rgb(var(--accent-rgb) / .35);
      box-shadow: var(--e3), 0 0 24px -8px rgb(var(--accent-rgb) / .35);
    }
  }
  .hover-depth:active {
    transform: translateY(0);
    box-shadow: var(--e1);
  }

  /* Recessed input with glowing focus aura */
  .input-tactile {
    background: color-mix(in srgb, var(--background) 80%, black 20%);
    border: 1px solid var(--border-subtle);
    border-radius: 12px;
    box-shadow: var(--channel), var(--channel-lip);
    transition: border-color var(--dur-base) var(--ease-out), box-shadow var(--dur-base) var(--ease-out);
  }
  .input-tactile:hover {
    border-color: var(--border-bright);
  }
  .input-tactile:focus-visible {
    outline: none;
    border-color: rgb(var(--accent-rgb));
    box-shadow: inset 0 1px 2px rgb(0 0 0 / .2), 0 0 0 3px rgb(var(--accent-rgb) / .22), 0 0 18px -4px rgb(var(--accent-rgb) / .45);
  }
  [data-mode="light"] .input-tactile {
    background: color-mix(in srgb, var(--background) 96%, black 4%);
  }

  /* Pillar 7: Segmented controls, toggles and tabs */
  .seg {
    display: inline-flex;
    padding: 3px;
    gap: 2px;
    border-radius: 12px;
    background: color-mix(in srgb, var(--background) 80%, black 20%);
    box-shadow: var(--channel);
  }
  .seg > [aria-selected="true"],
  .seg > [data-active="true"] {
    background: var(--surface);
    border-radius: 9px;
    box-shadow: var(--e2), inset 0 1px 0 rgb(255 255 255 / .1);
  }
  .seg > * {
    transition: background var(--dur-base) var(--ease-out), box-shadow var(--dur-base) var(--ease-out), color var(--dur-fast);
  }

  .switch {
    width: 40px;
    height: 22px;
    border-radius: 999px;
    box-shadow: var(--channel);
    background: color-mix(in srgb, var(--background) 75%, black 25%);
    transition: background var(--dur-base);
  }
  .switch[aria-checked="true"] {
    background: linear-gradient(90deg, rgb(var(--accent-rgb) / .85), rgb(var(--accent-2-rgb) / .85));
    box-shadow: inset 0 1px 2px rgb(0 0 0 / .25), 0 0 14px -4px rgb(var(--accent-rgb) / .6);
  }
  .switch::after {
    content: "";
    display: block;
    width: 18px;
    height: 18px;
    margin: 2px;
    border-radius: 50%;
    background: #fff;
    box-shadow: 0 1px 3px rgb(0 0 0 / .4);
    transition: transform var(--dur-base) var(--ease-spring);
  }
  .switch[aria-checked="true"]::after {
    transform: translateX(18px);
  }

  /* Pillar 9: Status, difficulty and data visuals */
  .pill-glass {
    --pill-rgb: var(--accent-rgb);
    color: rgb(var(--pill-rgb));
    border: 1px solid rgb(var(--pill-rgb) / .35);
    border-radius: 999px;
    padding: 2px 10px;
    background: linear-gradient(180deg, rgb(var(--pill-rgb) / .18), rgb(var(--pill-rgb) / .08));
    box-shadow: inset 0 1px 0 rgb(255 255 255 / .12), 0 0 14px -6px rgb(var(--pill-rgb) / .7);
  }
  .pill-easy { --pill-rgb: var(--success-rgb); }
  .pill-medium { --pill-rgb: var(--warn-rgb); }
  .pill-hard { --pill-rgb: var(--danger-rgb); }
  [data-mode="light"] .pill-glass {
    background: rgb(var(--pill-rgb) / .12);
    box-shadow: inset 0 1px 0 rgb(255 255 255 / .6);
  }

  /* Live pip */
  .pip-live {
    position: relative;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: rgb(var(--success-rgb));
  }
  .pip-live::after {
    content: "";
    position: absolute;
    inset: 0;
    border-radius: inherit;
    background: inherit;
    animation: pip-ring 2.4s var(--ease-out) infinite;
  }
  @keyframes pip-ring {
    0% { transform: scale(1); opacity: .6; }
    80%, 100% { transform: scale(2.6); opacity: 0; }
  }

  /* Neon progress ring */
  .ring-neon {
    stroke-linecap: round;
    filter: drop-shadow(0 0 4px rgb(var(--accent-rgb) / .55));
    transition: stroke-dashoffset 700ms var(--ease-out);
  }

  /* Mastery heatmap */
  .heat {
    border-radius: 4px;
    background: rgb(var(--accent-rgb) / var(--lvl, .06));
    box-shadow: inset 0 1px 0 rgb(255 255 255 / .06);
    transition: transform var(--dur-fast) var(--ease-spring);
  }
  .heat[data-l="1"] { --lvl: .22; }
  .heat[data-l="2"] { --lvl: .42; }
  .heat[data-l="3"] { --lvl: .65; }
  .heat[data-l="4"] {
    --lvl: .9;
    box-shadow: inset 0 1px 0 rgb(255 255 255 / .3), 0 0 8px -2px rgb(var(--accent-rgb) / .7);
  }
  .heat:hover {
    transform: scale(1.25);
    z-index: 1;
  }

  /* Streak flame backlight */
  .streak-aura {
    position: relative;
    isolation: isolate;
  }
  .streak-aura::before {
    content: "";
    position: absolute;
    inset: -30%;
    z-index: -1;
    border-radius: 50%;
    background: radial-gradient(circle, rgb(251 146 60 / .35), rgb(251 146 60 / .08) 45%, transparent 70%);
    animation: aura-breathe 3.2s ease-in-out infinite;
  }
  @keyframes aura-breathe {
    0%, 100% { opacity: .65; transform: scale(.95); }
    50% { opacity: 1; transform: scale(1.08); }
  }

  /* Pillar 10: Content-specific surfaces */
  .code-frame {
    border-radius: 14px;
    overflow: hidden;
    background: color-mix(in srgb, var(--background) 70%, black 30%);
    box-shadow: var(--e2), inset 0 0 0 1px rgb(255 255 255 / .04);
  }
  .code-frame__bar {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    background: linear-gradient(180deg, rgb(255 255 255 / .05), transparent);
    border-bottom: 1px solid var(--border-subtle);
  }
  .code-frame__dots i {
    display: inline-block;
    width: 10px;
    height: 10px;
    border-radius: 50%;
    margin-right: 6px;
    box-shadow: inset 0 1px 0 rgb(255 255 255 / .35);
  }
  .code-frame__dots i:nth-child(1) { background: #ff5f57; }
  .code-frame__dots i:nth-child(2) { background: #febc2e; }
  .code-frame__dots i:nth-child(3) { background: #28c840; }
  .code-frame pre {
    padding: 14px 16px;
    background-image: linear-gradient(to right, rgb(255 255 255 / .03) 1px, transparent 1px);
    background-size: 2ch 100%;
    background-position: 14px 0;
  }

  .callout {
    border-radius: 12px;
    padding: 12px 14px;
    border-left: 3px solid rgb(var(--accent-rgb));
    background: linear-gradient(90deg, rgb(var(--accent-rgb) / .09), rgb(var(--accent-rgb) / .02));
    box-shadow: var(--rim-1);
  }

  .table-depth thead th {
    position: sticky;
    top: 0;
    background: color-mix(in srgb, var(--surface) 92%, transparent);
    backdrop-filter: blur(8px);
    box-shadow: 0 1px 0 var(--border-subtle);
  }
  .table-depth tbody tr {
    transition: background var(--dur-fast);
  }
  .table-depth tbody tr:hover {
    background: rgb(var(--accent-rgb) / .06);
    box-shadow: inset 2px 0 0 rgb(var(--accent-rgb) / .8);
  }

  .keycap {
    display: inline-flex;
    align-items: center;
    padding: 1px 6px;
    font: 600 10px/1.4 var(--font-mono, ui-monospace, monospace);
    border-radius: 6px;
    border: 1px solid var(--border-bright);
    border-bottom-width: 2px;
    background: color-mix(in srgb, var(--surface) 88%, white 12%);
    box-shadow: 0 1px 2px rgb(0 0 0 / .2), inset 0 1px 0 rgb(255 255 255 / .1);
  }

  .note-light {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: radial-gradient(circle at 35% 30%, rgb(255 255 255 / .75), rgb(var(--light-rgb, var(--accent-rgb))) 55%);
    box-shadow: 0 0 0 2px color-mix(in srgb, var(--surface) 70%, white 30%), 0 0 10px rgb(var(--light-rgb, var(--accent-rgb)) / .6);
  }

  /* Pillar 11: Navigation and modal motion */
  .glass-header {
    background: var(--surface);
    border-bottom: 1px solid var(--border-subtle);
    position: relative;
  }
  .glass-header::after {
    content: "";
    position: absolute;
    left: 0;
    right: 0;
    bottom: -1px;
    height: 1px;
    background: linear-gradient(90deg, transparent, rgb(var(--accent-rgb) / .5), rgb(var(--accent-2-rgb) / .5), transparent);
    opacity: .7;
  }

  .modal-backdrop {
    background: rgb(0 0 0 / .7);
    animation: fade-in var(--dur-base) var(--ease-out);
  }
  .modal-panel,
  [role="dialog"] {
    background: var(--surface);
    box-shadow: var(--e5);
    animation: modal-in var(--dur-slow) var(--ease-out);
  }
  @keyframes fade-in { from { opacity: 0; } }
  @keyframes modal-in { from { opacity: 0; transform: translateY(8px) scale(.98); } }

  .skeleton { position: relative; overflow: hidden; border-radius: 8px; background: var(--skel-base); }
  .skeleton::after {
    content: ""; position: absolute; inset: 0; transform: translateX(-100%);
    background: linear-gradient(90deg, transparent, var(--skel-shine), transparent);
    animation: shimmer 1.6s ease-in-out infinite;
  }
  @keyframes shimmer { to { transform: translateX(100%); } }
  @media (prefers-reduced-motion: reduce) { .skeleton::after { animation: none; } }

  .skeleton-crossfade {
    transition: opacity 200ms cubic-bezier(.16, 1, .3, 1);
  }
  @media (prefers-reduced-motion: reduce) {
    .skeleton-crossfade {
      transition: none;
    }
  }

  @property --angle {
    syntax: "<angle>";
    inherits: false;
    initial-value: 0deg;
  }
  .card-active {
    border: 1px solid transparent;
    background:
      linear-gradient(var(--surface), var(--surface)) padding-box,
      conic-gradient(from var(--angle), rgb(var(--accent-rgb)), rgb(var(--accent-2-rgb)), transparent 40%, rgb(var(--accent-rgb))) border-box;
    animation: spin-angle 6s linear infinite;
  }
  @keyframes spin-angle { to { --angle: 360deg; } }
}

/* ============================================================
   UNIVERSAL THEME BRIDGING FOR LEGACY MARKUP
   ============================================================ */
[data-theme] body,
[data-theme] [class*="bg-[#0b0f17]" i],
[data-theme] [class*="bg-[#0f131c]" i],
[data-theme] [class*="bg-[#0d121b]" i],
[data-theme] [class*="bg-[#0e131e]" i],
[data-theme] [class*="bg-[#090d14]" i],
[data-theme] [class*="bg-[#070b14]" i] {
  background-color: var(--background);
  color: var(--foreground);
}

main,
[data-theme] main {
  background-color: transparent !important;
}

[data-theme] [class*="bg-[#10141e]" i] {
  background-color: var(--surface);
  box-shadow: var(--e1);
}

[data-theme] [class*="bg-[#141923]" i],
[data-theme] [class*="bg-[#181f2e]" i],
[data-theme] [class*="bg-[#1a2232]" i],
[data-theme] [class*="bg-[#0e1422]" i] {
  background-color: var(--card);
  box-shadow: var(--e2);
}

[data-theme] [class*="bg-[#181c24]" i],
[data-theme] [class*="bg-[#1e293b]" i],
[data-theme] [class*="bg-[#161b26]" i] {
  background-color: var(--card-hover);
}

[data-theme] [class*="border-[#1e293b]" i],
[data-theme] [class*="border-[#334155]" i],
[data-theme] [class*="border-[#2e3c51]" i],
[data-theme] [class*="border-[#161b26]" i],
[data-theme] [class*="border-[#10141e]" i],
[data-theme] [class*="border-slate-800" i] {
  border-color: var(--border-subtle);
}

[data-theme] .border-white\\/\\[0\\.04\\],
[data-theme] .border-white\\/\\[0\\.06\\],
[data-theme] .border-white\\/\\[0\\.08\\],
[data-theme] .border-white\\/\\[0\\.1\\],
[data-theme] .border-white\\/5,
[data-theme] .border-white\\/10 {
  border-color: var(--border-subtle);
}

/* Translucent surfaces */
[data-theme] .bg-zinc-900\\/30,
[data-theme] .bg-zinc-900\\/40,
[data-theme] .bg-zinc-900\\/70,
[data-theme] .bg-zinc-900,
[data-theme] .bg-zinc-950,
[data-theme] .bg-zinc-950\\/95 {
  background-color: var(--surface);
}

[data-theme] .bg-white\\/\\[0\\.01\\],
[data-theme] .bg-white\\/\\[0\\.02\\],
[data-theme] .bg-white\\/\\[0\\.03\\],
[data-theme] .bg-white\\/\\[0\\.04\\],
[data-theme] .bg-white\\/\\[0\\.06\\],
[data-theme] .bg-white\\/\\[0\\.08\\],
[data-theme] .bg-white\\/5,
[data-theme] .bg-white\\/10 {
  background-color: var(--card);
}

/* Dynamic Accent Colors */
[data-theme] .text-cyan-400,
[data-theme] .text-cyan-300 {
  color: var(--cyan-accent);
}

[data-theme] .text-emerald-400,
[data-theme] .text-emerald-300 {
  color: var(--emerald-accent);
}

[data-theme] .bg-cyan-500,
[data-theme] .bg-cyan-400 {
  background-color: var(--cyan-accent);
  color: var(--background);
}

[data-theme] .bg-cyan-500\\/10,
[data-theme] .bg-cyan-500\\/15,
[data-theme] .bg-cyan-500\\/20 {
  background-color: rgb(var(--accent-rgb) / .15);
  color: var(--cyan-accent);
}

[data-theme] .bg-emerald-500\\/10,
[data-theme] .bg-emerald-500\\/15,
[data-theme] .bg-emerald-500\\/20 {
  background-color: rgb(var(--accent-2-rgb) / .15);
  color: var(--emerald-accent);
}

/* ============================================================
   LIGHT THEMES TYPOGRAPHY & INVERSION RULES
   ============================================================ */
[data-mode="light"] {
  header,
  [class*="from-[#" i],
  [class*="via-[#" i],
  [class*="to-[#" i] {
    background-image: none;
  }

  .text-white,
  [class*="text-[#f1f5f9]" i],
  .text-zinc-100,
  .text-zinc-200,
  .text-slate-100,
  .text-slate-200 {
    color: var(--foreground);
  }

  .text-zinc-300,
  .text-zinc-400,
  .text-slate-300,
  .text-slate-400 {
    color: #475569;
  }

  .text-zinc-500,
  .text-zinc-600,
  .text-slate-500,
  .text-slate-600 {
    color: #64748B;
  }

  h1, h2, h3, h4, h5, strong {
    color: var(--foreground);
  }

  input, textarea, select {
    background-color: #FFFFFF;
    color: var(--foreground);
    border-color: var(--border-subtle);
  }

  input::placeholder, textarea::placeholder {
    color: #94A3B8;
  }

  [class*="bg-[#10141e]" i],
  [class*="bg-[#141923]" i] {
    box-shadow: var(--e1);
  }

  [class*="bg-[#1e293b]" i].text-cyan-300,
  button[class*="bg-[#1e293b]" i]:not([class*="text-zinc"]):not(.editor-section-trigger) {
    background-color: var(--cyan-accent);
    color: #FFFFFF;
  }
}

/* ============================================================
   THEME-SPECIFIC AUTH CARD SURFACES
   ============================================================ */
`;

for (const t of THEMES_DATA) {
  css += `
[data-theme="${t.id}"] .auth-glass-card {
  background-color: ${t.authCardBg};
  border-color: ${t.authCardBorder};
  box-shadow: var(--e4);
}
`;
}

css += `
/* ============================================================
   PROTECTED NOTE LIGHTS & HIGHLIGHTS
   ============================================================ */
mark.note-mark,
mark[class*="note-mark-"] {
  border-style: solid;
  border-width: 1px;
  display: inline-block;
}

mark.note-mark-red,
mark[class*="bg-rose-500"],
mark[class*="text-rose-200"],
mark[class*="text-rose-300"] {
  background-color: rgba(244, 63, 94, 0.24);
  color: #fecdd3;
  border-color: rgba(244, 63, 94, 0.45);
}

mark.note-mark-green,
mark[class*="bg-emerald-500"],
mark[class*="text-emerald-200"],
mark[class*="text-emerald-300"] {
  background-color: rgba(16, 185, 129, 0.24);
  color: #a7f3d0;
  border-color: rgba(16, 185, 129, 0.45);
}

mark.note-mark-blue,
mark[class*="bg-sky-500"],
mark[class*="bg-cyan-500/20"],
mark[class*="text-sky-200"],
mark[class*="text-cyan-300"] {
  background-color: rgba(14, 165, 233, 0.24);
  color: #bae6fd;
  border-color: rgba(14, 165, 233, 0.45);
}

mark.note-mark-yellow,
mark[class*="bg-amber-500"],
mark[class*="text-amber-200"],
mark[class*="text-amber-300"] {
  background-color: rgba(245, 158, 11, 0.24);
  color: #fde68a;
  border-color: rgba(245, 158, 11, 0.45);
}

mark.note-mark-purple,
mark[class*="bg-purple-500"],
mark[class*="text-purple-200"],
mark[class*="text-purple-300"] {
  background-color: rgba(168, 85, 247, 0.24);
  color: #e9d5ff;
  border-color: rgba(168, 85, 247, 0.45);
}

[data-mode="light"] mark.note-mark-red,
[data-mode="light"] mark[class*="bg-rose-500"] {
  background-color: rgba(225, 29, 72, 0.16);
  color: #9f1239;
  border-color: rgba(225, 29, 72, 0.45);
}

[data-mode="light"] mark.note-mark-green,
[data-mode="light"] mark[class*="bg-emerald-500"] {
  background-color: rgba(16, 185, 129, 0.16);
  color: #065f46;
  border-color: rgba(16, 185, 129, 0.45);
}

[data-mode="light"] mark.note-mark-blue,
[data-mode="light"] mark[class*="bg-sky-500"] {
  background-color: rgba(14, 165, 233, 0.16);
  color: #075985;
  border-color: rgba(14, 165, 233, 0.45);
}

[data-mode="light"] mark.note-mark-yellow,
[data-mode="light"] mark[class*="bg-amber-500"] {
  background-color: rgba(245, 158, 11, 0.18);
  color: #92400e;
  border-color: rgba(245, 158, 11, 0.45);
}

[data-mode="light"] mark.note-mark-purple,
[data-mode="light"] mark[class*="bg-purple-500"] {
  background-color: rgba(168, 85, 247, 0.16);
  color: #6b21a8;
  border-color: rgba(168, 85, 247, 0.45);
}

/* Toolbar light indicator dots */
.note-light-mint { background-color: #10b981; box-shadow: 0 0 8px rgba(16, 185, 129, 0.6); }
.note-light-rose { background-color: #f43f5e; box-shadow: 0 0 8px rgba(244, 63, 94, 0.6); }
.note-light-cyan { background-color: #06b6d4; box-shadow: 0 0 8px rgba(6, 182, 212, 0.6); }
.note-light-amber { background-color: #f59e0b; box-shadow: 0 0 8px rgba(245, 158, 11, 0.6); }
.note-light-purple { background-color: #a855f7; box-shadow: 0 0 8px rgba(168, 85, 247, 0.6); }
.note-light-yellow { background-color: #eab308; box-shadow: 0 0 8px rgba(234, 179, 8, 0.6); }

/* ============================================================
   PILLAR 12: ACCESSIBILITY, COMFORT AND PERFORMANCE GUARDRAILS
   ============================================================ */
@layer a11y {
  :where(a, button, [role="button"], input, select, textarea, summary, [tabindex]):focus-visible {
    outline: 2px solid rgb(var(--accent-rgb));
    outline-offset: 2px;
  }
  ::selection {
    background: rgb(var(--accent-rgb) / .3);
  }
  * {
    scrollbar-width: thin;
    scrollbar-color: color-mix(in srgb, var(--border-bright) 80%, transparent) transparent;
  }
  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after {
      animation-duration: .01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: .01ms !important;
      scroll-behavior: auto !important;
    }
    .hover-depth:hover, .btn-haptic:hover {
      transform: none !important;
    }
  }
  @media (prefers-reduced-transparency: reduce) {
    .glass, .modal-backdrop, .table-depth thead th {
      backdrop-filter: none !important;
      -webkit-backdrop-filter: none !important;
      background: var(--surface) !important;
    }
  }
  @media (prefers-contrast: more) {
    :root {
      --rim-1: none;
      --rim-2: none;
      --rim-3: none;
    }
    .surface-1, .surface-2, .surface-3, .input-tactile {
      border-color: var(--border-bright) !important;
    }
    body::after {
      display: none !important;
    }
  }
  @media (forced-colors: active) {
    .glass, .surface-2, .surface-3, .input-tactile {
      border: 1px solid CanvasText !important;
      box-shadow: none !important;
    }
    .btn-haptic {
      forced-color-adjust: none;
      border: 1px solid ButtonText !important;
    }
  }
}
`;

fs.writeFileSync(path.resolve('app/globals.css'), css, 'utf-8');
console.log('Successfully generated app/globals.css with extended 12-pillar depth specification.');

import fs from 'fs';
import path from 'path';

const cssPath = path.resolve('app/globals.css');
const css = fs.readFileSync(cssPath, 'utf8');

// Match all [data-theme="..."] blocks
const themeBlockRegex = /\[data-theme="([^"]+)"\]\s*\{([^}]+)\}/g;
let match;
const themesFound = [];
const missingTokens = [];

while ((match = themeBlockRegex.exec(css)) !== null) {
  const themeId = match[1];
  const blockBody = match[2];
  themesFound.push(themeId);

  const hasAccentRgb = /--accent-rgb:\s*[^;]+;/.test(blockBody);
  const hasGridRgb = /--grid-rgb:\s*[^;]+;/.test(blockBody);

  if (!hasAccentRgb || !hasGridRgb) {
    missingTokens.push({
      themeId,
      missingAccentRgb: !hasAccentRgb,
      missingGridRgb: !hasGridRgb,
    });
  }
}

// Check :root fallback tokens
const rootMatch = /:root\s*\{([^}]+)\}/.exec(css);
const rootHasAccent = rootMatch && /--accent-rgb:\s*[^;]+;/.test(rootMatch[1]);
const rootHasGrid = rootMatch && /--grid-rgb:\s*[^;]+;/.test(rootMatch[1]);
const rootHasGridAlpha = rootMatch && /--grid-alpha:\s*[^;]+;/.test(rootMatch[1]);
const rootHasSkelBase = rootMatch && /--skel-base:\s*[^;]+;/.test(rootMatch[1]);
const rootHasSkelShine = rootMatch && /--skel-shine:\s*[^;]+;/.test(rootMatch[1]);

console.log(`Audited ${themesFound.length} themes in app/globals.css.`);

if (!rootHasAccent || !rootHasGrid || !rootHasGridAlpha || !rootHasSkelBase || !rootHasSkelShine) {
  console.error("FATAL: :root is missing required grid or skeleton tokens:", {
    rootHasAccent,
    rootHasGrid,
    rootHasGridAlpha,
    rootHasSkelBase,
    rootHasSkelShine,
  });
  process.exit(1);
}

if (themesFound.length === 0) {
  console.error("FATAL: No theme blocks found in app/globals.css!");
  process.exit(1);
}

if (missingTokens.length > 0) {
  console.error("FATAL: The following themes are missing required tokens:", JSON.stringify(missingTokens, null, 2));
  process.exit(1);
}

console.log("PASS: All themes and root contain required --accent-rgb, --grid-rgb, --grid-alpha, and skeleton tokens.");
process.exit(0);

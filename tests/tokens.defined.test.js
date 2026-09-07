import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Every CSS custom property a component names must actually be defined.
 *
 * This exists because of a real bug: the workspace switcher's dropdown asked
 * for `--ui-surface-raised`, which had never been defined. CSS resolves an
 * undefined variable to nothing and carries on — no error, no warning, no
 * failing test — so the panel rendered with NO background and the sidebar
 * showed straight through it. The build was green and the suite passed.
 *
 * jsdom does not resolve custom properties either, so no amount of rendering
 * would have caught it. Reading the source is the only cheap way.
 */

// process.cwd(), not import.meta.url: under Vite the test module's URL carries
// an /@fs prefix that is not a real filesystem path.
const ROOT = process.cwd();
const SRC = join(ROOT, 'src');

const SHEETS = [
  join(SRC, 'ui/tokens/tokens.css'),
  join(SRC, 'index.css'),
  // Marketing is a deliberately separate visual register with its own scale.
  join(SRC, 'marketing/marketing.css'),
];

function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (/\.(jsx?|css)$/.test(entry)) out.push(full);
  }
  return out;
}

/** Names on the left of a `:` in a stylesheet — the ones that exist. */
function definedNames() {
  const names = new Set();
  for (const sheet of SHEETS) {
    const css = readFileSync(sheet, 'utf8');
    for (const m of css.matchAll(/(--[a-zA-Z0-9-]+)\s*:/g)) names.add(m[1]);
  }
  return names;
}

/** Names inside `var(...)` — the ones something asks for. */
function usedNames(files) {
  const uses = new Map();
  for (const file of files) {
    const text = readFileSync(file, 'utf8');
    for (const m of text.matchAll(/var\(\s*(--[a-zA-Z0-9-]+)/g)) {
      if (!uses.has(m[1])) uses.set(m[1], file.replace(`${ROOT}/`, ''));
    }
  }
  return uses;
}

describe('design tokens', () => {
  it('defines every custom property the app references', () => {
    const defined = definedNames();
    const used = usedNames(walk(SRC));

    const missing = [...used.entries()]
      // Tailwind arbitrary values and a few runtime-set properties are declared
      // where they are used rather than in a sheet; only the token layers are
      // in scope here.
      .filter(([name]) => name.startsWith('--ui-') || name.startsWith('--surface-') || name.startsWith('--text-'))
      // `var(--ui-av-${slot}-bg)` is built at runtime; the literal prefix the
      // regex sees is not a token anyone declared.
      .filter(([name]) => !name.endsWith('-'))
      .filter(([name]) => !defined.has(name))
      .map(([name, file]) => `${name}  (first used in ${file})`);

    expect(missing, `Undefined design tokens:\n  ${missing.join('\n  ')}`).toEqual([]);
  });
});

/** @type {import('tailwindcss').Config} */

/*
 * This file used to carry a THIRD design system.
 *
 * It defined a full radius scale (10/14/18/24/32), a shadow scale, a spacing
 * scale and a ten-step type scale — none of which anything in the app ever
 * used, while src/index.css and src/core/tokens/tokens.css each defined their own
 * competing versions of the same three things. Three scales for one concept is
 * how you end up with twenty-two different border radii on screen.
 *
 * There is one source of truth now: src/core/tokens/tokens.css. Anything visual
 * is a --ui-* custom property read through Tailwind's bracket syntax, e.g.
 * rounded-[var(--ui-radius-sm)].
 *
 * What is left here is only what genuinely belongs to Tailwind's own config:
 * the content globs and the font stacks. Colours, radii, shadows and spacing
 * are deliberately NOT extended — if you find yourself wanting to add one,
 * add a token instead.
 */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      /*
       * Read through the tokens rather than restating the stacks.
       *
       * This file used to hold its own copy of the font lists, which is
       * how you end up with `font-sans` and `var(--ui-font-sans)`
       * resolving to two different faces after one of them is edited.
       * There is one source of truth: src/core/tokens/tokens.css.
       */
      fontFamily: {
        sans: 'var(--ui-font-sans)',
        mono: 'var(--ui-font-mono)',
      },
    },
  },
  plugins: [],
};

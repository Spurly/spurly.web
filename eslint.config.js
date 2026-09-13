import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'

/**
 * `eslint-plugin-react` was imported here but never installed, so `npm run lint`
 * has been crashing on startup rather than reporting anything. Dropping it makes
 * lint actually run: its peer range doesn't cover ESLint 10, and the rules that
 * catch real bugs (exhaustive-deps, rules-of-hooks) live in react-hooks anyway.
 * The jsx-runtime rules it also provided are redundant under the new transform.
 */
export default [
  { ignores: ['dist', 'node_modules'] },
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      globals: {
        ...globals.browser,
        ...globals.node,
        // The web app talks to the Spurly Chrome extension. Every call site
        // guards with `typeof chrome === "undefined"` first — the extension is
        // optional and other browsers don't define it — so this is a missing
        // declaration, not unguarded access.
        chrome: 'readonly',
      },
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {

      ...js.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,

      // ---- overrides; must come AFTER the spreads above, which reset severity ----
      // Deliberate swallows (localStorage in private mode, cross-origin
      // postMessage). Each one carries a comment saying why.
      'no-empty': ['error', { allowEmptyCatch: true }],

      /*
       * DOWNGRADED TO WARN, DELIBERATELY — 27 occurrences as of 2026-09-05.
       *
       * This is a real signal, not noise: every data-fetching hook calls
       * setLoading(true) synchronously as its effect fires, which triggers a
       * second render immediately. The fix is usually to seed useState(true)
       * instead of setting it in the effect — mechanical, but 27 sites each
       * driving loading UI, so it needs reading one at a time rather than a
       * bulk edit.
       *
       * It is a warning so `npm run lint` can gate CI at zero ERRORS today
       * while these stay visible in the output. Fix them opportunistically;
       * when the count reaches zero, put this back to 'error'.
       */
      'react-hooks/set-state-in-effect': 'warn',
      'no-unused-vars': ['warn', { varsIgnorePattern: '^[A-Z_]', argsIgnorePattern: '^_' }],
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
    },
  },

  /**
   * DESIGN SYSTEM GUARDS.
   *
   * The app drifted into seventeen font sizes, twenty-two border radii, three
   * font weights and a fourth colour palette because nothing stopped a call
   * site from inventing a value. Every rule below is scoped to application
   * code — src/ui/ is where new values are allowed to be defined, and
   * src/marketing/ is a deliberately different visual register.
   *
   * These are warnings, not errors, so an in-progress branch still builds.
   * They exist to make the drift visible in review.
   */
  {
    files: ['src/**/*.{js,jsx}'],
    ignores: ['src/ui/**', 'src/marketing/**', 'src/_trash/**'],
    rules: {
      /*
       * All guards live in ONE `no-restricted-syntax` entry on purpose. Flat
       * config does not merge the options of the same rule across blocks — a
       * later block replaces the earlier one wholesale — so splitting these
       * into two entries silently switched the token guards off for exactly
       * the files that need them most.
       */
      'no-restricted-syntax': [
        'warn',
        {
          selector: 'JSXOpeningElement[name.name="button"]',
          message:
            'Use <Button> or <IconButton> from src/ui/primitives instead of a raw <button>. ' +
            'Button owns height, radius, hover, disabled and the focus ring; a hand-rolled ' +
            'one opts out of all five.',
        },
        {
          /*
           * The UNION of the v1 and v2 scales, on purpose.
           *
           * v2 is 28 / 16 / 14 / 12.5 / 11.5 / 10.5. The v1 sizes
           * (24 / 17 / 13 / 12 / 11 / 10) are still on screen in every
           * page that has not been swept yet, and `npm run lint` runs
           * with --max-warnings 147 -- tightening this rule before the
           * sweep would turn several hundred untouched call sites into
           * warnings and fail the gate on work nobody has done yet.
           *
           * Narrow this to the v2 sizes alone in the lock-it phase,
           * once the sweep is finished. That is the moment this rule
           * starts enforcing the scale instead of merely bounding it.
           */
          selector:
            'Literal[value=/text-\\[(?!(28|24|17|16|14|13|12\\.5|12|11\\.5|11|10\\.5|10)px)[0-9.]+px\\]/]',
          message:
            'Font size off the scale. Use 28/16/14/12.5/11.5/10.5px (see --ui-t-* in src/ui/tokens/tokens.css).',
        },
        {
          selector: 'Literal[value=/rounded-\\[[0-9]+px\\]/]',
          message:
            'Hard-coded radius. Use rounded-[var(--ui-radius-xs|sm|md|lg)].',
        },
        {
          /*
           * v2 has THREE weights: 400 body, 500 medium, 600 strong.
           *
           * font-semibold was banned under v1, which ran two weights and
           * leaned on size and colour alone. That produced page titles
           * with no more presence than the section headings beneath them.
           * 600 is now the display/section weight -- see --ui-w-strong.
           *
           * Everything heavier, and everything lighter than the body, is
           * still out: 700 in app chrome shouts, and 300 fails to hold
           * up at 12px on a dark ground.
           */
          selector: 'Literal[value=/font-(bold|extrabold|black|light|thin|extralight)/]',
          message:
            'Three weights only: font-normal / font-medium / font-semibold (--ui-w-*).',
        },
        {
          selector:
            'Literal[value=/(bg|text|border|ring|divide)-(gray|slate|zinc|neutral|red|green|blue|yellow|amber|emerald|indigo|purple|orange|rose|sky|teal)-[0-9]{2,3}/]',
          message:
            'Raw Tailwind palette. Use a --ui-* token so light and dark mode both work.',
        },
        {
          /*
           * Matches the glass utility classes and raw backdrop-blur, but not a
           * prop value that happens to be the word "glass" (MetricCard still
           * accepts variant="glass" for compatibility — it now renders solid).
           */
          selector:
            'Literal[value=/(glass-(thin|thick|chrome|dark|sheen|regular)|backdrop-filter|backdrop-blur)/]',
          message:
            'Glass materials belong to src/marketing. The app is flat surfaces and hairlines.',
        },
      ],
    },
  },
]

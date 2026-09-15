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
   * code — the design-system corner of src/core/ (primitives, tokens, theme,
   * icons, and the ui-flavoured layout atoms) is where new values are allowed
   * to be defined, and src/marketing/ is a deliberately different visual
   * register. The rest of src/core/ (auth, billing, admin, DataTable, ...)
   * still has to consume tokens like every product does.
   *
   * These are warnings, not errors, so an in-progress branch still builds.
   * They exist to make the drift visible in review.
   */
  {
    files: ['src/**/*.{js,jsx}'],
    ignores: [
      'src/core/primitives/**',
      'src/core/tokens/**',
      'src/core/theme/**',
      'src/core/icons/**',
      'src/core/layout/Card/**',
      'src/core/layout/Toolbar/**',
      'src/marketing/**',
      'src/_trash/**',
    ],
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
            'Use <Button> or <IconButton> from src/core/primitives instead of a raw <button>. ' +
            'Button owns height, radius, hover, disabled and the focus ring; a hand-rolled ' +
            'one opts out of all five.',
        },
        {
          /*
           * No pixel font size at all. Not "off the scale" -- any of them.
           *
           * This used to allow the union of the v1 and v2 scales while ~535
           * call sites were still on v1 literals. They are all on tokens now,
           * so the rule can say the thing it always meant: a size is a
           * decision the design system makes, and a component repeating the
           * number is a copy that goes stale the day the scale moves.
           *
           * text-[var(--ui-t-body)] passes. text-[14px] does not, even though
           * today they are the same 14 pixels -- that is the point.
           */
          selector: 'Literal[value=/text-\\[[0-9.]+px\\]/]',
          message:
            'Use a type token: text-[var(--ui-t-display|metric|section|nav|body|label|meta|micro)].',
        },
        {
          /*
           * No raw hex in a component, in any form -- className, inline style
           * or a colour constant. Every one of them is a surface or a text
           * colour that cannot move when the theme does, which is exactly the
           * pairing that rendered /admin white-on-white the day dark mode
           * shipped.
           *
           * #fff sitting ON a coloured fill is the one honest exception and it
           * has a token: --ui-accent-on.
           */
          selector: "Literal[value=/#[0-9a-fA-F]{3}(?:[0-9a-fA-F]{3})?\\b/]",
          message:
            'Hard-coded colour. Use a --ui-* token so light and dark both work.',
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
  {
    /*
     * Brand marks are exempt from the no-hard-coded-colour rule.
     *
     * A Google "G" is Google's four colours and a LinkedIn glyph is
     * LinkedIn's blue. Those hexes are not theme decisions that failed to
     * become tokens -- they are third-party data, fixed by someone else, and
     * tokenising them would be wrong rather than merely unnecessary.
     *
     * Last in the array on purpose: flat config is last-wins, so an override
     * placed before the block it overrides is silently re-enabled by it.
     */
    files: ['src/core/icons/**', 'src/core/pages/auth/components/icons.jsx'],
    rules: { 'no-restricted-syntax': 'off' },
  },
]


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
      globals: { ...globals.browser, ...globals.node },
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
          // Six steps: 24 / 17 / 14 / 13 / 12 / 11 / 10.
          selector:
            'Literal[value=/text-\\[(?!(24|17|14|13|12|11|10)px)[0-9.]+px\\]/]',
          message:
            'Font size off the scale. Use 24/17/14/13/12/11/10px (see --ui-t-* in src/ui/tokens/tokens.css).',
        },
        {
          selector: 'Literal[value=/rounded-\\[[0-9]+px\\]/]',
          message:
            'Hard-coded radius. Use rounded-[var(--ui-radius-xs|sm|md|lg)].',
        },
        {
          selector: 'Literal[value=/font-(semibold|bold|extrabold|light|thin)/]',
          message:
            'The app has one emphasis weight: font-medium. Size and colour carry hierarchy.',
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

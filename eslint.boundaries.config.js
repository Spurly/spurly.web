import boundaries from 'eslint-plugin-boundaries';
import reactHooks from 'eslint-plugin-react-hooks';

/**
 * Architecture enforcement for spurly.web — the frontend half of the rule in
 * spurly.backend/ARCHITECTURE.md.
 *
 *     shared / ui  <-  platform  <-  products
 *
 * Kept in its OWN config, separate from eslint.config.js, on purpose: the
 * general lint currently reports 38 pre-existing code-quality errors
 * (no-empty, no-undef). Mixing the two would mean either blocking CI on an
 * unrelated cleanup, or downgrading the architecture rule to a warning nobody
 * reads. This file is the gate; `npm run lint` stays the quality pass.
 *
 * Run: npm run lint:arch
 */
export default [
  { ignores: ['dist/**', 'node_modules/**', 'src/marketing/**', 'src/dev/**'] },
  {
    files: ['src/**/*.{js,jsx}'],
    // The source carries react-hooks disable comments this config doesn't
    // enable; reporting them as "unused" would be 13 lines of noise in a gate
    // whose only job is the boundary rule.
    linterOptions: { reportUnusedDisableDirectives: 'off' },
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    // react-hooks is registered but its rules stay OFF: the source carries
    // `eslint-disable-next-line react-hooks/exhaustive-deps` comments, and an
    // unknown rule name in a disable directive is itself an error.
    plugins: { boundaries, 'react-hooks': reactHooks },
    settings: {
      'boundaries/include': ['src/**/*.js', 'src/**/*.jsx'],
      // CRITICAL: imports here are written against Vite's `src` alias
      // (`from 'src/platform/...'`), which plain node resolution cannot follow —
      // without this every import looks external and the rule silently matches
      // NOTHING. Treating the repo root as a module directory makes `src/x`
      // resolve to <root>/src/x, the same way Vite resolves it.
      'import/resolver': {
        node: { moduleDirectory: ['node_modules', '.'], extensions: ['.js', '.jsx'] },
      },
      'boundaries/elements': [
        { type: 'app',      pattern: 'src/app' },
        { type: 'shared',   pattern: 'src/shared/*',     capture: ['mod'] },
        { type: 'ui',       pattern: 'src/ui' },
        { type: 'platform', pattern: 'src/platform/*',   capture: ['mod'] },
        { type: 'product',  pattern: 'src/products/*/*', capture: ['product', 'mod'] },
      ],
    },
    rules: {
      'boundaries/dependencies': ['error', {
        default: 'disallow',
        policies: [
          // The composition root wires everything together.
          { from: { element: { type: 'app' } },
            allow: { to: { element: { types: { anyOf: ['app', 'shared', 'ui', 'platform', 'product'] } } } } },

          // A product may use shared, ui, platform, and its OWN product's features.
          { from: { element: { type: 'product' } },
            allow: { to: { element: [
              { types: { anyOf: ['shared', 'ui'] } },
              { type: 'platform' },
              { type: 'product', captured: { product: '{{from.product}}' } },
            ] } } },

          // Platform: shared, ui, and other platform modules. Never a product.
          { from: { element: { type: 'platform' } },
            allow: { to: { element: { types: { anyOf: ['shared', 'ui', 'platform'] } } } } },

          // The design system and shared utilities know nothing about the domain.
          { from: { element: { type: 'ui' } },
            allow: { to: { element: { types: { anyOf: ['ui', 'shared'] } } } } },
          { from: { element: { type: 'shared' } },
            allow: { to: { element: { types: { anyOf: ['shared'] } } } } },
        ],
      }],
    },
  },
];

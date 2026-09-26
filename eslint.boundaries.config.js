import boundaries from 'eslint-plugin-boundaries';
import reactHooks from 'eslint-plugin-react-hooks';

/**
 * Architecture enforcement for spurly.web — the frontend half of the rule in
 * spurly.backend/ARCHITECTURE.md.
 *
 *     shared  <-  core  <-  products
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
  { ignores: ['dist/**', 'node_modules/**', 'src/dev/**'] },
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
      // (`from 'src/core/...'`), which plain node resolution cannot follow —
      // without this every import looks external and the rule silently matches
      // NOTHING. Treating the repo root as a module directory makes `src/x`
      // resolve to <root>/src/x, the same way Vite resolves it.
      'import/resolver': {
        node: { moduleDirectory: ['node_modules', '.'], extensions: ['.js', '.jsx'] },
      },
      'boundaries/elements': [
        { type: 'app',      pattern: 'src/app' },
        { type: 'shared',   pattern: 'src/shared/*',   capture: ['mod'] },
        { type: 'core',     pattern: 'src/core/*',     capture: ['mod'] },
        { type: 'product',  pattern: 'src/products/*', capture: ['mod'] },
      ],
    },
    rules: {
      'boundaries/dependencies': ['error', {
        default: 'disallow',
        policies: [
          // The composition root wires everything together.
          { from: { element: { type: 'app' } },
            allow: { to: { element: { types: { anyOf: ['app', 'shared', 'core', 'product'] } } } } },

          // A product may use shared, core, and any other product
          // module. There is only one product (Hub) today — its former
          // internal modules (campaigns, leads, sequences, pages, ...) now
          // sit directly under src/products/*, so this stays as permissive
          // as cross-module imports already were before that flattening.
          { from: { element: { type: 'product' } },
            allow: { to: { element: { types: { anyOf: ['shared', 'core', 'product'] } } } } },

          // Core: shared and other core modules only. Never a product — this
          // is the one rule that used to be split between `ui` (zero domain
          // knowledge) and `platform` (domain-aware); merging them into one
          // `core` layer means that distinction is no longer enforced here.
          { from: { element: { type: 'core' } },
            allow: { to: { element: { types: { anyOf: ['shared', 'core'] } } } } },

          { from: { element: { type: 'shared' } },
            allow: { to: { element: { types: { anyOf: ['shared'] } } } } },
        ],
      }],
    },
  },
];

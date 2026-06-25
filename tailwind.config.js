/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        spurly: {
          /* Brand — unchanged */
          purple:       '#7C3AED',
          'purple-700': '#6D28D9',
          'purple-300': '#C4B5FD',
          blue:         '#38BDF8',
          'blue-600':   '#0EA5E9',
          indigo:       '#5B54E6',

          /* Neutrals — updated to Apple cool-gray ramp */
          navy:           '#0c0c0e',  /* deepest ink / sidebar fill when needed */
          'navy-light':   '#1c1c1f',  /* primary text */
          'text-secondary': '#6b6b73',
          'text-tertiary':  '#8a8a93',
          'text-disabled':  '#b4b4bd',
          'surface-bg':   '#f4f5f8',  /* app canvas */
          border:         '#d6d6dc',  /* default border */
          'border-hairline': '#e4e4e9',
          separator:      'rgba(0,0,0,0.07)',

          /* Semantic */
          success: '#2fb457',
          warning: '#F59E0B',
          error:   '#ff453a',
          info:    '#0a84ff',

          /* Gray ramp — for direct use */
          'gray-50':  '#fbfbfd',
          'gray-100': '#f5f5f7',
          'gray-150': '#eeeef1',
          'gray-200': '#e4e4e9',
          'gray-300': '#d6d6dc',
          'gray-400': '#b4b4bd',
          'gray-500': '#8a8a93',
          'gray-600': '#6b6b73',
          'gray-700': '#48484e',
          'gray-800': '#2b2b30',
          'gray-900': '#1c1c1f',
        },
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'system-ui', '"Inter"', '"Helvetica Neue"', 'Helvetica', 'Arial', 'sans-serif'],
        mono: ['"SF Mono"', 'ui-monospace', '"SFMono-Regular"', 'Menlo', 'Consolas', 'monospace'],
      },
      fontSize: {
        'display':    ['56px', { lineHeight: '1.08', letterSpacing: '-0.022em', fontWeight: '700' }],
        'title-1':    ['40px', { lineHeight: '1.08', letterSpacing: '-0.014em', fontWeight: '700' }],
        'title-2':    ['30px', { lineHeight: '1.25', letterSpacing: '-0.014em', fontWeight: '600' }],
        'title-3':    ['22px', { lineHeight: '1.25', letterSpacing: '-0.014em', fontWeight: '600' }],
        'headline':   ['17px', { lineHeight: '1.45', letterSpacing: '-0.006em', fontWeight: '600' }],
        'body-text':  ['15px', { lineHeight: '1.6',  letterSpacing: '-0.006em', fontWeight: '400' }],
        'callout':    ['14px', { lineHeight: '1.45', letterSpacing: '-0.006em' }],
        'ui-label':   ['13px', { lineHeight: '1.25', letterSpacing: '-0.006em', fontWeight: '500' }],
        'footnote':   ['12px', { lineHeight: '1.45', letterSpacing: '-0.006em' }],
        'caption':    ['11px', { lineHeight: '1.45', letterSpacing: '0.04em',   fontWeight: '600' }],

        /* Legacy aliases kept so existing classes don't break */
        'hero':             ['64px', { lineHeight: '1.05', fontWeight: '700' }],
        'section-heading':  ['40px', { lineHeight: '1.08', letterSpacing: '-0.014em', fontWeight: '700' }],
        'dashboard-title':  ['22px', { lineHeight: '1.25', letterSpacing: '-0.014em', fontWeight: '600' }],
        'body':             ['15px', { lineHeight: '1.6',  letterSpacing: '-0.006em' }],
        'label':            ['13px', { lineHeight: '1.25', letterSpacing: '-0.006em', fontWeight: '500' }],
      },
      borderRadius: {
        'spurly':     '14px',   /* buttons, inputs, chips */
        'spurly-sm':  '10px',
        'spurly-lg':  '18px',   /* cards */
        'spurly-xl':  '24px',   /* panels, dialogs */
        'spurly-2xl': '32px',   /* hero glass */
        'spurly-pill':'999px',
      },
      boxShadow: {
        'spurly':       '0 2px 6px rgba(16,18,32,0.06)',
        'spurly-sm':    '0 1px 2px rgba(16,18,32,0.05)',
        'spurly-md':    '0 6px 18px rgba(16,18,32,0.08)',
        'spurly-lg':    '0 16px 40px rgba(16,18,32,0.12)',
        'spurly-xl':    '0 28px 70px rgba(16,18,32,0.18)',
        'spurly-glass': '0 10px 34px rgba(31,34,54,0.14)',
        'spurly-accent':'0 8px 24px rgba(124,58,237,0.30)',
      },
      spacing: {
        'spurly-gutter': '24px',
        'sidebar':       '264px',
        'sidebar-min':   '76px',
        'topbar':        '60px',
      },
      transitionTimingFunction: {
        'out':    'cubic-bezier(0.16, 1, 0.3, 1)',
        'spring': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
    },
  },
  plugins: [],
};

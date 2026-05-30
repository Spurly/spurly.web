/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Spurly Brand Colors
        spurly: {
          // Primary Gradient
          purple: '#7C3AED',
          blue: '#38BDF8',

          // Core Palette
          navy: '#081028',      // Dark surfaces, sidebar
          'navy-light': '#0F172A', // Primary text
          'text-secondary': '#64748B', // Secondary text
          'surface-bg': '#F8FAFC', // Light background
          'border': '#E2E8F0',   // Borders

          // Semantic
          success: '#22C55E',
          warning: '#F59E0B',
          error: '#EF4444',
        }
      },
      fontFamily: {
        // Spurly uses Inter
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        // Typography Hierarchy
        'hero': ['64px', { lineHeight: '1.05', fontWeight: '700' }],
        'section-heading': ['40px', { lineHeight: '1.2', fontWeight: '700' }],
        'dashboard-title': ['32px', { lineHeight: '1.3', fontWeight: '600' }],
        'body': ['16px', { lineHeight: '1.6', fontWeight: '400' }],
        'label': ['13px', { lineHeight: '1.5', fontWeight: '500' }],
      },
      borderRadius: {
        // Spurly UI Radius
        'spurly': '16px',
        'spurly-lg': '20px',
      },
      boxShadow: {
        // Subtle shadows only
        'spurly': '0 1px 3px rgba(0, 0, 0, 0.1)',
        'spurly-md': '0 4px 6px rgba(0, 0, 0, 0.07)',
        'spurly-lg': '0 10px 15px rgba(0, 0, 0, 0.1)',
      },
      spacing: {
        // Operational clarity - breathing room
        'spurly-gutter': '24px',
      },
    },
  },
  plugins: [],
}

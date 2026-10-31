/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          /** Primary accent — buttons, active indicators, primary text */
          primary: '#ffffff',
          /** Main background — screens, root views */
          background: '#000000',
          /** Elevated surface — cards, modals, sheets */
          surface: '#18181b',       // zinc-900
          /** Subtle surface used inside surfaces — inputs, nested cards */
          surfaceAlt: '#27272a',    // zinc-800
          /** Default border for cards, inputs and dividers */
          surfaceBorder: '#27272a', // zinc-800
          /** Muted border — for less prominent separators */
          borderMuted: '#3f3f46',   // zinc-700
          /** Drag handles, inactive controls */
          muted: '#52525b',         // zinc-600
        },
        status: {
          /** Danger / destructive actions */
          danger: '#ef4444',
          dangerLight: '#f87171',
          /** Informational / public indicators */
          info: '#3b82f6',
          infoLight: '#60a5fa',
        },
        content: {
          /** Primary text on dark backgrounds */
          primary: '#ffffff',
          /** Secondary / subtitle text */
          secondary: '#9ca3af',     // gray-400
          /** Tertiary / disabled / placeholder text */
          tertiary: '#6b7280',      // gray-500
          /** Very subdued text — labels, hints */
          muted: '#71717a',         // zinc-500
          /** Disabled pagination / ghost elements */
          disabled: '#52525b',      // zinc-600
        },
      },
    },
  },
  plugins: [],
};

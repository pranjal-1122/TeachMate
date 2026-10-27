/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        foundation: {
          light: '#F5F3ED', // 60% warm off-white canvas
          dark: '#192A25',  // high contrast deep dark green
        },
        surface: {
          light: '#EBE8DF', // warm pale cream cards
          dark: '#25372F',  // raised dark surface
        },
        structure: {
          light: '#203F36', // 30% deep forest green headings/panels
          dark: '#F0EEE5',  // high readability light cream text
        },
        accent: {
          DEFAULT: '#C7664F', // 10% muted warm coral
          hover: '#B55A44',
          dark: '#E28B75',
        },
        slate: {
          reading: '#30483F', // primary body copy
          muted: '#5A7369',   // secondary body copy
          darkMuted: '#C9D2C8',
        },
        line: {
          light: '#C4CBC4', // 1px subtle borders
          dark: '#3A4F46',
        },
        state: {
          success: '#226849', // deep teal-green
          warning: '#795716', // dark ochre
          danger: '#A63F37',  // dark brick
        }
      },
      fontFamily: {
        sans: ['Inter', 'Manrope', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        subtle: '0 2px 8px rgba(32, 63, 54, 0.07)',
        raised: '0 4px 14px rgba(32, 63, 54, 0.11)',
      },
      borderRadius: {
        'card': '12px',
        'modal': '16px',
      }
    },
  },
  plugins: [],
}

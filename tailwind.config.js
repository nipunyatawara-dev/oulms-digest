/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        refero: {
          canvas: "#fbf8f5",
          card: "#f2ebe5",
          "card-hover": "#e8ddd5",
          "card-light": "#fdfaf8",
          "card-white": "#FFFFFF",
          border: "rgba(78, 8, 12, 0.08)",
          "border-strong": "rgba(78, 8, 12, 0.12)",
          dark: "#4e080c",
          muted: "#71717A",
          subtle: "#8E8E93",
          active: "#e8ddd5",
        },
      },
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          '"SF Pro Text"',
          '"SF Pro Display"',
          '"Segoe UI"',
          "Roboto",
          "Helvetica",
          "Arial",
          "sans-serif",
        ],
      },
      letterSpacing: {
        tighter: "-0.03em",
        tight: "-0.015em",
      },
      boxShadow: {
        'refero-sm': '0 1px 2px rgba(78, 8, 12, 0.04)',
        'refero': '0 2px 8px rgba(78, 8, 12, 0.05), 0 1px 2px rgba(78, 8, 12, 0.03)',
        'refero-lg': '0 8px 24px rgba(78, 8, 12, 0.1), 0 2px 6px rgba(78, 8, 12, 0.05)',
      },
      keyframes: {
        'slide-in-right': {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
      animation: {
        'slide-in-right': 'slide-in-right 0.28s cubic-bezier(0.16, 1, 0.3, 1)',
        'fade-in': 'fade-in 0.2s ease-out',
      }
    },
  },
  plugins: [],
}


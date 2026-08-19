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
          canvas: "#F4F4F0",
          card: "#EAEAE5",
          "card-hover": "#E3E3DC",
          "card-light": "#F7F7F4",
          "card-white": "#FFFFFF",
          border: "rgba(0, 0, 0, 0.06)",
          "border-strong": "rgba(0, 0, 0, 0.10)",
          dark: "#18181B",
          muted: "#71717A",
          subtle: "#8E8E93",
          active: "#E0E0D8",
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
        'refero-sm': '0 1px 2px rgba(0, 0, 0, 0.03)',
        'refero': '0 2px 8px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.02)',
        'refero-lg': '0 8px 24px rgba(0, 0, 0, 0.08), 0 2px 6px rgba(0, 0, 0, 0.04)',
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


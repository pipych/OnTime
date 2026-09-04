/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        ios: {
          bg: "var(--ios-bg)",
          card: "var(--ios-card)",
          cardSubtle: "var(--ios-card-subtle)",
          border: "var(--ios-border)",
          text: "var(--ios-text)",
          textSecondary: "var(--ios-text-secondary)",
          accent: "var(--ios-accent)",
          green: "#34C759",
          greenDark: "#30D158",
          orange: "#FF9500",
          orangeDark: "#FF9F0A",
          blue: "#007AFF",
          red: "#FF3B30",
        },
      },
      borderRadius: {
        'ios': '20px',
        'ios-sm': '14px',
        'ios-lg': '26px',
        'ios-pill': '9999px',
      },
      boxShadow: {
        'ios-card': '0 4px 20px -2px rgba(0, 0, 0, 0.05), 0 2px 6px -1px rgba(0, 0, 0, 0.03)',
        'ios-card-dark': '0 8px 30px -4px rgba(0, 0, 0, 0.4), 0 2px 8px -2px rgba(0, 0, 0, 0.3)',
        'ios-dock': '0 10px 30px -5px rgba(0, 0, 0, 0.15)',
        'ios-dock-dark': '0 12px 35px -5px rgba(0, 0, 0, 0.6)',
        'glow-accent': '0 0 24px -2px var(--ios-accent-glow)',
        'glow-blue': '0 0 24px -2px rgba(0, 122, 255, 0.45)',
        'glow-orange': '0 0 24px -2px rgba(255, 149, 0, 0.4)',
        'glow-green': '0 0 24px -2px rgba(52, 199, 89, 0.35)',
      },
    },
  },
  plugins: [],
}


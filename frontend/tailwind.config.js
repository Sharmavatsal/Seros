/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#121212", // Very dark gray, almost black (Industrial base)
        surface: "#1E1E1E", // Slightly lighter for cards/surfaces
        primary: "#3B82F6", // Blue for main actions
        healthy: "#10B981", // Green for Active / Healthy
        warning: "#F59E0B", // Yellow for Warning
        alert: "#EF4444", // Red for Alert / Breakdown
        border: "#27272A", // Dark border color
      },
    },
  },
  plugins: [],
}

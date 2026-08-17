/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}", "./lib/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        bg: "#0B0F14",
        card: "#121821",
        cardElevated: "#1A2332",
        border: "#243044",
        muted: "#8B9BB4",
        live: "#25D366",
        ops: "#3B82F6",
        warn: "#F59E0B",
        danger: "#EF4444",
        bubbleUser: "#1F2A3A",
        bubbleLia: "#005C4B",
      },
      fontFamily: {
        sans: ["DMSans_400Regular"],
        "sans-medium": ["DMSans_500Medium"],
        "sans-bold": ["DMSans_700Bold"],
        mono: ["JetBrainsMono_400Regular"],
        "mono-medium": ["JetBrainsMono_500Medium"],
      },
    },
  },
  plugins: [],
};

/** @type {import('tailwindcss').Config} */
const defaultColors = require("tailwindcss/colors");
const plugin = require("tailwindcss/plugin");

const SHADES = ["50", "100", "200", "300", "400", "500", "600", "700", "800", "900", "950"];

// Brand navy — 800 is the existing brand navy (#0c1e5b) used across the app.
const navy = {
  50: "#eef1f8",
  100: "#dde3f0",
  200: "#bcc6e0",
  300: "#8e9dc6",
  400: "#5d70a6",
  500: "#3b4f8a",
  600: "#273b77",
  700: "#192d69",
  800: "#0c1e5b",
  900: "#081543",
  950: "#050d2c",
};

// Navy-tinted neutrals: what slate/gray become inside the logged-in app.
const navyNeutral = {
  50: "#f6f7fb",
  100: "#eef1f7",
  200: "#dfe4ef",
  300: "#c5cce0",
  400: "#949fbf",
  500: "#657298",
  600: "#4a5781",
  700: "#33416e",
  800: "#1f2d60",
  900: "#0c1e5b",
  950: "#07123f",
};

/*
 * Theme remap scoped to the logged-in app.
 * slate/gray/blue/indigo utilities read CSS variables. Outside `.app-canvas`
 * (home, login, etc.) the variables hold Tailwind's stock colours, so those
 * pages are unchanged. Inside `.app-canvas` (dashboard shell + admin layout)
 * neutrals become navy-tinted and blue/indigo accents become brand navy.
 */
const THEMED = {
  slate: navyNeutral,
  gray: navyNeutral,
  blue: navy,
  indigo: navy,
};

const toChannels = (hex) => {
  const h = hex.replace("#", "");
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)).join(" ");
};

const varPalette = (name) =>
  Object.fromEntries(SHADES.map((s) => [s, `rgb(var(--tw-${name}-${s}) / <alpha-value>)`]));

const vars = (source) => (name) =>
  Object.fromEntries(SHADES.map((s) => [`--tw-${name}-${s}`, toChannels(source(name)[s])]));

const merge = (fn) => Object.assign({}, ...Object.keys(THEMED).map(fn));

module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy,
        // Logged-in app background (soft navy-tinted grey).
        canvas: "#e9edf5",
        ...Object.fromEntries(Object.keys(THEMED).map((n) => [n, varPalette(n)])),
      },
      boxShadow: {
        card: "0 1px 2px rgba(12, 30, 91, 0.04), 0 8px 24px -12px rgba(12, 30, 91, 0.12)",
      },
    },
  },
  plugins: [
    plugin(({ addBase }) => {
      addBase({
        ":root": merge(vars((n) => defaultColors[n])),
        ".app-canvas": merge(vars((n) => THEMED[n])),
      });
    }),
  ],
}

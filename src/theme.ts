import {loadFont} from "@remotion/google-fonts/Inter";

const inter = loadFont("normal", {weights: ["500", "700", "900"], subsets: ["latin"]});

// Light "explainer" theme: white paper, ink text, one warm accent, one cool accent.
export const theme = {
  font: `${inter.fontFamily}, -apple-system, "Segoe UI", Helvetica, Arial, sans-serif`,
  mono: `"JetBrains Mono", "SF Mono", Menlo, Consolas, monospace`,
  bg: "#FFFFFF",
  bg2: "#F6F7FA",
  panel: "#FFFFFF",
  panelBorder: "#E6E8EE",
  ink: "#0F172A",
  text: "#0F172A",
  muted: "#64748B",
  faint: "#CBD5E1",
  accent: "#F5B700",
  accentInk: "#7A5A00",
  blue: "#2563EB",
  blueSoft: "#DBEAFE",
  teal: "#0D9488",
  tealSoft: "#CCFBF1",
  coral: "#E11D48",
  coralSoft: "#FFE4E6",
  violet: "#7C3AED",
  violetSoft: "#EDE9FE",
  shadow: "0 18px 50px rgba(15, 23, 42, 0.10), 0 2px 6px rgba(15, 23, 42, 0.06)",
  shadowSoft: "0 8px 24px rgba(15, 23, 42, 0.08)",
  grid: "rgba(15, 23, 42, 0.06)",
};

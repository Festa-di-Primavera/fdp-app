/**
 * Single source of truth for the app brand palette.
 *
 * CSS‑side (Tailwind / components) uses the `--app-accent` CSS variable defined
 * in app.css.  Server‑side code (email templates, image generation, chart
 * configs …) imports from here so a colour change only requires editing this
 * file + the two CSS custom‑property values in app.css.
 */
export const COLORS = {
    /** Primary brand colour — the main orange */
    primary: "#f56600",
    /** Darker shade for header backgrounds in emails */
    headerBg: "#d45800",
    /** Dark shade for text on light backgrounds (good contrast) */
    textDark: "#9e4200",
    /** Very‑light tinted background */
    lightBg: "#fff4ed",
    /** Light border / divider */
    lightBorder: "#ffc299",
    /** Badge / tag background */
    badgeBg: "#ffe0cc",
} as const;

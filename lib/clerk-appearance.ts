// Maps Clerk's prebuilt cards onto QTRE tokens (BRAND.md). Hex literals
// rather than CSS variables so Clerk's color-mix theming stays compatible.
export const clerkAppearance = {
  options: {
    logoImageUrl: "/brand/qtre-no-bg.png",
    logoPlacement: "inside",
    socialButtonsVariant: "blockButton",
  },
  variables: {
    colorPrimary: "#6A1017",
    colorPrimaryForeground: "#FFFFFF",
    colorForeground: "#1F1F1F",
    colorMutedForeground: "#5C564C",
    colorMuted: "#F8F4EC",
    colorBackground: "#FFFFFF",
    colorInput: "#FFFFFF",
    colorInputForeground: "#1F1F1F",
    colorBorder: "#E7E3DD",
    colorRing: "#6A1017",
    colorDanger: "#B3261E",
    colorNeutral: "#8C6E4E",
    borderRadius: "0.625rem",
    fontFamily: "var(--font-sans), ui-sans-serif, system-ui, sans-serif",
    fontFamilyButtons: "var(--font-sans), ui-sans-serif, system-ui, sans-serif",
  },
  elements: {
    logoImage: "h-10 w-auto",
    headerTitle: "font-heading tracking-tight",
    card: "shadow-[0_8px_24px_rgba(31,31,31,0.06)]",
  },
} as const;

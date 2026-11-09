export const THEME = {
  // Paleta Caos / Absolutismo
  chaos: {
    crimson: "#8B1E2B",
    charcoal: "#2B2D42",
    ashGray: "#8D99AE",
    shadowPurple: "#3D2B3D",
  },
  // Paleta Estado Moderno / Orden Institucional
  order: {
    royalBlue: "#1D3557",
    warmGold: "#D4AF37",
    brightGold: "#FFD700",
    emeraldGreen: "#2A9D8F",
    parchment: "#FBF7EE",
    ivoryWhite: "#FFFFFF",
    ironDark: "#1A1A24",
  },
  // Bloques de Poder
  powers: {
    legislative: "#2563EB", // Azul Rúnico
    executive: "#D97706",   // Oro Solar
    judicial: "#F3F4F6",    // Blanco Mármol
  },
  // 4 Escudos Ministeriales
  shields: {
    logistics: "#EAB308",  // Oro
    humanResources: "#10B981", // Esmeralda
    territory: "#64748B",  // Acero
    planning: "#A8763E",   // Piedra arcilla
  },
  fonts: {
    title: '"Cinzel", "Cinzel Decorative", "Georgia", serif',
    body: '"Plus Jakarta Sans", "Inter", sans-serif',
    comic: '"Bangers", "Impact", "Arial Black", sans-serif',
    handwritten: '"Caveat", "Kalam", cursive',
  },
} as const;

export default THEME;

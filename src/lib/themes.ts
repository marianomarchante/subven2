export type PastelThemeId =
  | "nordic-breeze"
  | "sage-mint"
  | "warm-sand"
  | "lavender-rose"
  | "classic-pearl";

export interface PastelThemeDefinition {
  id: PastelThemeId;
  name: string;
  subtitle: string;
  swatches: [string, string, string];
}

export const PASTEL_THEMES: PastelThemeDefinition[] = [
  {
    id: "nordic-breeze",
    name: "Brisa Nórdica",
    subtitle: "Azul celeste, nube y lavanda suave",
    swatches: ["#DCEBFA", "#E8E4F8", "#5B82B8"],
  },
  {
    id: "sage-mint",
    name: "Salvia y Menta",
    subtitle: "Verde eucalipto, menta y crema",
    swatches: ["#DCF2E6", "#E7F4EC", "#488A73"],
  },
  {
    id: "warm-sand",
    name: "Arena y Melocotón",
    subtitle: "Crema almendra, melocotón y terracota pastel",
    swatches: ["#FCE8DF", "#F9F1E6", "#C26D53"],
  },
  {
    id: "lavender-rose",
    name: "Lavanda y Cuarzo",
    subtitle: "Lila empolvado, rosa cuarzo y malva",
    swatches: ["#EAE2F8", "#FCE4EC", "#7E5EA8"],
  },
  {
    id: "classic-pearl",
    name: "Perla Institucional",
    subtitle: "Gris perla, alabastro y pizarra suave",
    swatches: ["#E2E8F0", "#F1F5F9", "#475569"],
  },
];

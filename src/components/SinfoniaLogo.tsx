import type { ComponentType, CSSProperties, SVGProps } from "react";
import RawSinfoniaSvg from "../assets/sinfonia.svg?react"; // SVGR import (see notes below)

// Type the import ourselves so this works whatever the project's *.svg module
// declaration says (some setups type SVGR imports as FC<{}>, string or any).
const SinfoniaSvg = RawSinfoniaSvg as unknown as ComponentType<SVGProps<SVGSVGElement>>;

/**
 * Order of the color slots. A palette is an array in this order:
 *   [S, I, N, F, O, N, i (stem), A, star]
 * A missing / null / undefined entry keeps the original logo color for that slot.
 */
const SLOTS = ["S", "I", "N1", "F", "O", "N2", "i", "A", "star"] as const;

export type Palette = ReadonlyArray<string | null | undefined>;

/** Built-in themes. `default` is empty on purpose: the SVG's own colors apply. */
const kinda_white = "#CFDDFC"
export const THEMES = {
  default: [
    kinda_white,
    kinda_white,
    kinda_white,
    kinda_white,
    kinda_white,
    kinda_white,


  ],

  pride: [
    "#E40303", // S  red
    "#FF8C00", // I  orange
    "#FFED00", // N  yellow
    "#008026", // F  green
    "#24408E", // O  blue
    "#732982", // N  violet
    "#FFAFC8", // i  pink
    "#74D7EE", // A  light blue
    "#613915", // star brown
  ],

  // Red and green are lighter than the traditional ones so they stay readable on the dark green menu of the Navidad palette
  christmas: [
    "#EF5A63", // S  red
    "#4CC38A", // I  green
    "#EF5A63", // N  red
    "#4CC38A", // F  green
    "#EF5A63", // O  red
    "#4CC38A", // N  green
    "#F2B705", // i  gold
    "#EF5A63", // A  red
    "#F2B705", // star gold
  ],

  // Colors chosen to stay readable on the navy menu background (no pure black)
  halloween: [
    "#FF7518", // S  pumpkin orange
    "#A66BEA", // I  purple
    "#FF7518", // N  orange
    "#A66BEA", // F  purple
    "#FF7518", // O  orange
    "#A66BEA", // N  purple
    "#7CD336", // i  slime green
    "#FF7518", // A  orange
    "#F4EFE6", // star bone white
  ],

  valentines: [
    "#E8366B", // S  rose red
    "#FF8FB1", // I  pink
    "#E8366B", // N  rose red
    "#FF8FB1", // F  pink
    "#E8366B", // O  rose red
    "#FF8FB1", // N  pink
    "#FFD6E0", // i  blush
    "#E8366B", // A  rose red
    "#FFD6E0", // star blush
  ],
} as const satisfies Record<string, Palette>;

export type ThemeName = keyof typeof THEMES;

// The SVG is 98 units tall but the lettering itself only 47.2 (the rest is the star and ring above it),
// so a requested text height is drawn at TEXT_TO_LOGO_HEIGHT times that.
const VIEWBOX_HEIGHT = 98;
const TEXT_HEIGHT = 47.2;
const TEXT_TO_LOGO_HEIGHT = VIEWBOX_HEIGHT / TEXT_HEIGHT;

/** Display names for theme pickers. */
export const THEME_LABELS: Record<ThemeName, string> = {
  default: "Original",
  pride: "Orgullo",
  christmas: "Navidad",
  halloween: "Halloween",
  valentines: "San Valentín",
};

export interface SinfoniaLogoProps extends Omit<SVGProps<SVGSVGElement>, "ref"> {
  /** Key of THEMES. Defaults to "default" (original colors). */
  theme?: ThemeName;
  /**
   * Height of the lettering (the "text" of the logo, like a font size): a number is
   * px, a string is any CSS length ("1.5rem", "2em"). The width follows the aspect
   * ratio. Omit it to size the logo with className / style instead.
   */
  size?: number | string;
  /**
   * Colors in SLOTS order. Overrides the theme slot by slot,
   * so a sparse array works: [, , , , , , , "hotpink"]
   */
  colors?: Palette;
}

export default function SinfoniaLogo({
  theme = "default",
  colors,
  size,
  style,
  ...rest
}: SinfoniaLogoProps) {
  const base: Palette = THEMES[theme] ?? THEMES.default;

  const vars: Record<string, string> = {};
  SLOTS.forEach((slot, i) => {
    const color = colors?.[i] ?? base[i];
    if (color) vars[`--c-${slot}`] = color;
  });

  const sizeStyle: CSSProperties | undefined =
    size === undefined
      ? undefined
      : {
          height:
            typeof size === "number"
              ? size * TEXT_TO_LOGO_HEIGHT
              : `calc(${size} * ${TEXT_TO_LOGO_HEIGHT})`,
          width: "auto",
        };

  return (
    <SinfoniaSvg
      style={{ ...(vars as CSSProperties), ...sizeStyle, ...style }}
      {...rest}
    />
  );
}

/*
 * Usage
 *   <SinfoniaLogo />                                  // original colors
 *   <SinfoniaLogo theme="pride" className="w-64" />
 *   <SinfoniaLogo size={24} />                        // lettering 24px tall (like font-size: 24px)
 *   <SinfoniaLogo size="1.5rem" theme="halloween" />  // any CSS length
 *   <SinfoniaLogo theme="christmas" colors={[, , , , , , , "#fff"]} />
 *   <SinfoniaLogo colors={["#e11d48", "#f97316", "#eab308", "#16a34a",
 *                          "#0ea5e9", "#6366f1", "#000", "#a21caf", "#14b8a6"]} />
 *
 * Notes
 *  - The SVG must be imported as a React component (inline <svg>), not as an
 *    image URL: CSS variables don't reach inside <img src="...svg">.
 *    Vite:    vite-plugin-svgr -> import X from "../assets/sinfonia.svg?react"
 *             and add  /// <reference types="vite-plugin-svgr/client" />  to vite-env.d.ts
 *    Next.js: @svgr/webpack, then import X from "../assets/sinfonia.svg"
 *             and declare the module (below).
 *    CRA:     import { ReactComponent as X } from "../assets/sinfonia.svg"
 *  - If TypeScript can't resolve the import, add a declaration, e.g. svg.d.ts:
 *        declare module "*.svg?react" {
 *          import type { FC, SVGProps } from "react";
 *          const C: FC<SVGProps<SVGSVGElement>>;
 *          export default C;
 *        }
 *  - In the SVGR/SVGO config keep the viewBox (removeViewBox: false), otherwise
 *    the logo won't scale with CSS width/height.
 */

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

export type Slot = (typeof SLOTS)[number];

/**
 * Outline of one slot (a letter or the star).
 *  - color: any CSS color.
 *  - size:  thickness in logo units, measured outside the edge (the logo is 311 units wide, so 1 unit is 1px when it
 *           is drawn 311px wide; it scales together with the logo).
 */
export interface LogoOutline {
  color: string;
  size?: number;
}

/** A (partial) outline, or `false` for "no outline here". Missing parts come from a weaker level, then from the defaults. */
export type OutlineSpec = Partial<LogoOutline> | false;

/** Outlines per slot. `all` applies to every slot that has no entry of its own. */
export type Outlines = Partial<Record<Slot | "all", OutlineSpec>>;

const DEFAULT_OUTLINE_SIZE = 1.2;
const DEFAULT_OUTLINE_COLOR = "#FFFFFF";

/**
 * Hardcoded outlines of each theme. By default none has one (the palettes of a theme can set their own with
 * `logoOutlines` in theme.ts, e.g. Pride's Medianoche).
 * Keys are the slots (S, I, N1, F, O, N2, i, A, star) or `all`. Examples:
 *   christmas: { I: { color: "#0B3D2E", size: 0.8 } },                    // only the 2nd letter
 *   halloween: { all: { color: "#1B1035", size: 0.6 }, star: false },     // everything but the star
 */
export const OUTLINES: Partial<Record<ThemeName, Outlines>> = {};

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
  /**
   * Outline of the whole logo (shorthand for `outlines.all`). `false` removes every outline, the theme's included;
   * an object sets it: `{ color: "#fff", size: 1.5 }`. Without a color it is white.
   */
  outline?: OutlineSpec;
  /**
   * Outline per slot, on top of the theme's (see OUTLINES): `{ I: { color: "#000", size: 1 } }` outlines only the
   * 2nd letter; `{ A: false }` removes the outline of one slot.
   */
  outlines?: Outlines;
}


/**
 * Outline of every slot that has one. For each slot the levels are, strongest first: this call's entry for the slot,
 * this call's `all`, the theme's entry for the slot, the theme's `all`. They merge field by field (a stronger color or
 * size wins), and a `false` stops the search: that slot, and the weaker levels, get no outline.
 */
function resolveOutlines(theme: ThemeName, call: Outlines): Partial<Record<Slot, Required<LogoOutline>>> {
  const fromTheme = OUTLINES[theme] ?? {};
  const result: Partial<Record<Slot, Required<LogoOutline>>> = {};
  for (const slot of SLOTS) {
    const merged: Partial<LogoOutline> = {};
    let found = false;
    for (const level of [call[slot], call.all, fromTheme[slot], fromTheme.all]) {
      if (level === false) break;
      if (!level) continue;
      found = true;
      if (merged.color === undefined) merged.color = level.color;
      if (merged.size === undefined) merged.size = level.size;
    }
    const size = merged.size ?? DEFAULT_OUTLINE_SIZE;
    if (found && size > 0) result[slot] = { color: merged.color ?? DEFAULT_OUTLINE_COLOR, size };
  }
  return result;
}


export default function SinfoniaLogo({
  theme = "default",
  colors,
  size,
  outline,
  outlines,
  style,
  ...rest
}: SinfoniaLogoProps) {
  const base: Palette = THEMES[theme] ?? THEMES.default;

  const vars: Record<string, string> = {};
  SLOTS.forEach((slot, i) => {
    const color = colors?.[i] ?? base[i];
    if (color) vars[`--c-${slot}`] = color;
  });

  // Each outlined slot gets --o-<slot>-color and --o-<slot>-size (the SVG draws nothing for a slot without them).
  // The outline sticks out of the viewBox, so the SVG must not clip it.
  const resolved = resolveOutlines(theme, { ...outlines, all: outline ?? outlines?.all });
  let hasOutline = false;
  SLOTS.forEach((slot) => {
    const o = resolved[slot];
    if (!o) return;
    hasOutline = true;
    vars[`--o-${slot}-color`] = o.color;
    vars[`--o-${slot}-size`] = `${o.size}px`;
  });
  const outlineStyle: CSSProperties | undefined = hasOutline ? { overflow: "visible" } : undefined;

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
      style={{ ...(vars as CSSProperties), ...outlineStyle, ...sizeStyle, ...style }}
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
 *   <SinfoniaLogo outlines={{ I: { color: "#1B2A4A", size: 1 } }} />      // outline only the 2nd letter
 *   <SinfoniaLogo outlines={{ I: { color: "#000" }, A: { color: "#fff", size: 2 } }} />
 *   <SinfoniaLogo theme="pride" outline={{ color: "#000", size: 2 }} />   // whole logo, own color / thickness
 *   <SinfoniaLogo theme="pride" outlines={{ star: false }} />             // theme outline, but not on the star
 *   <SinfoniaLogo theme="pride" outline={false} />                        // no outline at all
 *   <SinfoniaLogo colors={["#e11d48", "#f97316", "#eab308", "#16a34a",
 *                          "#0ea5e9", "#6366f1", "#000", "#a21caf", "#14b8a6"]} />
 *
 * Outline slots: S, I, N1, F, O, N2, i, A, star (N1 / N2 = first / second N, i = the stem of the i).
 * The size is in logo units and measured outside the letter. Keep it under ~3: the closest letters (the i stem and
 * the A) are about 3 units apart, and bigger outlines start covering the neighbour.
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

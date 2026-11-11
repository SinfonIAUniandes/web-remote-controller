/// <reference types="vite/client" />
/// <reference types="vite-plugin-svgr/client" />

declare module "*.svg" {
  import type { ComponentType, SVGProps } from "react";

  const SvgComponent: ComponentType<SVGProps<SVGSVGElement>>;
  export default SvgComponent;
}

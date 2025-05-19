

declare module "path-that-svg" {
  /**
   * Converts all SVG shapes (rect, circle, etc.) into <path> elements.
   * @param svgContent The full SVG markup as a string.
   * @returns A promise that resolves to SVG markup where all shapes are paths.
   */
  export default function pathThatSvg(
    svgContent: string
  ): Promise<string>;
}
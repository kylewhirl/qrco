declare module "svg-flatten" {
    /** Options accepted by svg-flatten (only the ones you use) */
    export interface FlattenOptions {
      compress?: boolean;
      precision?: number;
    }
  
    /**
     * Flattens all clip paths / masks in an SVG and returns a
     * standalone string.
     */
    export default function flatten(
      svg: string,
      options?: FlattenOptions
    ): string;
  }
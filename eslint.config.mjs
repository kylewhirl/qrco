import { defineConfig, globalIgnores } from "eslint/config";
import nextTs from "eslint-config-next/typescript";
import nextVitals from "eslint-config-next/core-web-vitals";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    // Keep the pre-Next 16 lint baseline until the React Compiler rules can be
    // adopted through focused refactors instead of a dependency-security PR.
    rules: {
      "react-hooks/error-boundaries": "off",
      "react-hooks/immutability": "off",
      "react-hooks/incompatible-library": "off",
      "react-hooks/purity": "off",
      "react-hooks/refs": "off",
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/static-components": "off",
    },
  },
  {
    files: ["scripts/**/*.cjs"],
    rules: {
      "@typescript-eslint/no-require-imports": "off",
    },
  },
  {
    files: ["packages/tqrco/src/**/*.{ts,tsx}"],
    rules: {
      "@next/next/no-img-element": "off",
    },
  },
  globalIgnores([
    ".next/**",
    "next-env.d.ts",
    "apps/docs/.next/**",
    "apps/docs/next-env.d.ts",
    "apps/docs/.source/**",
    "packages/tqrco/dist/**",
  ]),
]);

export default eslintConfig;

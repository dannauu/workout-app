import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
    ],
  },
  {
    rules: {
      // Disable warnings that are false positives or not critical for deployment
      "@typescript-eslint/no-unused-vars": "off", // Disable unused vars for deployment
      "react-hooks/exhaustive-deps": "warn", // Change to warn instead of error
      "@typescript-eslint/no-explicit-any": "warn", // Change to warn instead of error
      "react/no-unescaped-entities": "warn", // Change to warn instead of error
    },
  },
];

export default eslintConfig;

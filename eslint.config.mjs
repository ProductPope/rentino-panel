import nextVitals from "eslint-config-next/core-web-vitals"
import nextTs from "eslint-config-next/typescript"
import eslintConfigPrettier from "eslint-config-prettier"
import jsxA11y from "eslint-plugin-jsx-a11y"
import { defineConfig, globalIgnores } from "eslint/config"

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  // eslint-config-next registers jsx-a11y with a few rules; turn on the full strict set.
  { rules: jsxA11y.flatConfigs.strict.rules },
  {
    rules: {
      "@typescript-eslint/consistent-type-imports": ["error", { fixStyle: "inline-type-imports" }],
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
    },
  },
  {
    // UI depends on typed interfaces in src/lib; mocks are wired in only by the service modules.
    files: ["src/**/*.{ts,tsx}"],
    ignores: ["src/lib/*/index.ts", "src/mocks/**"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/mocks", "@/mocks/*"],
              message: "Import the interface from @/lib/… — mocks are wired in its index.ts.",
            },
          ],
        },
      ],
    },
  },
  eslintConfigPrettier,
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "playwright-report/**",
    "test-results/**",
    // Installed from the @eq registry (EQ-librium); linted there, never edited here.
    "src/components/ui/**",
    "src/components/eq/**",
    "src/hooks/**",
    "src/lib/utils.ts",
  ]),
])

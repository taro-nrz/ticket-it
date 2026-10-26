import js from "@eslint/js";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import globals from "globals";
import { defineConfig } from "eslint/config";

export default defineConfig([
  {
    ignores: [
      "**/node_modules/**",
      "**/coverage/**",
      "packages/frontend/.expo/**",
      "packages/frontend/dist/**",
      "packages/frontend/test-results/**",
      "packages/frontend/playwright-report/**",
      "packages/frontend/expo-env.d.ts",
      // Generado por MSW (npx msw init)
      "packages/frontend/public/mockServiceWorker.js",
    ],
  },
  {
    files: ["packages/backend/**/*.{js,mjs,cjs}"],
    plugins: { js },
    extends: ["js/recommended"],
    languageOptions: { globals: globals.node },
    rules: {
      "no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
    },
  },
  // Frontend (React Native + Expo): reglas de React y de hooks
  {
    files: ["packages/frontend/{app,src}/**/*.{js,jsx}"],
    plugins: { js, react, "react-hooks": reactHooks },
    extends: ["js/recommended"],
    languageOptions: {
      globals: { ...globals.browser, process: "readonly" },
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    settings: { react: { version: "detect" } },
    rules: {
      ...react.configs.recommended.rules,
      ...react.configs["jsx-runtime"].rules,
      ...reactHooks.configs.recommended.rules,
      "react/prop-types": "off",
      "react/no-unescaped-entities": "off",
      "no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_", caughtErrorsIgnorePattern: "^_" },
      ],
    },
  },
  {
    files: ["packages/frontend/e2e/**/*.mjs", "packages/frontend/*.{js,mjs}"],
    plugins: { js },
    extends: ["js/recommended"],
    languageOptions: { globals: { ...globals.node, ...globals.browser } },
  },
  {
    files: ["packages/backend/test/**/*.{js,mjs,cjs}"],
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,
      },
    },
  },
]);

const js = require("@eslint/js");
const tsParser = require("@typescript-eslint/parser");
const tsPlugin = require("@typescript-eslint/eslint-plugin");

module.exports = [
  js.configs.recommended,
  {
    files: ["eslint.config.js"],
    languageOptions: {
      globals: { require: "readonly", module: "readonly" },
    },
  },
  {
    files: ["**/*.ts"],
    languageOptions: {
      parser: tsParser,
      parserOptions: { ecmaVersion: "latest", sourceType: "module" },
      globals: {
        process: "readonly",
        Buffer: "readonly",
        __dirname: "readonly",
        require: "readonly",
        module: "readonly",
      },
    },
    plugins: { "@typescript-eslint": tsPlugin },
    rules: {
      ...tsPlugin.configs.recommended.rules,
      "no-undef": "off",
      "@typescript-eslint/no-explicit-any": "error",
    },
  },
  { ignores: ["dist/**", "node_modules/**", "coverage/**"] },
];

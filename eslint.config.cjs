module.exports = [
  {
    files: ["**/*.ts", "**/*.tsx"],
    languageOptions: {
      // Use require(...) so ESLint gets the parser object (not a path string)
      parser: require("@typescript-eslint/parser"),
      parserOptions: {
        tsconfigRootDir: __dirname,
        project: "./tsconfig.json",
        sourceType: "module"
      }
    },
    plugins: {
      // Load the plugin module object
      "@typescript-eslint": require("@typescript-eslint/eslint-plugin")
    },
    rules: {
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": ["warn", { "argsIgnorePattern": "^_" }],
      "@typescript-eslint/explicit-function-return-type": "off"
    }
  }
];
module.exports = {
  parser: "@typescript-eslint/parser", // Specifies the ESLint parser
  env: {
    node: true,
    es2020: true,
  },
  parserOptions: {
    ecmaVersion: 2020, // Allows for the parsing of modern ECMAScript features
    sourceType: "module", // Allows for the use of imports
  },
  settings: {},
  extends: [
    "plugin:@typescript-eslint/recommended",
    // Enables eslint-plugin-prettier and eslint-config-prettier. This will
    // display prettier errors as ESLint errors. Make sure this is always the
    // last configuration in the extends array.
    "plugin:prettier/recommended",
  ],
  plugins: ["simple-import-sort"],
  rules: {
    // Place to specify ESLint rules. Can be used to overwrite rules specified
    // from the extended configs.
    // e.g. "@typescript-eslint/explicit-function-return-type": "off",
    "simple-import-sort/imports": "error",
  },
};

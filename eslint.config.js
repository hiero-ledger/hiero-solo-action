import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import eslintConfigPrettier from "eslint-config-prettier";
import prettierPlugin from "eslint-plugin-prettier";

export default tseslint.config(
    {
        ignores: ["dist/**", "node_modules/**"],
    },
    js.configs.recommended,
    ...tseslint.configs.recommendedTypeChecked,

    // Prettier plugin (reports formatting as errors)
    {
        plugins: { prettier: prettierPlugin },
        rules: {
            "prettier/prettier": "error",
        },
    },

    // TypeScript rules 
    {
        files: ["**/*.ts"],
        languageOptions: {
            globals: globals.node,
            parserOptions: {
                projectService: true,
                tsconfigRootDir: import.meta.dirname,
            },
        },
    },
    {
        files: ["**/*.js"],
        ...tseslint.configs.disableTypeChecked,
    },
    eslintConfigPrettier,
);

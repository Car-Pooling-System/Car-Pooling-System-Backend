import js from "@eslint/js";
import globals from "globals";

export default [
    {
        ignores: ["node_modules/**", "coverage/**", ".github/**"],
    },
    js.configs.recommended,
    {
        languageOptions: {
            ecmaVersion: 2021,
            sourceType: "module",
            globals: {
                ...globals.node,
                ...globals.jest,
            },
        },
        rules: {
            "no-console": "off",
        },
    },
];

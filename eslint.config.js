import js from "@eslint/js"
import react from "eslint-plugin-react"
import reactHooks from "eslint-plugin-react-hooks"
import tseslint from "typescript-eslint"

export default [
    {
        ignores: ["dist/**", "node_modules/**", "src/api/generated/**"]
    },
    js.configs.recommended,
    ...tseslint.configs.recommended,
    {
        files: ["**/*.config.{js,cjs,ts}", "postcss.config.cjs"],
        languageOptions: {
            globals: {
                module: "readonly",
                require: "readonly"
            }
        },
        rules: {
            "@typescript-eslint/no-require-imports": "off",
            "no-undef": "off"
        }
    },
    {
        files: ["**/*.{jsx,tsx}"],
        plugins: {
            react,
            "react-hooks": reactHooks
        },
        settings: {
            react: {
                version: "detect"
            }
        },
        rules: {
            ...react.configs.recommended.rules,
            ...reactHooks.configs.recommended.rules,
            "react/react-in-jsx-scope": "off"
        }
    }
]

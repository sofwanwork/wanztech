import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { FlatCompat } from '@eslint/eslintrc';
import tseslint from 'typescript-eslint';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
    baseDirectory: __dirname,
});

const eslintConfig = [
    // Ignores (replaces .eslintignore)
    {
        ignores: [
            '.next/**',
            'node_modules/**',
            'out/**',
            'dist/**',
            'build/**',
            '*.config.js',
            '*.config.ts',
            '*.config.mjs',
            'coverage/**',
        ],
    },
    // Extend next/core-web-vitals
    ...compat.extends('next/core-web-vitals'),
    // TypeScript ESLint recommended config
    ...tseslint.configs.recommended,
    // Custom rule overrides
    {
        rules: {
            // Downgrade to warnings for gradual cleanup
            '@typescript-eslint/no-unused-vars': 'warn',
            '@typescript-eslint/no-explicit-any': 'warn',
            '@typescript-eslint/ban-ts-comment': 'warn',
        },
    },
];

export default eslintConfig;

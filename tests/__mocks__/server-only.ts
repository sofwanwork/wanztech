// Empty stub for the `server-only` package, used by Vitest's resolver via
// the alias in `vitest.config.ts`. The real package throws when imported
// outside a React Server Component, which is correct for production but
// breaks Node-based unit tests that load server-tagged modules.
export {};

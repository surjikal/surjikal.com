# Repository Guidelines

## General Guidelines

- Always pin exact package versions.
- Don't patch symptoms, fix the root cause.
- Code should be self-explanatory:
  - Write clear, descriptive variable and function names.
  - Use DRY & clean code principles.
  - Use `IIFE` to encapsulate logic for variable assignment.
  - Don't write parrot comments.
  - Structure code so its intent is obvious.
  - Comments should be avoided as much as possible.
- The compiler, build, and linter are your friends — leverage them:
  - Write types that are designed to catch bugs at compile-time.
  - Do not trick the compiler by assigning fake dummy values (e.g. empty string).
- Do not swallow errors unless explicitly directed or confirmed by a human.

## Contributing

- Follow the `contributing` skill ([.agents/skills/contributing/SKILL.md](.agents/skills/contributing/SKILL.md)) for:
  - Branching & deployment workflow
  - Commit format (`commitlint` + textemoji requirement)
  - Agent attribution footers for PRs and comments

## Stack & Tooling

- **Framework & Build:** Hono (`hono/jsx` + `hono/jsx-renderer`) with Vite (`@cloudflare/vite-plugin` and `vite-ssr-components`).
- **Cloudflare Config:** Uses `wrangler.jsonc` (`surj-homepage`). Use `npm run cf-typegen` after changing bindings/config; do not switch to `cloudflare.config.ts` or run `cf dev` / `cf build` / `cf deploy`.
- **TypeScript:** Strictest configuration in `tsconfig.json`. Run `npm run typecheck`.
- **Linting & Formatting:** `oxlint` (`.oxlintrc.json` with `oxlint-tsgolint`), `oxfmt` (`.oxfmtrc.json`), and `stylelint` (`.stylelintrc.json`). Run `npm run lint` and `npm run lint:fix` before committing.
- **Agent Skills:** Project-local skills live in `.agents/skills/` (`contributing`, `hono`, `hono-jsx`).
- **New Worktrees:** Run `npm ci` to install dependencies if `node_modules` is missing before running lint, typecheck, or build commands.

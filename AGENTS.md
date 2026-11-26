# Repository Guidelines

## Branching & Deployment Workflow

- **Never push or trigger builds directly on `main` for unverified changes.**
- Always work on a feature/fix branch, push it, and open a Pull Request.
- Verify both GitHub Actions CI (`npm run lint`, `npm run typecheck`, `npm run build`) and the Cloudflare Workers Preview deployment before merging to `main`.
- Merging to `main` triggers Cloudflare Workers Builds to deploy `surj-homepage` to `surjikal.com`.

## Stack & Tooling

- **Framework & Build:** Hono (`hono/jsx` + `hono/jsx-renderer`) with Vite (`@cloudflare/vite-plugin` and `vite-ssr-components`).
- **Cloudflare Config:** Uses `wrangler.jsonc` (`surj-homepage`). Use `npm run cf-typegen` after changing bindings/config; do not switch to `cloudflare.config.ts` or run `cf dev` / `cf build` / `cf deploy`.
- **TypeScript:** Strictest configuration in `tsconfig.json`. Run `npm run typecheck`.
- **Linting & Formatting:** Biome (`biome.json`). Run `npm run lint` (`biome check --error-on-warnings .`) and `npm run lint:fix` before committing.
- **Agent Skills:** Project-local skills live in `.agents/skills/` (`hono`, `hono-jsx`).

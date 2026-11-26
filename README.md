# surjikal.com

Personal homepage for SURJ (`surjikal.com`), running on Cloudflare Workers with [Hono](https://hono.dev/) and built with [Vite](https://vite.dev/) (`@cloudflare/vite-plugin`).

## Development

```bash
npm install
npm run dev
```

## Checks & Build

```bash
npm run lint
npm run typecheck
npm run build
npm run preview
```

Regenerate Cloudflare Worker types after changing `wrangler.jsonc`:

```bash
npm run cf-typegen
```

## Deployment

Pushing to `main` triggers `.github/workflows/deploy.yml` to lint, typecheck, build, and deploy to Cloudflare Workers.

Required GitHub repository secrets:

- `CLOUDFLARE_API_TOKEN` (Account: Workers Scripts Edit + Zone/DNS/Workers Routes Edit)
- `CLOUDFLARE_ACCOUNT_ID`

# [surjikal.com](https://surjikal.com)

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

Cloudflare Workers Builds is connected to this repository:

- Pushing or merging to `main` builds and deploys `surj-homepage` to `surjikal.com`.
- Opening or updating a Pull Request automatically deploys an isolated Cloudflare Workers Preview and posts the Preview URL on the PR.

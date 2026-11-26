---
name: contributing
description: Use when creating branches, writing commits, opening Pull Requests, posting PR/issue comments, or deploying changes in this repository. Covers branching and deployment workflow, commitlint textemoji commit format, and agent attribution footers.
---

# Contributing

## Branching & Deployment Workflow

- **Never push or trigger builds directly on `main` for unverified changes.**
- Always work on a feature/fix branch, push it, and open a Pull Request.
- Verify both GitHub Actions CI (`npm run lint`, `npm run typecheck`, `npm run build`) and the Cloudflare Workers Preview deployment before merging to `main`.
- Merging to `main` triggers Cloudflare Workers Builds to deploy `surj-homepage` to `surjikal.com`.

## Commit Format

- **Enforced by:** `commitlint` (`commitlint.config.mjs`) via `.githooks/commit-msg` and GitHub Actions CI (conventional commit format + max 72 characters).
- **Format (agents):** `<type>: <textemoji> <short fun lowercase summary>` (max 72 characters).
- **Textemoji required (agents only):** Every agent-authored commit subject must include a kaomoji / textemoji from [textemoji.org](https://www.textemoji.org/) (e.g. `(⌐■_■)`, `¯\_(ツ)_/¯`, `(•̀ᴗ•́)و`, `(☞ﾟヮﾟ)☞`, `٩(◕‿◕｡)۶`). Not enforced by `commitlint` so human commits without textemojis are allowed.
- **Full textemoji list:** See [references/textemojis.md](references/textemojis.md) for the complete scraped reference list.
- **Allowed types:** `feat`, `fix`, `docs`, `chore`, `ci`, `refactor`, `style`, `perf`, `test`, `build`, `revert`.
- **Example:** `feat: (づ｡◕‿‿◕｡)づ add shiny new thing`

## Agent Attribution Footer

- Always include a footer formatted as `<verb> <harness> / <model>` when writing PRs or comments:
  - **PRs:** `vibed with <harness> / <model>`
  - **Comments:** `roasted by <harness> / <model>`

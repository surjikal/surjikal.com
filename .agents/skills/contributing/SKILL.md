---
name: contributing
description: Use when creating branches, managing worktrees, writing commits, opening Pull Requests, posting PR/issue comments, or deploying changes in this repository. Covers branching, worktrees, and deployment workflow, commitlint textemoji commit format, and agent attribution footers.
---

# Contributing

## Branching, Worktrees, & Deployment Workflow

- **Never push or trigger builds directly on `main` for unverified changes.**
- **Branch naming:** Always use `<prefix>/<what>` in kebab-case, where `<prefix>` matches the allowed commit types (`feat`, `fix`, `docs`, `chore`, `ci`, `refactor`, `style`, `perf`, `test`, `build`, `revert`) — e.g., `feat/update-design`, `fix/nav-overflow`.
- Always work on a branch (or worktree), push it, and open a Pull Request.
- Verify both GitHub Actions CI (`npm run lint`, `npm run typecheck`, `npm run build`) and the Cloudflare Workers Preview deployment before merging to `main`.
- Merging to `main` triggers Cloudflare Workers Builds to deploy `surj-homepage` to `surjikal.com`.
- **Worktree cleanup:** When working in a git worktree, delete/clean up the worktree (`git worktree remove <path>` / `git worktree prune`) and remove the merged local branch (`git branch -d <branch>`) after the PR is merged.

## Commit Format

- **Enforced by:** `commitlint` (`commitlint.config.mjs`) via `.githooks/commit-msg` and GitHub Actions CI (conventional commit format + max 72 characters).
- **Format (agents):** `<type>: <textemoji> <short fun lowercase summary>` (max 72 characters).
- **Textemoji required (agents only):** Every agent-authored commit subject must include a kaomoji / textemoji from [textemoji.org](https://www.textemoji.org/) (e.g. `(⌐■_■)`, `¯\_(ツ)_/¯`, `(•̀ᴗ•́)و`, `(☞ﾟヮﾟ)☞`, `٩(◕‿◕｡)۶`). Not enforced by `commitlint` so human commits without textemojis are allowed.
- **Full textemoji list:** See [references/textemojis.md](references/textemojis.md) for the complete scraped reference list.
- **Allowed types:** `feat`, `fix`, `docs`, `chore`, `ci`, `refactor`, `style`, `perf`, `test`, `build`, `revert`.
- **Example:** `feat: (づ｡◕‿‿◕｡)づ add shiny new thing`
- **Commit body as LLM work log:** Use commit bodies to persist decisions, architectural choices, trade-offs, rejected alternatives, and non-obvious context so git history serves as a durable work log for future LLMs. Write densely and directly for LLM consumers (no human-oriented prose needed), and **never include private, secret, or sensitive information** — this repository is public.

## Agent Attribution Footer

- Always include a footer formatted as `<verb> <harness> / <model>` when writing PRs or comments:
  - **PRs:** `vibed with <harness> / <model>`
  - **Comments:** `roasted by <harness> / <model>`

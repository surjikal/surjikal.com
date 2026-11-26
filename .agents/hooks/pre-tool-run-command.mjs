import { execFileSync } from 'node:child_process'

const readStdin = async () => {
  const chunks = []
  for await (const chunk of process.stdin) {
    chunks.push(chunk)
  }
  return Buffer.concat(chunks).toString('utf8')
}

const out = (result) => {
  process.stdout.write(JSON.stringify(result))
}

const getCurrentBranch = (cwd) => {
  try {
    return execFileSync('git', ['rev-parse', '--abbrev-ref', 'HEAD'], {
      cwd,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim()
  } catch {
    return null
  }
}

const extractFlagValue = (cmd, flags) => {
  for (const flag of flags) {
    const escaped = flag.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const quotedRe = new RegExp(`(?:^|\\s)${escaped}(?:=|\\s+)(?:"([^"]*)"|'([^']*)')`)
    const match = cmd.match(quotedRe)
    if (match) {
      return match[1] ?? match[2] ?? ''
    }
  }
  return null
}

const main = async () => {
  const raw = await readStdin()
  const payload = raw ? JSON.parse(raw) : {}
  const cmd = payload.toolCall?.args?.CommandLine ?? ''
  const repoRoot = payload.cwd || payload.workspacePaths?.[0] || process.cwd()

  if (!cmd.trim()) {
    out({ decision: 'ask' })
    return
  }

  if (/\bgit\b/.test(cmd) && /(?:^|\s)--no-verify(?:\s|$)/.test(cmd)) {
    out({
      decision: 'deny',
      reason:
        'AGENTS.md forbids bypassing git hooks (--no-verify). If hooks fail because dependencies are missing in a worktree, run `npm ci` first.',
    })
    return
  }

  if (/(?:^|[;&|]\s*)cf\s+(?:dev|build|deploy)\b/.test(cmd)) {
    out({
      decision: 'deny',
      reason:
        'AGENTS.md forbids `cf dev`, `cf build`, and `cf deploy`. Use `wrangler.jsonc` and Vite (`npm run dev` / `npm run build`).',
    })
    return
  }

  if (/\b(?:npm\s+run\s+deploy|wrangler\s+deploy)\b/.test(cmd)) {
    out({
      decision: 'force_ask',
      reason:
        'Contributing workflow deploys via PRs and merges to `main` (Cloudflare Workers Builds). Confirm if you intentionally want a direct deploy.',
    })
    return
  }

  if (/\bgit\s+push\b/.test(cmd)) {
    const branch = getCurrentBranch(repoRoot)
    const targetsMain =
      /(?:^|\s)(?:HEAD:)?main(?:\s|$)/.test(cmd) ||
      (branch === 'main' && !/\bgit\s+push\s+\S+\s+\S+/.test(cmd))
    if (targetsMain) {
      out({
        decision: 'force_ask',
        reason:
          'Pushing directly to `main` triggers Cloudflare Workers Builds to deploy to surjikal.com. Confirm if intentional.',
      })
      return
    }
  }

  if (/\bgit\s+commit\b/.test(cmd)) {
    const branch = getCurrentBranch(repoRoot)
    if (branch === 'main') {
      out({
        decision: 'force_ask',
        reason:
          'Currently checked out on `main`. Contributing workflow expects changes on a feature/fix branch and a Pull Request.',
      })
      return
    }

    const message = extractFlagValue(cmd, ['-m', '--message'])
    if (message !== null) {
      const header = message.split(/\r?\n/, 1)[0].trim()
      const conventionalRe =
        /^(feat|fix|docs|chore|ci|refactor|style|perf|test|build|revert)(\([^)]+\))?:\s+.+$/
      if (!conventionalRe.test(header)) {
        out({
          decision: 'deny',
          reason:
            'Commit subject must use conventional format: `<type>: <textemoji> <short fun lowercase summary>` (e.g. `feat: (づ｡◕‿‿◕｡)づ add shiny new thing`).',
        })
        return
      }
      if (header.length > 72) {
        out({
          decision: 'deny',
          reason: `Commit subject is ${header.length} chars (max 72 per commitlint.config.mjs).`,
        })
        return
      }
      const hasTextEmoji = [...header].some((ch) => {
        const cp = ch.codePointAt(0)
        return cp !== undefined && cp > 127
      })
      if (!hasTextEmoji) {
        out({
          decision: 'deny',
          reason:
            'Agent commits must include a non-ASCII textemoji/kaomoji in the subject (e.g. `(⌐■_■)`, `(•̀ᴗ•́)و`, `(☞ﾟヮﾟ)☞`) per .agents/skills/contributing/SKILL.md.',
        })
        return
      }
    }
  }

  if (/\bgh\s+pr\s+create\b/.test(cmd)) {
    const body = extractFlagValue(cmd, ['--body', '-b'])
    if (body !== null && !/vibed with\s+\S+/i.test(body)) {
      out({
        decision: 'deny',
        reason:
          'PR body must include the attribution footer `vibed with <harness> / <model>` per .agents/skills/contributing/SKILL.md.',
      })
      return
    }
  }

  if (/\bgh\s+(?:pr|issue)\s+comment\b/.test(cmd)) {
    const body = extractFlagValue(cmd, ['--body', '-b'])
    if (body !== null && !/(?:roasted by|vibed with)\s+\S+/i.test(body)) {
      out({
        decision: 'deny',
        reason:
          'PR/issue comments must include the attribution footer `roasted by <harness> / <model>` per .agents/skills/contributing/SKILL.md.',
      })
      return
    }
  }

  const npmInstallMatch = cmd.match(/\bnpm\s+(?:install|i|add)\s+([^;&|]+)/)
  if (npmInstallMatch) {
    const tokens = npmInstallMatch[1].trim().split(/\s+/)
    const hasPkgArg = tokens.some((t) => t && !t.startsWith('-'))
    const hasExactFlag = tokens.some((t) => t === '-E' || t === '--save-exact')
    if (hasPkgArg && !hasExactFlag) {
      out({
        decision: 'deny',
        reason:
          'AGENTS.md requires pinning exact package versions: pass `--save-exact` (or `-E`) when installing packages.',
      })
      return
    }
  }

  out({ decision: 'ask' })
}

main().catch(() => {
  out({ decision: 'ask' })
})

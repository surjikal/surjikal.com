import fs from 'node:fs'
import path from 'node:path'

const readStdin = async () => {
  const chunks = []
  for await (const chunk of process.stdin) {
    chunks.push(chunk)
  }
  return Buffer.concat(chunks).toString('utf8')
}

const main = async () => {
  const raw = await readStdin()
  const payload = raw ? JSON.parse(raw) : {}
  const repoRoot = payload.cwd || payload.workspacePaths?.[0] || process.cwd()

  if (!fs.existsSync(path.join(repoRoot, 'node_modules'))) {
    process.stdout.write(
      JSON.stringify({
        injectSteps: [
          {
            systemMessage: {
              systemMessage:
                'Worktree check: node_modules is missing. Per AGENTS.md, run `npm ci` before running lint, typecheck, build, or git commit hooks.',
            },
          },
        ],
      }),
    )
    return
  }

  process.stdout.write('{}')
}

main().catch(() => {
  process.stdout.write('{}')
})

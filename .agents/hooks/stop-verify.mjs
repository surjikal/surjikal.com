import { execFileSync, execSync } from 'node:child_process'
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

  if (payload.continuationActive || payload.terminationReason !== 'NO_TOOL_CALL') {
    process.stdout.write('{}')
    return
  }

  const repoRoot = payload.cwd || payload.workspacePaths?.[0] || process.cwd()
  if (!fs.existsSync(path.join(repoRoot, 'node_modules'))) {
    process.stdout.write('{}')
    return
  }

  let dirtyFiles = []
  try {
    const status = execFileSync('git', ['status', '--porcelain'], {
      cwd: repoRoot,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    })
    dirtyFiles = status
      .split(/\r?\n/)
      .filter(Boolean)
      .map((line) => line.slice(3).trim())
      .filter((p) => !p.startsWith('.agents/'))
  } catch {
    process.stdout.write('{}')
    return
  }

  if (dirtyFiles.length === 0) {
    process.stdout.write('{}')
    return
  }

  try {
    execSync('npm run lint && npm run typecheck', {
      cwd: repoRoot,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
      timeout: 50_000,
    })
    process.stdout.write('{}')
  } catch (err) {
    const output = `${err.stdout ?? ''}\n${err.stderr ?? ''}`.trim().slice(0, 1500)
    process.stdout.write(
      JSON.stringify({
        decision: 'continue',
        reason: `Pre-finish verification failed (\`npm run lint && npm run typecheck\`). Fix these issues before finishing:\n${output}`,
      }),
    )
  }
}

main().catch(() => {
  process.stdout.write('{}')
})

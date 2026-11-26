import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

const OXFMT_EXTENSIONS = new Set([
  '.ts',
  '.tsx',
  '.js',
  '.jsx',
  '.mjs',
  '.cjs',
  '.json',
  '.jsonc',
  '.md',
  '.css',
  '.html',
])

const readStdin = async () => {
  const chunks = []
  for await (const chunk of process.stdin) {
    chunks.push(chunk)
  }
  return Buffer.concat(chunks).toString('utf8')
}

const runQuiet = (bin, args, cwd) => {
  try {
    execFileSync(bin, args, {
      cwd,
      stdio: 'ignore',
      timeout: 20_000,
    })
  } catch {
    // Non-fatal in PostToolUse; Stop hook or explicit lint catches remaining issues.
  }
}

const main = async () => {
  const raw = await readStdin()
  const payload = raw ? JSON.parse(raw) : {}
  const filePath = payload.toolCall?.args?.Path
  const repoRoot = payload.cwd || payload.workspacePaths?.[0] || process.cwd()

  if (payload.error || !filePath || !fs.existsSync(path.join(repoRoot, 'node_modules'))) {
    process.stdout.write('{}')
    return
  }

  const absPath = path.isAbsolute(filePath) ? filePath : path.resolve(repoRoot, filePath)
  const relPath = path.relative(repoRoot, absPath)

  if (
    !relPath ||
    relPath.startsWith('..') ||
    relPath === 'worker-configuration.d.ts' ||
    relPath === 'package-lock.json' ||
    /^(?:\.agents|\.wrangler|dist|node_modules)(?:\/|$)/.test(relPath)
  ) {
    process.stdout.write('{}')
    return
  }

  if (relPath === 'wrangler.jsonc') {
    runQuiet('npx', ['--no', 'wrangler', 'types', '--env-interface', 'CloudflareBindings'], repoRoot)
  }

  if (relPath.startsWith('src/') && relPath.endsWith('.css')) {
    runQuiet('npx', ['--no', 'stylelint', '--fix', relPath], repoRoot)
  }

  if (OXFMT_EXTENSIONS.has(path.extname(relPath))) {
    runQuiet('npx', ['--no', 'oxfmt', relPath], repoRoot)
  }

  process.stdout.write('{}')
}

main().catch(() => {
  process.stdout.write('{}')
})

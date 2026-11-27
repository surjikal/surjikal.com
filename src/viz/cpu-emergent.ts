import { type CpuVizEngine, type GridField, createFastRng, wrap } from './types'

interface MoldAgent {
  x: number
  y: number
  angle: number
}

function senseTrail(
  trail: Float32Array,
  cols: number,
  rows: number,
  agent: MoldAgent,
  offset: number,
): number {
  const sx = wrap(Math.round(agent.x + Math.cos(agent.angle + offset) * 3.2), cols)
  const sy = wrap(Math.round(agent.y + Math.sin(agent.angle + offset) * 3.2), rows)
  return trail[sy * cols + sx] ?? 0
}

function diffuseTrail(trail: Float32Array, next: Float32Array, field: GridField): void {
  const { cols, rows, left, right, up, down } = field
  for (let y = 0; y < rows; y += 1) {
    const yu = up[y] ?? 0
    const y0 = y * cols
    const yd = down[y] ?? 0
    for (let x = 0; x < cols; x += 1) {
      const avg =
        ((trail[y0 + (left[x] ?? 0)] ?? 0) +
          (trail[y0 + (right[x] ?? 0)] ?? 0) +
          (trail[yu + x] ?? 0) +
          (trail[yd + x] ?? 0)) *
        0.25
      next[y0 + x] = ((trail[y0 + x] ?? 0) * 0.76 + avg * 0.24) * 0.94
    }
  }
  trail.set(next)
}

export function createPhysarumEngine(field: GridField): CpuVizEngine {
  const { cols, rows, total } = field
  const rng = createFastRng(total ^ 0xc2b2ae35)
  const trail = new Float32Array(total)
  const scratch = new Float32Array(total)
  const count = Math.min(3600, Math.max(160, Math.trunc(total * 0.11)))
  const agents: MoldAgent[] = Array.from({ length: count }, () => ({
    x: rng() * cols,
    y: rng() * rows,
    angle: rng() * Math.PI * 2,
  }))

  const step = (): void => {
    for (const a of agents) {
      const fwd = senseTrail(trail, cols, rows, a, 0)
      const l = senseTrail(trail, cols, rows, a, -0.55)
      const r = senseTrail(trail, cols, rows, a, 0.55)
      if (fwd < l && fwd < r) {
        a.angle += (rng() < 0.5 ? -1 : 1) * 0.48
      } else if (l !== r) {
        a.angle += l > r ? -0.48 : 0.48
      }
      a.x = wrap(a.x + Math.cos(a.angle) * 0.85, cols)
      a.y = wrap(a.y + Math.sin(a.angle) * 0.85, rows)
      const idx = Math.trunc(a.y) * cols + Math.trunc(a.x)
      trail[idx] = Math.min(1, (trail[idx] ?? 0) + 0.65)
      field.phase[idx] = a.angle * 0.15915494
    }
    diffuseTrail(trail, scratch, field)
    field.intensity.set(trail)
    field.dirty = true
  }

  for (let i = 0; i < 40; i += 1) {
    step()
  }
  return { kind: 'cpu', stepMs: 50, step, update: () => {} }
}

interface Boid {
  x: number
  y: number
  vx: number
  vy: number
  hue: number
}

function steerBoid(boid: Boid, flock: readonly Boid[], gx: number, gy: number): void {
  let sx = 0
  let sy = 0
  let ax = 0
  let ay = 0
  let near = 0
  for (const other of flock) {
    const dx = other.x - boid.x
    const dy = other.y - boid.y
    const dSq = dx * dx + dy * dy
    if (dSq > 0 && dSq < 64) {
      ax += other.vx
      ay += other.vy
      near += 1
      if (dSq < 6.8) {
        const inv = 1 / Math.sqrt(dSq)
        sx -= dx * inv
        sy -= dy * inv
      }
    }
  }
  if (near > 0) {
    boid.vx += (ax / near - boid.vx) * 0.08 + sx * 0.14
    boid.vy += (ay / near - boid.vy) * 0.08 + sy * 0.14
  }
  boid.vx += (gx - boid.x) * 0.003
  boid.vy += (gy - boid.y) * 0.003
  const speed = Math.hypot(boid.vx, boid.vy) || 1
  const clamped = Math.min(1.2, Math.max(0.55, speed))
  boid.vx = (boid.vx / speed) * clamped
  boid.vy = (boid.vy / speed) * clamped
}

export function createBoidsEngine(field: GridField): CpuVizEngine {
  const { cols, rows, total, right } = field
  const rng = createFastRng(total ^ 0x94d049bb)
  const trail = new Float32Array(total)
  const count = Math.min(96, Math.max(52, Math.trunc(Math.sqrt(total) * 0.65)))
  const flock: Boid[] = Array.from({ length: count }, (_, i) => ({
    x: rng() * cols,
    y: rng() * rows,
    vx: Math.cos(i) * 0.85,
    vy: Math.sin(i) * 0.85,
    hue: i / count,
  }))

  const step = (now: number): void => {
    const gx = cols * (0.5 + 0.32 * Math.cos(now * 0.0005))
    const gy = rows * (0.5 + 0.32 * Math.sin(now * 0.0007))
    for (let i = 0; i < total; i += 1) {
      trail[i] = (trail[i] ?? 0) * 0.88
    }
    for (const b of flock) {
      steerBoid(b, flock, gx, gy)
      b.x = wrap(b.x + b.vx, cols)
      b.y = wrap(b.y + b.vy, rows)
      const ix = Math.trunc(b.x)
      const iy = Math.trunc(b.y)
      const idx = iy * cols + ix
      trail[idx] = 1
      const rIdx = iy * cols + (right[ix] ?? 0)
      trail[rIdx] = Math.max(trail[rIdx] ?? 0, 0.45)
      field.phase[idx] = b.hue
    }
    field.intensity.set(trail)
    field.dirty = true
  }

  for (let i = 0; i < 24; i += 1) {
    step(i * 50)
  }
  return { kind: 'cpu', stepMs: 45, step, update: () => {} }
}

export function createAttractorEngine(field: GridField): CpuVizEngine {
  const { cols, rows, total } = field
  const density = new Float32Array(total)
  const samples = Math.min(8000, Math.max(2800, Math.trunc(total * 0.25)))

  const update = (now: number): void => {
    const t = now * 0.00025
    const a = -1.7 + 0.22 * Math.sin(t * 0.9)
    const b = 1.65 + 0.22 * Math.cos(t * 0.7)
    const c = 1.05 + 0.18 * Math.sin(t * 1.1)
    const d = 0.75 + 0.22 * Math.cos(t * 0.8)
    for (let i = 0; i < total; i += 1) {
      density[i] = (density[i] ?? 0) * 0.84
    }
    let px = 0.1
    let py = 0.1
    const scale = Math.min(cols, rows) * 0.21
    for (let i = 0; i < samples; i += 1) {
      const nx = Math.sin(a * py) + c * Math.cos(a * px)
      const ny = Math.sin(b * px) + d * Math.cos(b * py)
      const gx = Math.trunc(cols * 0.5 + nx * scale)
      const gy = Math.trunc(rows * 0.5 + ny * scale)
      if (gx >= 0 && gx < cols && gy >= 0 && gy < rows) {
        const idx = gy * cols + gx
        density[idx] = Math.min(1, (density[idx] ?? 0) + 0.18)
        field.phase[idx] = Math.hypot(nx - px, ny - py) * 0.22
      }
      px = nx
      py = ny
    }
    field.intensity.set(density)
    field.dirty = true
  }

  return { kind: 'cpu', stepMs: 40, step: () => {}, update }
}

export function createRainEngine(field: GridField): CpuVizEngine {
  const { cols, rows, total } = field
  const rng = createFastRng(total ^ 0x6c62272e)
  const trail = new Float32Array(total)
  const drops = Array.from({ length: Math.max(10, Math.trunc(cols * 0.45)) }, () => ({
    x: Math.trunc(rng() * cols),
    y: Math.trunc(rng() * rows),
    hue: rng(),
  }))

  const step = (): void => {
    for (let i = 0; i < total; i += 1) {
      trail[i] = (trail[i] ?? 0) * 0.84
    }
    for (const drop of drops) {
      drop.y = (drop.y + 1) % rows
      if (drop.y === 0) {
        drop.x = Math.trunc(rng() * cols)
      }
      const idx = drop.y * cols + drop.x
      trail[idx] = 1
      field.phase[idx] = drop.hue
    }
    field.intensity.set(trail)
    field.dirty = true
  }

  for (let i = 0; i < 16; i += 1) {
    step()
  }
  return { kind: 'cpu', stepMs: 105, step, update: () => {} }
}

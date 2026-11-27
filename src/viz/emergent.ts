import { type GridField, type VizEngine, smoothToward, wrap } from './types'

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

function diffuseTrail(trail: Float32Array, next: Float32Array, cols: number, rows: number): void {
  for (let y = 0; y < rows; y += 1) {
    const ym = wrap(y - 1, rows) * cols
    const y0 = y * cols
    const yp = wrap(y + 1, rows) * cols
    for (let x = 0; x < cols; x += 1) {
      const avg =
        ((trail[y0 + wrap(x - 1, cols)] ?? 0) +
          (trail[y0 + wrap(x + 1, cols)] ?? 0) +
          (trail[ym + x] ?? 0) +
          (trail[yp + x] ?? 0)) *
        0.25
      next[y0 + x] = ((trail[y0 + x] ?? 0) * 0.76 + avg * 0.24) * 0.94
    }
  }
  trail.set(next)
}

export function createPhysarumEngine(field: GridField): VizEngine {
  const total = field.cols * field.rows
  const trail = new Float32Array(total)
  const scratch = new Float32Array(total)
  const count = Math.max(140, Math.floor(total * 0.14))
  const agents: MoldAgent[] = Array.from({ length: count }, () => ({
    x: Math.random() * field.cols,
    y: Math.random() * field.rows,
    angle: Math.random() * Math.PI * 2,
  }))

  const step = (): void => {
    const { cols, rows } = field
    for (const a of agents) {
      const fwd = senseTrail(trail, cols, rows, a, 0)
      const left = senseTrail(trail, cols, rows, a, -0.55)
      const right = senseTrail(trail, cols, rows, a, 0.55)
      if (fwd < left && fwd < right) {
        a.angle += (Math.random() < 0.5 ? -1 : 1) * 0.48
      } else if (left > right) {
        a.angle -= 0.48
      } else if (right > left) {
        a.angle += 0.48
      }
      a.x = wrap(a.x + Math.cos(a.angle) * 0.85, cols)
      a.y = wrap(a.y + Math.sin(a.angle) * 0.85, rows)
      const idx = Math.floor(a.y) * cols + Math.floor(a.x)
      trail[idx] = Math.min(1, (trail[idx] ?? 0) + 0.65)
      field.phase[idx] = wrap(a.angle / (Math.PI * 2), 1)
    }
    diffuseTrail(trail, scratch, cols, rows)
    field.intensity.set(trail)
  }

  for (let i = 0; i < 45; i += 1) {
    step()
  }
  return { stepMs: 50, step, update: () => {} }
}

function stepKuramotoGrid(
  theta: Float32Array,
  next: Float32Array,
  omega: Float32Array,
  cols: number,
  rows: number,
): void {
  for (let y = 0; y < rows; y += 1) {
    const ym = wrap(y - 1, rows) * cols
    const y0 = y * cols
    const yp = wrap(y + 1, rows) * cols
    for (let x = 0; x < cols; x += 1) {
      const idx = y0 + x
      const t0 = theta[idx] ?? 0
      const couple =
        Math.sin((theta[y0 + wrap(x - 1, cols)] ?? 0) - t0) +
        Math.sin((theta[y0 + wrap(x + 1, cols)] ?? 0) - t0) +
        Math.sin((theta[ym + x] ?? 0) - t0) +
        Math.sin((theta[yp + x] ?? 0) - t0)
      next[idx] = wrap(t0 + (omega[idx] ?? 0) + 0.21 * couple, Math.PI * 2)
    }
  }
  theta.set(next)
}

export function createKuramotoEngine(field: GridField): VizEngine {
  const total = field.cols * field.rows
  const theta = Float32Array.from({ length: total }, () => Math.random() * Math.PI * 2)
  const next = new Float32Array(total)
  const omega = Float32Array.from({ length: total }, () => 0.05 + (Math.random() - 0.5) * 0.03)

  const step = (): void => {
    stepKuramotoGrid(theta, next, omega, field.cols, field.rows)
    for (let i = 0; i < total; i += 1) {
      const t = theta[i] ?? 0
      field.intensity[i] = 0.08 + 0.88 * Math.pow(0.5 + 0.5 * Math.sin(t), 1.8)
      field.phase[i] = t / (Math.PI * 2)
    }
  }

  for (let i = 0; i < 45; i += 1) {
    step()
  }
  return { stepMs: 55, step, update: () => {} }
}

function sweepIsing(spins: Int8Array, cols: number, rows: number, bias: number): void {
  const attempts = cols * rows * 2
  for (let i = 0; i < attempts; i += 1) {
    const x = Math.floor(Math.random() * cols)
    const y = Math.floor(Math.random() * rows)
    const idx = y * cols + x
    const s = spins[idx] ?? 1
    const sum =
      (spins[y * cols + wrap(x - 1, cols)] ?? 1) +
      (spins[y * cols + wrap(x + 1, cols)] ?? 1) +
      (spins[wrap(y - 1, rows) * cols + x] ?? 1) +
      (spins[wrap(y + 1, rows) * cols + x] ?? 1)
    const dE = 2 * s * (sum + bias)
    if (dE <= 0 || Math.random() < Math.exp(-0.44 * dE)) {
      spins[idx] = -s
    }
  }
}

export function createIsingEngine(field: GridField): VizEngine {
  const total = field.cols * field.rows
  const spins = new Int8Array(total)
  const target = new Float32Array(total)
  for (let i = 0; i < total; i += 1) {
    spins[i] = Math.random() < 0.5 ? 1 : -1
  }
  for (let i = 0; i < 35; i += 1) {
    sweepIsing(spins, field.cols, field.rows, 0)
  }

  const sync = (): void => {
    const { cols, rows } = field
    for (let y = 0; y < rows; y += 1) {
      const y0 = y * cols
      const yp = wrap(y + 1, rows) * cols
      for (let x = 0; x < cols; x += 1) {
        const idx = y0 + x
        const s = spins[idx] ?? 1
        const edge = s !== (spins[y0 + wrap(x + 1, cols)] ?? 1) || s !== (spins[yp + x] ?? 1)
        target[idx] = edge ? 0.95 : s > 0 ? 0.42 : 0.04
        field.phase[idx] = edge ? 0.12 : s > 0 ? 0.58 : 0.85
      }
    }
  }

  sync()
  field.intensity.set(target)

  return {
    stepMs: 85,
    step: (now) => {
      sweepIsing(spins, field.cols, field.rows, 0.02 * Math.sin(now * 0.0005))
      sync()
    },
    update: () => {
      smoothToward(target, field.intensity, 0.2, 0.12)
    },
  }
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
    const d = Math.hypot(dx, dy)
    if (d > 0 && d < 8) {
      ax += other.vx
      ay += other.vy
      near += 1
      if (d < 2.6) {
        sx -= dx / d
        sy -= dy / d
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
  const clamped = Math.min(1.15, Math.max(0.55, speed))
  boid.vx = (boid.vx / speed) * clamped
  boid.vy = (boid.vy / speed) * clamped
}

export function createBoidsEngine(field: GridField): VizEngine {
  const total = field.cols * field.rows
  const trail = new Float32Array(total)
  const flock: Boid[] = Array.from({ length: 56 }, (_, i) => ({
    x: Math.random() * field.cols,
    y: Math.random() * field.rows,
    vx: Math.cos(i) * 0.8,
    vy: Math.sin(i) * 0.8,
    hue: i / 56,
  }))

  const step = (now: number): void => {
    const { cols, rows } = field
    const gx = cols * (0.5 + 0.32 * Math.cos(now * 0.0005))
    const gy = rows * (0.5 + 0.32 * Math.sin(now * 0.0007))
    for (let i = 0; i < total; i += 1) {
      trail[i] = (trail[i] ?? 0) * 0.88
    }
    for (const b of flock) {
      steerBoid(b, flock, gx, gy)
      b.x = wrap(b.x + b.vx, cols)
      b.y = wrap(b.y + b.vy, rows)
      const ix = Math.floor(b.x)
      const iy = Math.floor(b.y)
      const idx = iy * cols + ix
      trail[idx] = 1
      trail[iy * cols + wrap(ix + 1, cols)] = Math.max(
        trail[iy * cols + wrap(ix + 1, cols)] ?? 0,
        0.45,
      )
      field.phase[idx] = b.hue
    }
    field.intensity.set(trail)
  }

  for (let i = 0; i < 24; i += 1) {
    step(i * 50)
  }
  return { stepMs: 45, step, update: () => {} }
}

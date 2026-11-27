import { type GridField, type VizEngine, wrap } from './types'

function stepGrayScott(
  u: Float32Array,
  v: Float32Array,
  nextU: Float32Array,
  nextV: Float32Array,
  cols: number,
  rows: number,
): void {
  const feed = 0.037
  const kill = 0.06
  for (let y = 0; y < rows; y += 1) {
    const ym = wrap(y - 1, rows) * cols
    const y0 = y * cols
    const yp = wrap(y + 1, rows) * cols
    for (let x = 0; x < cols; x += 1) {
      const xm = wrap(x - 1, cols)
      const xp = wrap(x + 1, cols)
      const idx = y0 + x
      const uv = u[idx] ?? 1
      const vv = v[idx] ?? 0
      const lapU =
        (u[y0 + xm] ?? 1) + (u[y0 + xp] ?? 1) + (u[ym + x] ?? 1) + (u[yp + x] ?? 1) - 4 * uv
      const lapV =
        (v[y0 + xm] ?? 0) + (v[y0 + xp] ?? 0) + (v[ym + x] ?? 0) + (v[yp + x] ?? 0) - 4 * vv
      const uvv = uv * vv * vv
      nextU[idx] = Math.min(1, Math.max(0, uv + (0.2 * lapU - uvv + feed * (1 - uv))))
      nextV[idx] = Math.min(1, Math.max(0, vv + (0.1 * lapV + uvv - (feed + kill) * vv)))
    }
  }
  u.set(nextU)
  v.set(nextV)
}

export function createGrayScottEngine(field: GridField): VizEngine {
  const total = field.cols * field.rows
  const u = new Float32Array(total).fill(1)
  const v = new Float32Array(total)
  const nextU = new Float32Array(total)
  const nextV = new Float32Array(total)

  for (let i = 0; i < 10; i += 1) {
    const cx = Math.floor(Math.random() * field.cols)
    const cy = Math.floor(Math.random() * field.rows)
    for (let dy = -2; dy <= 2; dy += 1) {
      const ny = wrap(cy + dy, field.rows) * field.cols
      for (let dx = -2; dx <= 2; dx += 1) {
        const idx = ny + wrap(cx + dx, field.cols)
        u[idx] = 0.5
        v[idx] = 0.25 + Math.random() * 0.1
      }
    }
  }

  for (let i = 0; i < 180; i += 1) {
    stepGrayScott(u, v, nextU, nextV, field.cols, field.rows)
  }

  const sync = (): void => {
    for (let i = 0; i < total; i += 1) {
      const val = Math.min(1, (v[i] ?? 0) * 2.6)
      field.intensity[i] = val
      field.phase[i] = val * 0.85
    }
  }

  sync()
  return {
    stepMs: 80,
    step: () => {
      stepGrayScott(u, v, nextU, nextV, field.cols, field.rows)
      stepGrayScott(u, v, nextU, nextV, field.cols, field.rows)
      sync()
    },
    update: () => {},
  }
}

export function createWavesEngine(field: GridField): VizEngine {
  const sources = [
    { x: 0.25, y: 0.35, speed: 0.0022, freq: 0.48 },
    { x: 0.72, y: 0.28, speed: 0.0017, freq: 0.42 },
    { x: 0.52, y: 0.76, speed: 0.002, freq: 0.52 },
  ]

  const update = (now: number): void => {
    const { cols, rows, intensity, phase } = field
    for (let y = 0; y < rows; y += 1) {
      const row = y * cols
      for (let x = 0; x < cols; x += 1) {
        let sum = 0
        for (const src of sources) {
          sum += Math.sin(
            Math.hypot(x - src.x * cols, y - src.y * rows) * src.freq - now * src.speed,
          )
        }
        const norm = (sum / sources.length + 1) * 0.5
        const idx = row + x
        intensity[idx] = norm
        phase[idx] = norm
      }
    }
  }

  return { stepMs: 40, step: () => {}, update }
}

export function createFlowEngine(field: GridField): VizEngine {
  const update = (now: number): void => {
    const { cols, rows, intensity, phase } = field
    const t = now * 0.00045
    for (let y = 0; y < rows; y += 1) {
      const row = y * cols
      const ny = y * 0.09
      for (let x = 0; x < cols; x += 1) {
        const nx = x * 0.075
        const v1 = Math.sin(nx + Math.cos(ny * 0.8 + t) + t * 0.7)
        const v2 = Math.cos(ny - Math.sin(nx * 0.7 - t * 0.6))
        const idx = row + x
        intensity[idx] = 0.5 + 0.5 * Math.sin((v1 + v2) * 2.1)
        phase[idx] = (v1 + v2) * 0.25 + 0.5
      }
    }
  }

  return { stepMs: 40, step: () => {}, update }
}

interface VoronoiSeed {
  x: number
  y: number
  vx: number
  vy: number
  phase: number
}

function sampleVoronoiCell(
  seeds: readonly VoronoiSeed[],
  nx: number,
  ny: number,
  now: number,
): { intensity: number; phase: number } {
  let minDist = 9
  let secondDist = 9
  let seedPhase = 0
  for (const seed of seeds) {
    const dx = Math.min(Math.abs(nx - seed.x), 1 - Math.abs(nx - seed.x))
    const dy = Math.min(Math.abs(ny - seed.y), 1 - Math.abs(ny - seed.y))
    const d = Math.hypot(dx, dy)
    if (d < minDist) {
      secondDist = minDist
      minDist = d
      seedPhase = seed.phase
    } else if (d < secondDist) {
      secondDist = d
    }
  }
  const edge = Math.exp(-Math.pow((secondDist - minDist) * 18, 2))
  const pulse = 0.5 + 0.5 * Math.sin(minDist * 26 - now * 0.002)
  return {
    intensity: Math.min(1, edge * 0.75 + pulse * 0.35),
    phase: seedPhase + minDist * 1.8,
  }
}

export function createVoronoiEngine(field: GridField): VizEngine {
  const seeds: VoronoiSeed[] = Array.from({ length: 12 }, (_, i) => ({
    x: Math.random(),
    y: Math.random(),
    vx: (Math.random() - 0.5) * 0.00018,
    vy: (Math.random() - 0.5) * 0.00018,
    phase: i / 12,
  }))

  const update = (now: number): void => {
    const { cols, rows, intensity, phase } = field
    for (const seed of seeds) {
      seed.x = wrap(seed.x + seed.vx, 1)
      seed.y = wrap(seed.y + seed.vy, 1)
    }
    for (let y = 0; y < rows; y += 1) {
      const row = y * cols
      for (let x = 0; x < cols; x += 1) {
        const sample = sampleVoronoiCell(seeds, x / cols, y / rows, now)
        const idx = row + x
        intensity[idx] = sample.intensity
        phase[idx] = sample.phase
      }
    }
  }

  return { stepMs: 40, step: () => {}, update }
}

export function createRainEngine(field: GridField): VizEngine {
  const total = field.cols * field.rows
  const trail = new Float32Array(total)
  const drops = Array.from({ length: Math.max(8, Math.floor(field.cols * 0.45)) }, () => ({
    x: Math.floor(Math.random() * field.cols),
    y: Math.floor(Math.random() * field.rows),
    hue: Math.random(),
  }))

  const step = (): void => {
    const { cols, rows } = field
    for (let i = 0; i < total; i += 1) {
      trail[i] = (trail[i] ?? 0) * 0.84
    }
    for (const drop of drops) {
      drop.y = (drop.y + 1) % rows
      if (drop.y === 0) {
        drop.x = Math.floor(Math.random() * cols)
      }
      const idx = drop.y * cols + drop.x
      trail[idx] = 1
      field.phase[idx] = drop.hue
    }
    field.intensity.set(trail)
  }

  for (let i = 0; i < 16; i += 1) {
    step()
  }

  return { stepMs: 110, step, update: () => {} }
}

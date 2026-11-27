import { type GridField, type VizEngine } from './types'

const CHLADNI_MODES: readonly (readonly [number, number])[] = [
  [3, 5],
  [4, 7],
  [5, 2],
  [6, 4],
  [2, 7],
  [5, 8],
]

function evalChladni(ux: number, uy: number, mode: readonly [number, number]): number {
  const n = mode[0] * Math.PI
  const m = mode[1] * Math.PI
  return Math.cos(n * ux) * Math.cos(m * uy) - Math.cos(m * ux) * Math.cos(n * uy)
}

export function createChladniEngine(field: GridField): VizEngine {
  const update = (now: number): void => {
    const { cols, rows, intensity, phase } = field
    const scale = Math.max(cols, rows) * 0.5
    const cycle = now * 0.00016
    const idxA = Math.floor(cycle) % CHLADNI_MODES.length
    const idxB = (idxA + 1) % CHLADNI_MODES.length
    const mix = 0.5 - 0.5 * Math.cos((cycle % 1) * Math.PI)
    const modeA = CHLADNI_MODES[idxA] ?? [3, 5]
    const modeB = CHLADNI_MODES[idxB] ?? [4, 7]

    for (let y = 0; y < rows; y += 1) {
      const uy = (y - rows * 0.5) / scale
      const row = y * cols
      for (let x = 0; x < cols; x += 1) {
        const ux = (x - cols * 0.5) / scale
        const w = (1 - mix) * evalChladni(ux, uy, modeA) + mix * evalChladni(ux, uy, modeB)
        const idx = row + x
        intensity[idx] = Math.exp(-Math.abs(w) * 4.2)
        phase[idx] = w * 0.25 + 0.5
      }
    }
  }

  return { stepMs: 40, step: () => {}, update }
}

const PENROSE_DIRS = Array.from({ length: 5 }, (_, k) => {
  const angle = (k * Math.PI) / 5
  return { cos: Math.cos(angle), sin: Math.sin(angle), drift: k % 2 === 0 ? 1 : -0.75 }
})

export function createQuasicrystalEngine(field: GridField): VizEngine {
  const update = (now: number): void => {
    const { cols, rows, intensity, phase } = field
    const t = now * 0.0008
    for (let y = 0; y < rows; y += 1) {
      const cy = (y - rows * 0.5) * 0.44
      const row = y * cols
      for (let x = 0; x < cols; x += 1) {
        const cx = (x - cols * 0.5) * 0.44
        let sum = 0
        for (const dir of PENROSE_DIRS) {
          sum += Math.cos(cx * dir.cos + cy * dir.sin + t * dir.drift)
        }
        const idx = row + x
        intensity[idx] = Math.pow(0.5 + 0.5 * Math.sin(sum * 1.3), 1.7)
        phase[idx] = (sum + 5) * 0.1
      }
    }
  }

  return { stepMs: 40, step: () => {}, update }
}

export function createAttractorEngine(field: GridField): VizEngine {
  const total = field.cols * field.rows
  const density = new Float32Array(total)

  const update = (now: number): void => {
    const { cols, rows, intensity, phase } = field
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
    for (let i = 0; i < 2800; i += 1) {
      const nx = Math.sin(a * py) + c * Math.cos(a * px)
      const ny = Math.sin(b * px) + d * Math.cos(b * py)
      const gx = Math.floor(cols * 0.5 + nx * scale)
      const gy = Math.floor(rows * 0.5 + ny * scale)
      if (gx >= 0 && gx < cols && gy >= 0 && gy < rows) {
        const idx = gy * cols + gx
        density[idx] = Math.min(1, (density[idx] ?? 0) + 0.18)
        phase[idx] = Math.hypot(nx - px, ny - py) * 0.22
      }
      px = nx
      py = ny
    }
    intensity.set(density)
  }

  return { stepMs: 40, step: () => {}, update }
}

export function createMoireEngine(field: GridField): VizEngine {
  const update = (now: number): void => {
    const { cols, rows, intensity, phase } = field
    const scale = Math.max(cols, rows) * 0.5
    const t = now * 0.00055
    const ax = 0.22 * Math.cos(t * 0.7)
    const ay = 0.18 * Math.sin(t * 0.9)
    const bx = -0.22 * Math.cos(t * 0.55)
    const by = -0.18 * Math.sin(t * 0.8)

    for (let y = 0; y < rows; y += 1) {
      const uy = (y - rows * 0.5) / scale
      const row = y * cols
      for (let x = 0; x < cols; x += 1) {
        const ux = (x - cols * 0.5) / scale
        const dxa = ux - ax
        const dya = uy - ay
        const dxb = ux - bx
        const dyb = uy - by
        const gA = Math.sin(Math.hypot(dxa, dya) * 26 + Math.atan2(dya, dxa) * 3 - t * 1.4)
        const gB = Math.sin(Math.hypot(dxb, dyb) * 24 - Math.atan2(dyb, dxb) * 3 + t * 1.1)
        const idx = row + x
        intensity[idx] = Math.pow(0.5 + 0.5 * gA * gB, 1.6)
        phase[idx] = (gA - gB) * 0.25 + 0.5
      }
    }
  }

  return { stepMs: 40, step: () => {}, update }
}

function lensCell(
  ux: number,
  uy: number,
  c1x: number,
  c1y: number,
  t: number,
): { intensity: number; phase: number } {
  const dx1 = ux - c1x
  const dy1 = uy - c1y
  const dx2 = ux + c1x
  const dy2 = uy + c1y
  const r1Sq = dx1 * dx1 + dy1 * dy1
  const r2Sq = dx2 * dx2 + dy2 * dy2
  if (r1Sq < 0.006 || r2Sq < 0.006) {
    return { intensity: 0, phase: 0 }
  }
  const m1 = 0.028 / (r1Sq + 0.012)
  const m2 = 0.028 / (r2Sq + 0.012)
  const lx = ux - dx1 * m1 + dy1 * m1 * 0.65 - dx2 * m2 + dy2 * m2 * 0.65
  const ly = uy - dy1 * m1 - dx1 * m1 * 0.65 - dy2 * m2 - dx2 * m2 * 0.65
  const sheet = 0.5 + 0.5 * Math.sin(lx * 22 + t * 0.4) * Math.sin(ly * 22 - t * 0.3)
  const ring =
    Math.exp(-Math.pow((Math.sqrt(r1Sq) - 0.14) / 0.045, 2)) +
    Math.exp(-Math.pow((Math.sqrt(r2Sq) - 0.14) / 0.045, 2))
  return {
    intensity: Math.min(1, sheet * 0.52 + ring * 0.72),
    phase: (m1 + m2) * 0.35 + sheet * 0.3,
  }
}

export function createSingularityEngine(field: GridField): VizEngine {
  const update = (now: number): void => {
    const { cols, rows, intensity, phase } = field
    const scale = Math.min(cols, rows) * 0.5
    const t = now * 0.0009
    const orbit = 0.24 + 0.05 * Math.sin(t * 0.4)
    const c1x = orbit * Math.cos(t)
    const c1y = orbit * Math.sin(t) * 0.75

    for (let y = 0; y < rows; y += 1) {
      const uy = (y - rows * 0.5) / scale
      const row = y * cols
      for (let x = 0; x < cols; x += 1) {
        const sample = lensCell((x - cols * 0.5) / scale, uy, c1x, c1y, t)
        const idx = row + x
        intensity[idx] = sample.intensity
        phase[idx] = sample.phase
      }
    }
  }

  return { stepMs: 40, step: () => {}, update }
}

function toppleSandpile(grains: Uint8Array, next: Uint8Array, cols: number, rows: number): void {
  next.set(grains)
  for (let y = 0; y < rows; y += 1) {
    const y0 = y * cols
    for (let x = 0; x < cols; x += 1) {
      const idx = y0 + x
      if ((grains[idx] ?? 0) >= 4) {
        next[idx] = (next[idx] ?? 4) - 4
        if (x > 0) next[idx - 1] = (next[idx - 1] ?? 0) + 1
        if (x + 1 < cols) next[idx + 1] = (next[idx + 1] ?? 0) + 1
        if (y > 0) next[idx - cols] = (next[idx - cols] ?? 0) + 1
        if (y + 1 < rows) next[idx + cols] = (next[idx + cols] ?? 0) + 1
      }
    }
  }
  grains.set(next)
}

export function createSandpileEngine(field: GridField): VizEngine {
  const { cols, rows } = field
  const total = cols * rows
  const grains = new Uint8Array(total).fill(2)
  const next = new Uint8Array(total)
  const anchors = [
    [Math.floor(cols * 0.35), Math.floor(rows * 0.5)],
    [Math.floor(cols * 0.65), Math.floor(rows * 0.5)],
    [Math.floor(cols * 0.5), Math.floor(rows * 0.35)],
    [Math.floor(cols * 0.5), Math.floor(rows * 0.65)],
  ] as const

  const dropAndRelax = (): void => {
    for (const [ax, ay] of anchors) {
      const idx = ay * cols + ax
      grains[idx] = (grains[idx] ?? 0) + 2
    }
    for (let pass = 0; pass < 18; pass += 1) {
      toppleSandpile(grains, next, cols, rows)
    }
  }

  for (let i = 0; i < 90; i += 1) {
    dropAndRelax()
  }

  const sync = (): void => {
    for (let i = 0; i < total; i += 1) {
      const g = grains[i] ?? 0
      field.intensity[i] = g >= 4 ? 1 : g * 0.26
      field.phase[i] = g * 0.22
    }
  }

  sync()
  return {
    stepMs: 90,
    step: () => {
      dropAndRelax()
      sync()
    },
    update: () => {},
  }
}

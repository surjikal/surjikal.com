import { type CpuVizEngine, type GridField, createFastRng, smoothToward, wrap } from './types'

function stepGrayScott(
  u: Float32Array,
  v: Float32Array,
  nextU: Float32Array,
  nextV: Float32Array,
  field: GridField,
): void {
  const { cols, rows, left, right, up, down } = field
  for (let y = 0; y < rows; y += 1) {
    const yu = up[y] ?? 0
    const y0 = y * cols
    const yd = down[y] ?? 0
    for (let x = 0; x < cols; x += 1) {
      const xl = left[x] ?? 0
      const xr = right[x] ?? 0
      const idx = y0 + x
      const uv = u[idx] ?? 1
      const vv = v[idx] ?? 0
      const lapU =
        (u[y0 + xl] ?? 1) + (u[y0 + xr] ?? 1) + (u[yu + x] ?? 1) + (u[yd + x] ?? 1) - 4 * uv
      const lapV =
        (v[y0 + xl] ?? 0) + (v[y0 + xr] ?? 0) + (v[yu + x] ?? 0) + (v[yd + x] ?? 0) - 4 * vv
      const uvv = uv * vv * vv
      nextU[idx] = Math.min(1, Math.max(0, uv + (0.2 * lapU - uvv + 0.037 * (1 - uv))))
      nextV[idx] = Math.min(1, Math.max(0, vv + (0.1 * lapV + uvv - 0.097 * vv)))
    }
  }
  u.set(nextU)
  v.set(nextV)
}

export function createGrayScottEngine(field: GridField): CpuVizEngine {
  const { total, cols, rows } = field
  const rng = createFastRng(total ^ 0x165667b1)
  const u = new Float32Array(total).fill(1)
  const v = new Float32Array(total)
  const nextU = new Float32Array(total)
  const nextV = new Float32Array(total)
  const spots = Math.max(10, Math.trunc(total * 0.004))

  for (let i = 0; i < spots; i += 1) {
    const cx = Math.trunc(rng() * cols)
    const cy = Math.trunc(rng() * rows)
    for (let dy = -2; dy <= 2; dy += 1) {
      const ny = wrap(cy + dy, rows) * cols
      for (let dx = -2; dx <= 2; dx += 1) {
        const idx = ny + wrap(cx + dx, cols)
        u[idx] = 0.5
        v[idx] = 0.25 + rng() * 0.1
      }
    }
  }
  for (let i = 0; i < 160; i += 1) {
    stepGrayScott(u, v, nextU, nextV, field)
  }

  const sync = (): void => {
    for (let i = 0; i < total; i += 1) {
      const val = Math.min(1, (v[i] ?? 0) * 2.6)
      field.intensity[i] = val
      field.phase[i] = val * 0.85
    }
    field.dirty = true
  }
  sync()

  return {
    kind: 'cpu',
    stepMs: 75,
    step: () => {
      stepGrayScott(u, v, nextU, nextV, field)
      stepGrayScott(u, v, nextU, nextV, field)
      sync()
    },
    update: () => {},
  }
}

function stepKuramotoGrid(
  theta: Float32Array,
  next: Float32Array,
  omega: Float32Array,
  field: GridField,
): void {
  const { cols, rows, left, right, up, down } = field
  for (let y = 0; y < rows; y += 1) {
    const yu = up[y] ?? 0
    const y0 = y * cols
    const yd = down[y] ?? 0
    for (let x = 0; x < cols; x += 1) {
      const idx = y0 + x
      const t0 = theta[idx] ?? 0
      const couple =
        Math.sin((theta[y0 + (left[x] ?? 0)] ?? 0) - t0) +
        Math.sin((theta[y0 + (right[x] ?? 0)] ?? 0) - t0) +
        Math.sin((theta[yu + x] ?? 0) - t0) +
        Math.sin((theta[yd + x] ?? 0) - t0)
      next[idx] = wrap(t0 + (omega[idx] ?? 0) + 0.21 * couple, Math.PI * 2)
    }
  }
  theta.set(next)
}

export function createKuramotoEngine(field: GridField): CpuVizEngine {
  const { total } = field
  const rng = createFastRng(total ^ 0x27d4eb2d)
  const theta = Float32Array.from({ length: total }, () => rng() * Math.PI * 2)
  const next = new Float32Array(total)
  const omega = Float32Array.from({ length: total }, () => 0.05 + (rng() - 0.5) * 0.03)

  const step = (): void => {
    stepKuramotoGrid(theta, next, omega, field)
    for (let i = 0; i < total; i += 1) {
      const t = theta[i] ?? 0
      field.intensity[i] = 0.08 + 0.88 * Math.pow(0.5 + 0.5 * Math.sin(t), 1.8)
      field.phase[i] = t * 0.15915494
    }
    field.dirty = true
  }

  for (let i = 0; i < 40; i += 1) {
    step()
  }
  return { kind: 'cpu', stepMs: 55, step, update: () => {} }
}

function sweepIsing(spins: Int8Array, field: GridField, bias: number, rng: () => number): void {
  const { cols, rows, total, left, right, up, down } = field
  const attempts = total * 2
  for (let i = 0; i < attempts; i += 1) {
    const x = Math.trunc(rng() * cols)
    const y = Math.trunc(rng() * rows)
    const y0 = y * cols
    const idx = y0 + x
    const s = spins[idx] ?? 1
    const sum =
      (spins[y0 + (left[x] ?? 0)] ?? 1) +
      (spins[y0 + (right[x] ?? 0)] ?? 1) +
      (spins[(up[y] ?? 0) + x] ?? 1) +
      (spins[(down[y] ?? 0) + x] ?? 1)
    const dE = 2 * s * (sum + bias)
    if (dE <= 0 || rng() < Math.exp(-0.44 * dE)) {
      spins[idx] = -s
    }
  }
}

export function createIsingEngine(field: GridField): CpuVizEngine {
  const { total, cols, rows, right, down } = field
  const rng = createFastRng(total ^ 0x85ebca6b)
  const spins = new Int8Array(total)
  const target = new Float32Array(total)
  for (let i = 0; i < total; i += 1) {
    spins[i] = rng() < 0.5 ? 1 : -1
  }
  for (let i = 0; i < 30; i += 1) {
    sweepIsing(spins, field, 0, rng)
  }

  const sync = (): void => {
    for (let y = 0; y < rows; y += 1) {
      const y0 = y * cols
      const yd = down[y] ?? 0
      for (let x = 0; x < cols; x += 1) {
        const idx = y0 + x
        const s = spins[idx] ?? 1
        const edge = s !== (spins[y0 + (right[x] ?? 0)] ?? 1) || s !== (spins[yd + x] ?? 1)
        target[idx] = edge ? 0.95 : s > 0 ? 0.42 : 0.04
        field.phase[idx] = edge ? 0.12 : s > 0 ? 0.58 : 0.85
      }
    }
    field.dirty = true
  }
  sync()
  field.intensity.set(target)

  return {
    kind: 'cpu',
    stepMs: 85,
    step: (now) => {
      sweepIsing(spins, field, 0.02 * Math.sin(now * 0.0005), rng)
      sync()
    },
    update: () => {
      smoothToward(target, field, 0.2, 0.12)
    },
  }
}

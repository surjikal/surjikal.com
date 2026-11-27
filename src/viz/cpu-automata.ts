import { type CpuVizEngine, type GridField, createFastRng, smoothToward, wrap } from './types'

function countMoore(
  cells: Uint8Array,
  field: GridField,
  x: number,
  y: number,
  target: number,
): number {
  const { cols, left, right, up, down } = field
  const xl = left[x] ?? 0
  const xr = right[x] ?? 0
  const yu = up[y] ?? 0
  const y0 = y * cols
  const yd = down[y] ?? 0
  return (
    ((cells[yu + xl] ?? 0) === target ? 1 : 0) +
    ((cells[yu + x] ?? 0) === target ? 1 : 0) +
    ((cells[yu + xr] ?? 0) === target ? 1 : 0) +
    ((cells[y0 + xl] ?? 0) === target ? 1 : 0) +
    ((cells[y0 + xr] ?? 0) === target ? 1 : 0) +
    ((cells[yd + xl] ?? 0) === target ? 1 : 0) +
    ((cells[yd + x] ?? 0) === target ? 1 : 0) +
    ((cells[yd + xr] ?? 0) === target ? 1 : 0)
  )
}

function stepCyclic(cells: Uint8Array, next: Uint8Array, field: GridField): void {
  const { cols, rows } = field
  for (let y = 0; y < rows; y += 1) {
    const row = y * cols
    for (let x = 0; x < cols; x += 1) {
      const idx = row + x
      const cur = cells[idx] ?? 0
      const succ = (cur + 1) & 7
      next[idx] = countMoore(cells, field, x, y, succ) >= 2 ? succ : cur
    }
  }
  cells.set(next)
}

export function createCyclicEngine(field: GridField): CpuVizEngine {
  const { total } = field
  const rng = createFastRng(total ^ 0x517cc1b7)
  const cells = new Uint8Array(total)
  const next = new Uint8Array(total)
  const target = new Float32Array(total)
  const curve = Float32Array.from(
    { length: 8 },
    (_, s) => 0.08 + 0.92 * (0.5 - 0.5 * Math.cos((s / 8) * Math.PI * 2)),
  )

  for (let i = 0; i < total; i += 1) {
    cells[i] = Math.trunc(rng() * 8)
  }
  for (let i = 0; i < 26; i += 1) {
    stepCyclic(cells, next, field)
  }

  const sync = (): void => {
    for (let i = 0; i < total; i += 1) {
      const s = cells[i] ?? 0
      target[i] = curve[s] ?? 0
      field.phase[i] = s * 0.125
    }
    field.dirty = true
  }
  sync()
  field.intensity.set(target)

  return {
    kind: 'cpu',
    stepMs: 320,
    step: () => {
      stepCyclic(cells, next, field)
      sync()
    },
    update: () => {
      smoothToward(target, field, 0.14, 0.1)
    },
  }
}

function seedBrainCluster(cells: Uint8Array, field: GridField, rng: () => number): void {
  const cx = Math.trunc(rng() * field.cols)
  const cy = Math.trunc(rng() * field.rows)
  for (let dy = -3; dy <= 3; dy += 1) {
    const ny = wrap(cy + dy, field.rows) * field.cols
    for (let dx = -3; dx <= 3; dx += 1) {
      if (rng() < 0.35) {
        cells[ny + wrap(cx + dx, field.cols)] = 1
      }
    }
  }
}

export function createBriansBrainEngine(field: GridField): CpuVizEngine {
  const { total, cols, rows } = field
  const rng = createFastRng(total ^ 0x27d4eb2f)
  const cells = new Uint8Array(total)
  const next = new Uint8Array(total)
  const target = new Float32Array(total)
  for (let i = 0; i < total; i += 1) {
    cells[i] = rng() < 0.12 ? 1 : 0
  }

  const sync = (): void => {
    for (let i = 0; i < total; i += 1) {
      const c = cells[i] ?? 0
      target[i] = c === 1 ? 1 : c === 2 ? 0.42 : 0
      field.phase[i] = c === 1 ? 0.15 : c === 2 ? 0.65 : 0
    }
    field.dirty = true
  }
  sync()
  field.intensity.set(target)

  return {
    kind: 'cpu',
    stepMs: 360,
    step: () => {
      let firing = 0
      for (let y = 0; y < rows; y += 1) {
        const row = y * cols
        for (let x = 0; x < cols; x += 1) {
          const idx = row + x
          const c = cells[idx] ?? 0
          const val = c === 1 ? 2 : c === 2 ? 0 : countMoore(cells, field, x, y, 1) === 2 ? 1 : 0
          next[idx] = val
          firing += val === 1 ? 1 : 0
        }
      }
      cells.set(next)
      if (firing < total * 0.015) {
        seedBrainCluster(cells, field, rng)
      }
      sync()
    },
    update: () => {
      smoothToward(target, field, 0.16, 0.06)
    },
  }
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

export function createSandpileEngine(field: GridField): CpuVizEngine {
  const { cols, rows, total } = field
  const grains = new Uint8Array(total).fill(2)
  const next = new Uint8Array(total)
  const midX = Math.trunc(cols * 0.5)
  const midY = Math.trunc(rows * 0.5)
  const anchors = [
    midY * cols + Math.trunc(cols * 0.35),
    midY * cols + Math.trunc(cols * 0.65),
    Math.trunc(rows * 0.35) * cols + midX,
    Math.trunc(rows * 0.65) * cols + midX,
  ]

  const dropAndRelax = (): void => {
    for (const idx of anchors) {
      grains[idx] = (grains[idx] ?? 0) + 2
    }
    for (let pass = 0; pass < 16; pass += 1) {
      toppleSandpile(grains, next, cols, rows)
    }
  }
  for (let i = 0; i < 80; i += 1) {
    dropAndRelax()
  }

  const sync = (): void => {
    for (let i = 0; i < total; i += 1) {
      const g = grains[i] ?? 0
      field.intensity[i] = g >= 4 ? 1 : g * 0.26
      field.phase[i] = g * 0.22
    }
    field.dirty = true
  }
  sync()

  return {
    kind: 'cpu',
    stepMs: 90,
    step: () => {
      dropAndRelax()
      sync()
    },
    update: () => {},
  }
}

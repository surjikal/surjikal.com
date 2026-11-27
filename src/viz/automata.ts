import {
  type GridField,
  type VizEngine,
  countMatchingNeighbors,
  seedRandomCells,
  smoothToward,
  wrap,
} from './types'

function stepCyclicCells(cells: Uint8Array, next: Uint8Array, cols: number, rows: number): void {
  for (let y = 0; y < rows; y += 1) {
    const row = y * cols
    for (let x = 0; x < cols; x += 1) {
      const idx = row + x
      const current = cells[idx] ?? 0
      const successor = (current + 1) % 8
      next[idx] =
        countMatchingNeighbors(cells, cols, rows, x, y, successor) >= 2 ? successor : current
    }
  }
  cells.set(next)
}

export function createCyclicEngine(field: GridField): VizEngine {
  const total = field.cols * field.rows
  const cells = new Uint8Array(total)
  const next = new Uint8Array(total)
  const target = new Float32Array(total)
  const curve = Array.from(
    { length: 8 },
    (_, s) => 0.08 + 0.92 * (0.5 - 0.5 * Math.cos((s / 8) * Math.PI * 2)),
  )

  for (let i = 0; i < total; i += 1) {
    cells[i] = Math.floor(Math.random() * 8)
  }
  for (let i = 0; i < 28; i += 1) {
    stepCyclicCells(cells, next, field.cols, field.rows)
  }

  const sync = (): void => {
    for (let i = 0; i < total; i += 1) {
      const s = cells[i] ?? 0
      target[i] = curve[s] ?? 0
      field.phase[i] = s / 8
    }
  }

  sync()
  field.intensity.set(target)

  return {
    stepMs: 320,
    step: () => {
      stepCyclicCells(cells, next, field.cols, field.rows)
      sync()
    },
    update: () => {
      smoothToward(target, field.intensity, 0.14, 0.1)
    },
  }
}

function seedBrainCluster(cells: Uint8Array, cols: number, rows: number): void {
  const cx = Math.floor(Math.random() * cols)
  const cy = Math.floor(Math.random() * rows)
  for (let dy = -3; dy <= 3; dy += 1) {
    const ny = wrap(cy + dy, rows) * cols
    for (let dx = -3; dx <= 3; dx += 1) {
      if (Math.random() < 0.35) {
        cells[ny + wrap(cx + dx, cols)] = 1
      }
    }
  }
}

function nextBrainState(cell: number, neighbors: number): number {
  if (cell === 1) {
    return 2
  }
  if (cell === 2) {
    return 0
  }
  return neighbors === 2 ? 1 : 0
}

export function createBriansBrainEngine(field: GridField): VizEngine {
  const total = field.cols * field.rows
  const cells = new Uint8Array(total)
  const next = new Uint8Array(total)
  const target = new Float32Array(total)
  seedRandomCells(cells, 0.12)

  const sync = (): void => {
    for (let i = 0; i < total; i += 1) {
      const c = cells[i] ?? 0
      target[i] = c === 1 ? 1 : c === 2 ? 0.42 : 0
      field.phase[i] = c === 1 ? 0.15 : c === 2 ? 0.65 : 0
    }
  }

  sync()
  field.intensity.set(target)

  return {
    stepMs: 380,
    step: () => {
      const { cols, rows } = field
      let firing = 0
      for (let y = 0; y < rows; y += 1) {
        const row = y * cols
        for (let x = 0; x < cols; x += 1) {
          const idx = row + x
          const val = nextBrainState(
            cells[idx] ?? 0,
            countMatchingNeighbors(cells, cols, rows, x, y, 1),
          )
          next[idx] = val
          if (val === 1) {
            firing += 1
          }
        }
      }
      cells.set(next)
      if (firing < total * 0.015) {
        seedBrainCluster(cells, cols, rows)
      }
      sync()
    },
    update: () => {
      smoothToward(target, field.intensity, 0.16, 0.06)
    },
  }
}

export function createLifeEngine(field: GridField): VizEngine {
  const total = field.cols * field.rows
  const cells = new Uint8Array(total)
  const next = new Uint8Array(total)
  const target = new Float32Array(total)
  seedRandomCells(cells, 0.24)

  const sync = (): void => {
    for (let i = 0; i < total; i += 1) {
      const alive = (cells[i] ?? 0) === 1
      target[i] = alive ? 0.95 : 0
      field.phase[i] = alive ? 0.3 : 0.75
    }
  }

  sync()
  field.intensity.set(target)

  return {
    stepMs: 320,
    step: () => {
      const { cols, rows } = field
      let aliveCount = 0
      for (let y = 0; y < rows; y += 1) {
        const row = y * cols
        for (let x = 0; x < cols; x += 1) {
          const idx = row + x
          const n = countMatchingNeighbors(cells, cols, rows, x, y, 1)
          const alive = (cells[idx] ?? 0) === 1
          const val = alive ? (n === 2 || n === 3 ? 1 : 0) : n === 3 ? 1 : 0
          next[idx] = val
          if (val === 1) {
            aliveCount += 1
          }
        }
      }
      cells.set(next)
      if (aliveCount < total * 0.03) {
        seedRandomCells(cells, 0.14)
      }
      sync()
    },
    update: () => {
      smoothToward(target, field.intensity, 0.18, 0.05)
    },
  }
}

function ringAverage(grid: Float32Array, cols: number, rows: number, x: number, y: number): number {
  let sum = 0
  let count = 0
  for (let dy = -2; dy <= 2; dy += 1) {
    const ny = wrap(y + dy, rows) * cols
    for (let dx = -2; dx <= 2; dx += 1) {
      const dist = Math.hypot(dx, dy)
      if (dist >= 1 && dist <= 2.4) {
        sum += grid[ny + wrap(x + dx, cols)] ?? 0
        count += 1
      }
    }
  }
  return count > 0 ? sum / count : 0
}

export function createLeniaEngine(field: GridField): VizEngine {
  const total = field.cols * field.rows
  const grid = new Float32Array(total)
  const next = new Float32Array(total)
  for (let i = 0; i < total; i += 1) {
    grid[i] = Math.random() < 0.38 ? Math.random() : 0
  }

  const iterate = (): void => {
    const { cols, rows } = field
    for (let y = 0; y < rows; y += 1) {
      const row = y * cols
      for (let x = 0; x < cols; x += 1) {
        const avg = ringAverage(grid, cols, rows, x, y)
        const growth = Math.exp(-Math.pow((avg - 0.28) / 0.09, 2)) * 2 - 1
        const idx = row + x
        next[idx] = Math.min(1, Math.max(0, (grid[idx] ?? 0) + 0.14 * growth))
      }
    }
    grid.set(next)
  }

  for (let i = 0; i < 16; i += 1) {
    iterate()
  }

  const sync = (): void => {
    field.intensity.set(grid)
    field.phase.set(grid)
  }

  sync()
  return {
    stepMs: 120,
    step: () => {
      iterate()
      sync()
    },
    update: () => {},
  }
}

export function createDunesEngine(field: GridField): VizEngine {
  const total = field.cols * field.rows
  const heightMap = new Float32Array(total)
  const next = new Float32Array(total)
  for (let i = 0; i < total; i += 1) {
    heightMap[i] = Math.random()
  }

  const iterate = (): void => {
    const { cols, rows } = field
    for (let y = 0; y < rows; y += 1) {
      const row = y * cols
      const prevRow = wrap(y - 1, rows) * cols
      for (let x = 0; x < cols; x += 1) {
        const idx = row + x
        const upwind = heightMap[prevRow + wrap(x - 1, cols)] ?? 0
        const neighbor = heightMap[row + wrap(x - 1, cols)] ?? 0
        const mixed = (heightMap[idx] ?? 0) * 0.55 + upwind * 0.3 + neighbor * 0.15
        next[idx] = mixed > 0.72 ? mixed - 0.38 : mixed + 0.018
      }
    }
    heightMap.set(next)
  }

  for (let i = 0; i < 20; i += 1) {
    iterate()
  }

  const sync = (): void => {
    field.intensity.set(heightMap)
    field.phase.set(heightMap)
  }

  sync()
  return {
    stepMs: 140,
    step: () => {
      iterate()
      sync()
    },
    update: () => {},
  }
}

export const CELL_SIZE = 16

export interface GridField {
  cols: number
  rows: number
  intensity: Float32Array
  phase: Float32Array
}

export interface VizEngine {
  readonly stepMs: number
  step(now: number): void
  update(now: number): void
}

export function createGridField(width: number, height: number): GridField {
  const cols = Math.max(8, Math.ceil(width / CELL_SIZE))
  const rows = Math.max(8, Math.ceil(height / CELL_SIZE))
  const total = cols * rows
  return {
    cols,
    rows,
    intensity: new Float32Array(total),
    phase: new Float32Array(total),
  }
}

export function wrap(value: number, limit: number): number {
  const mod = value % limit
  return mod < 0 ? mod + limit : mod
}

export function countMatchingNeighbors(
  cells: Uint8Array,
  cols: number,
  rows: number,
  x: number,
  y: number,
  target: number,
): number {
  let sum = 0
  for (let dy = -1; dy <= 1; dy += 1) {
    const ny = wrap(y + dy, rows) * cols
    for (let dx = -1; dx <= 1; dx += 1) {
      if ((dx !== 0 || dy !== 0) && (cells[ny + wrap(x + dx, cols)] ?? 0) === target) {
        sum += 1
      }
    }
  }
  return sum
}

export function smoothToward(
  targetArr: Float32Array,
  currentArr: Float32Array,
  upRate: number,
  downRate: number,
): void {
  for (let i = 0; i < currentArr.length; i += 1) {
    const target = targetArr[i] ?? 0
    const current = currentArr[i] ?? 0
    const rate = target > current ? upRate : downRate
    currentArr[i] = current + (target - current) * rate
  }
}

export function seedRandomCells(cells: Uint8Array, density: number): void {
  for (let i = 0; i < cells.length; i += 1) {
    if (Math.random() < density) {
      cells[i] = 1
    }
  }
}

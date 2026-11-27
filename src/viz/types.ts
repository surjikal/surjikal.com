export interface GridField {
  readonly cols: number
  readonly rows: number
  readonly total: number
  readonly cellSize: number
  readonly left: Int32Array
  readonly right: Int32Array
  readonly up: Int32Array
  readonly down: Int32Array
  readonly intensity: Float32Array
  readonly phase: Float32Array
  readonly rgBytes: Uint8Array
  dirty: boolean
}

export interface CpuVizEngine {
  readonly kind: 'cpu'
  readonly stepMs: number
  readonly step: (simTime: number) => void
  readonly update: (simTime: number) => void
}

export interface GpuVizEngine {
  readonly kind: 'gpu'
  readonly fragmentSource: string
  readonly updateUniforms?: (
    gl: WebGL2RenderingContext,
    program: WebGLProgram,
    simTime: number,
  ) => void
}

export type VizEngine = CpuVizEngine | GpuVizEngine

export function wrap(value: number, limit: number): number {
  const mod = value % limit
  return mod < 0 ? mod + limit : mod
}

export function createGridField(width: number, height: number, cellSize: number): GridField {
  const cols = Math.max(8, Math.ceil(width / cellSize))
  const rows = Math.max(8, Math.ceil(height / cellSize))
  const total = cols * rows
  const left = new Int32Array(cols)
  const right = new Int32Array(cols)
  const up = new Int32Array(rows)
  const down = new Int32Array(rows)

  for (let x = 0; x < cols; x += 1) {
    left[x] = wrap(x - 1, cols)
    right[x] = wrap(x + 1, cols)
  }
  for (let y = 0; y < rows; y += 1) {
    up[y] = wrap(y - 1, rows) * cols
    down[y] = wrap(y + 1, rows) * cols
  }

  return {
    cols,
    rows,
    total,
    cellSize,
    left,
    right,
    up,
    down,
    intensity: new Float32Array(total),
    phase: new Float32Array(total),
    rgBytes: new Uint8Array(total * 2),
    dirty: true,
  }
}

export function packFieldToRgBytes(field: GridField): Uint8Array {
  const { total, intensity, phase, rgBytes } = field
  for (let i = 0; i < total; i += 1) {
    const clampedV = Math.min(1, Math.max(0, intensity[i] ?? 0))
    const p = phase[i] ?? 0
    const wrappedP = p - Math.floor(p)
    const offset = i * 2
    rgBytes[offset] = Math.trunc(clampedV * 255 + 0.5)
    rgBytes[offset + 1] = Math.trunc(wrappedP * 255 + 0.5)
  }
  return rgBytes
}

export function smoothToward(
  targetArr: Float32Array,
  field: GridField,
  upRate: number,
  downRate: number,
): void {
  const currentArr = field.intensity
  for (let i = 0; i < currentArr.length; i += 1) {
    const target = targetArr[i] ?? 0
    const current = currentArr[i] ?? 0
    const rate = target > current ? upRate : downRate
    currentArr[i] = current + (target - current) * rate
  }
  field.dirty = true
}

export function createFastRng(seed = 0x9e3779b9): () => number {
  let state = Math.trunc(seed) || 1
  return () => {
    state ^= state << 13
    state ^= state >>> 17
    state ^= state << 5
    return (state >>> 0) / 4294967296
  }
}

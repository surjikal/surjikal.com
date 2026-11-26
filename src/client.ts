/// <reference lib="dom" />

const CELL_SIZE = 16
const DOT_SIZE = 2
const SUB_GRID = 4
const STEP_INTERVAL_MS = 400
const FRAME_INTERVAL_MS = 40
const INITIAL_DENSITY = 0.12
const DOT_COLOR = 'rgba(243, 240, 234, 0.24)'

const BAYER_4X4 = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => v / 16)

interface LifeState {
  cols: number
  rows: number
  cells: Uint8Array
  next: Uint8Array
  intensity: Float32Array
}

function createLifeState(width: number, height: number): LifeState {
  const cols = Math.max(8, Math.ceil(width / CELL_SIZE))
  const rows = Math.max(8, Math.ceil(height / CELL_SIZE))
  const total = cols * rows
  const cells = new Uint8Array(total)
  const intensity = new Float32Array(total)

  for (let i = 0; i < total; i += 1) {
    const alive = Math.random() < INITIAL_DENSITY ? 1 : 0
    cells[i] = alive
    intensity[i] = alive
  }

  return {
    cols,
    rows,
    cells,
    next: new Uint8Array(total),
    intensity,
  }
}

function countFiringNeighbors(state: LifeState, x: number, y: number): number {
  const { cols, rows, cells } = state
  let sum = 0

  for (let dy = -1; dy <= 1; dy += 1) {
    const ny = (y + dy + rows) % rows
    const rowOffset = ny * cols
    for (let dx = -1; dx <= 1; dx += 1) {
      if (dx === 0 && dy === 0) {
        continue
      }
      const nx = (x + dx + cols) % cols
      if ((cells[rowOffset + nx] ?? 0) === 1) {
        sum += 1
      }
    }
  }

  return sum
}

function seedCluster(state: LifeState): void {
  const { cols, rows, cells } = state
  const cx = Math.floor(Math.random() * cols)
  const cy = Math.floor(Math.random() * rows)

  for (let dy = -3; dy <= 3; dy += 1) {
    const ny = (cy + dy + rows) % rows
    for (let dx = -3; dx <= 3; dx += 1) {
      if (Math.random() < 0.35) {
        const nx = (cx + dx + cols) % cols
        cells[ny * cols + nx] = 1
      }
    }
  }
}

function nextCellState(current: number, firingNeighbors: number): number {
  if (current === 1) {
    return 2
  }
  if (current === 2) {
    return 0
  }
  return firingNeighbors === 2 ? 1 : 0
}

function stepLife(state: LifeState): void {
  const { cols, rows, cells, next } = state
  let firingCount = 0

  for (let y = 0; y < rows; y += 1) {
    const rowOffset = y * cols
    for (let x = 0; x < cols; x += 1) {
      const idx = rowOffset + x
      const value = nextCellState(cells[idx] ?? 0, countFiringNeighbors(state, x, y))
      next[idx] = value
      if (value === 1) {
        firingCount += 1
      }
    }
  }

  state.cells.set(next)

  if (firingCount < cols * rows * 0.015) {
    seedCluster(state)
  }
}

function targetIntensity(cell: number): number {
  if (cell === 1) {
    return 1
  }
  if (cell === 2) {
    return 0.42
  }
  return 0
}

function updateIntensity(state: LifeState): void {
  const { cells, intensity } = state
  for (let i = 0; i < cells.length; i += 1) {
    const target = targetIntensity(cells[i] ?? 0)
    const current = intensity[i] ?? 0
    const rate = target > current ? 0.16 : 0.06
    intensity[i] = current + (target - current) * rate
  }
}

function drawCellDither(
  ctx: CanvasRenderingContext2D,
  baseX: number,
  baseY: number,
  value: number,
): void {
  const step = CELL_SIZE / SUB_GRID

  for (let sy = 0; sy < SUB_GRID; sy += 1) {
    const bayerRow = sy * SUB_GRID
    const py = baseY + sy * step
    for (let sx = 0; sx < SUB_GRID; sx += 1) {
      const threshold = BAYER_4X4[bayerRow + sx] ?? 1
      if (value > threshold) {
        ctx.fillRect(baseX + sx * step, py, DOT_SIZE, DOT_SIZE)
      }
    }
  }
}

function drawDitheredLife(
  ctx: CanvasRenderingContext2D,
  state: LifeState,
  width: number,
  height: number,
): void {
  ctx.clearRect(0, 0, width, height)
  ctx.fillStyle = DOT_COLOR

  const { cols, rows, intensity } = state

  for (let y = 0; y < rows; y += 1) {
    const rowOffset = y * cols
    const baseY = y * CELL_SIZE

    for (let x = 0; x < cols; x += 1) {
      const value = intensity[rowOffset + x] ?? 0
      if (value >= 0.04) {
        drawCellDither(ctx, x * CELL_SIZE, baseY, value)
      }
    }
  }
}

function startAnimationLoop(
  ctx: CanvasRenderingContext2D,
  getViewport: () => { state: LifeState; width: number; height: number },
): void {
  let lastStep = performance.now()
  let lastFrame = lastStep
  let rafId = 0

  const tick = (now: number): void => {
    if (!document.hidden) {
      const { state, width, height } = getViewport()
      if (now - lastStep >= STEP_INTERVAL_MS) {
        stepLife(state)
        lastStep = now
      }
      if (now - lastFrame >= FRAME_INTERVAL_MS) {
        updateIntensity(state)
        drawDitheredLife(ctx, state, width, height)
        lastFrame = now
      }
    }
    rafId = window.requestAnimationFrame(tick)
  }

  rafId = window.requestAnimationFrame(tick)

  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      lastStep = performance.now()
      lastFrame = lastStep
    }
  })

  window.addEventListener('pagehide', () => {
    window.cancelAnimationFrame(rafId)
  })
}

function initBackgroundLife(): void {
  const canvas = document.querySelector<HTMLCanvasElement>('.bg-life')
  if (!canvas) {
    return
  }

  const ctx = canvas.getContext('2d')
  if (!ctx) {
    return
  }

  let width = 0
  let height = 0
  let state = createLifeState(window.innerWidth, window.innerHeight)

  const resize = (): void => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    width = window.innerWidth
    height = window.innerHeight
    canvas.width = Math.floor(width * dpr)
    canvas.height = Math.floor(height * dpr)
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    state = createLifeState(width, height)
    drawDitheredLife(ctx, state, width, height)
  }

  resize()
  window.addEventListener('resize', resize, { passive: true })

  if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    startAnimationLoop(ctx, () => ({ state, width, height }))
  }
}

initBackgroundLife()

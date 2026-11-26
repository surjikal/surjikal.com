/// <reference lib="dom" />

const CELL_SIZE = 16
const DOT_SIZE = 2
const SUB_GRID = 4
const STATES = 8
const THRESHOLD = 2
const WARMUP_STEPS = 28
const STEP_INTERVAL_MS = 320
const FRAME_INTERVAL_MS = 40
const HUE_BUCKETS = 24
const HUE_DRIFT_SPEED = 0.000018

const BAYER_4X4 = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => v / 16)

const IRIDESCENT_PALETTE = Array.from({ length: HUE_BUCKETS }, (_, index) => {
  const hue = Math.round((index / HUE_BUCKETS) * 360)
  return `hsla(${hue}, 14%, 87%, 0.22)`
})

const STATE_INTENSITY = Array.from({ length: STATES }, (_, state) => {
  const wave = 0.5 - 0.5 * Math.cos((state / STATES) * Math.PI * 2)
  return 0.08 + 0.92 * wave
})

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
    cells[i] = Math.floor(Math.random() * STATES)
  }

  const state: LifeState = {
    cols,
    rows,
    cells,
    next: new Uint8Array(total),
    intensity,
  }

  for (let step = 0; step < WARMUP_STEPS; step += 1) {
    stepCyclic(state)
  }

  for (let i = 0; i < total; i += 1) {
    intensity[i] = STATE_INTENSITY[cells[i] ?? 0] ?? 0
  }

  return state
}

function countSuccessorNeighbors(
  state: LifeState,
  x: number,
  y: number,
  successor: number,
): number {
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
      if ((cells[rowOffset + nx] ?? 0) === successor) {
        sum += 1
        if (sum >= THRESHOLD) {
          return sum
        }
      }
    }
  }

  return sum
}

function stepCyclic(state: LifeState): void {
  const { cols, rows, cells, next } = state

  for (let y = 0; y < rows; y += 1) {
    const rowOffset = y * cols
    for (let x = 0; x < cols; x += 1) {
      const idx = rowOffset + x
      const current = cells[idx] ?? 0
      const successor = (current + 1) % STATES
      const neighbors = countSuccessorNeighbors(state, x, y, successor)
      next[idx] = neighbors >= THRESHOLD ? successor : current
    }
  }

  state.cells.set(next)
}

function updateIntensity(state: LifeState): void {
  const { cells, intensity } = state
  for (let i = 0; i < cells.length; i += 1) {
    const target = STATE_INTENSITY[cells[i] ?? 0] ?? 0
    const current = intensity[i] ?? 0
    intensity[i] = current + (target - current) * 0.12
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

function pickPaletteColor(cell: number, x: number, y: number, timePhase: number): string {
  const phase = (cell / STATES + x * 0.009 + y * 0.007 + timePhase) % 1
  const normalized = phase < 0 ? phase + 1 : phase
  const bucket = Math.floor(normalized * HUE_BUCKETS) % HUE_BUCKETS
  return IRIDESCENT_PALETTE[bucket] ?? 'hsla(0, 14%, 87%, 0.22)'
}

function drawDitheredLife(
  ctx: CanvasRenderingContext2D,
  state: LifeState,
  width: number,
  height: number,
  now: number,
): void {
  ctx.clearRect(0, 0, width, height)

  const { cols, rows, cells, intensity } = state
  const timePhase = (now * HUE_DRIFT_SPEED) % 1

  for (let y = 0; y < rows; y += 1) {
    const rowOffset = y * cols
    const baseY = y * CELL_SIZE

    for (let x = 0; x < cols; x += 1) {
      const idx = rowOffset + x
      const value = intensity[idx] ?? 0
      if (value >= 0.05) {
        ctx.fillStyle = pickPaletteColor(cells[idx] ?? 0, x, y, timePhase)
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
        stepCyclic(state)
        lastStep = now
      }
      if (now - lastFrame >= FRAME_INTERVAL_MS) {
        updateIntensity(state)
        drawDitheredLife(ctx, state, width, height, now)
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
    drawDitheredLife(ctx, state, width, height, performance.now())
  }

  resize()
  window.addEventListener('resize', resize, { passive: true })

  if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    startAnimationLoop(ctx, () => ({ state, width, height }))
  }
}

initBackgroundLife()

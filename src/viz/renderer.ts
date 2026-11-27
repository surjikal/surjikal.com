/// <reference lib="dom" />

import { CELL_SIZE, type GridField, wrap } from './types'

const DOT_SIZE = 2
const SUB_GRID = 4
const HUE_BUCKETS = 24
const HUE_DRIFT_SPEED = 0.000018

const BAYER_4X4 = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => v / 16)

const IRIDESCENT_PALETTE = Array.from({ length: HUE_BUCKETS }, (_, index) => {
  const hue = Math.round((index / HUE_BUCKETS) * 360)
  return `hsla(${hue}, 14%, 87%, 0.22)`
})

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
      if (value > (BAYER_4X4[bayerRow + sx] ?? 1)) {
        ctx.fillRect(baseX + sx * step, py, DOT_SIZE, DOT_SIZE)
      }
    }
  }
}

function pickPaletteColor(phaseVal: number, x: number, y: number, timePhase: number): string {
  const normalized = wrap(phaseVal + x * 0.009 + y * 0.007 + timePhase, 1)
  const bucket = Math.floor(normalized * HUE_BUCKETS) % HUE_BUCKETS
  return IRIDESCENT_PALETTE[bucket] ?? 'hsla(0, 14%, 87%, 0.22)'
}

export function drawDitheredField(
  ctx: CanvasRenderingContext2D,
  field: GridField,
  width: number,
  height: number,
  now: number,
): void {
  ctx.clearRect(0, 0, width, height)
  const { cols, rows, intensity, phase } = field
  const timePhase = (now * HUE_DRIFT_SPEED) % 1

  for (let y = 0; y < rows; y += 1) {
    const rowOffset = y * cols
    const baseY = y * CELL_SIZE
    for (let x = 0; x < cols; x += 1) {
      const idx = rowOffset + x
      const value = intensity[idx] ?? 0
      if (value >= 0.05) {
        ctx.fillStyle = pickPaletteColor(phase[idx] ?? 0, x, y, timePhase)
        drawCellDither(ctx, x * CELL_SIZE, baseY, value)
      }
    }
  }
}

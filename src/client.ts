/// <reference lib="dom" />

import { VIZ_MODES, type VizModeId } from './viz-modes'
import {
  createBriansBrainEngine,
  createCyclicEngine,
  createDunesEngine,
  createLeniaEngine,
  createLifeEngine,
} from './viz/automata'
import {
  createFlowEngine,
  createGrayScottEngine,
  createRainEngine,
  createVoronoiEngine,
  createWavesEngine,
} from './viz/fields'
import { drawDitheredField } from './viz/renderer'
import { type GridField, type VizEngine, createGridField, wrap } from './viz/types'

const FRAME_INTERVAL_MS = 40
const STORAGE_KEY = 'surj-viz-mode'

const ENGINE_FACTORIES: Record<VizModeId, (field: GridField) => VizEngine> = {
  cyclic: createCyclicEngine,
  'brians-brain': createBriansBrainEngine,
  life: createLifeEngine,
  'gray-scott': createGrayScottEngine,
  waves: createWavesEngine,
  flow: createFlowEngine,
  lenia: createLeniaEngine,
  dunes: createDunesEngine,
  voronoi: createVoronoiEngine,
  rain: createRainEngine,
}

function resolveInitialMode(): VizModeId {
  const param = new URLSearchParams(window.location.search).get('viz')
  const fromParam = VIZ_MODES.find((mode) => mode.id === param)
  if (fromParam) {
    return fromParam.id
  }

  try {
    const saved = window.localStorage.getItem(STORAGE_KEY)
    const fromStorage = VIZ_MODES.find((mode) => mode.id === saved)
    if (fromStorage) {
      return fromStorage.id
    }
  } catch {
    // Ignore storage access errors in restricted contexts
  }

  return VIZ_MODES[0]?.id ?? 'cyclic'
}

function persistMode(mode: VizModeId): void {
  const url = new URL(window.location.href)
  url.searchParams.set('viz', mode)
  window.history.replaceState(null, '', url)

  try {
    window.localStorage.setItem(STORAGE_KEY, mode)
  } catch {
    // Ignore storage access errors in restricted contexts
  }
}

function startLoop(
  ctx: CanvasRenderingContext2D,
  getContext: () => { field: GridField; engine: VizEngine; width: number; height: number },
): void {
  let lastStep = performance.now()
  let lastFrame = lastStep
  let rafId = 0

  const tick = (now: number): void => {
    if (!document.hidden) {
      const { field, engine, width, height } = getContext()
      if (now - lastStep >= engine.stepMs) {
        engine.step(now)
        lastStep = now
      }
      if (now - lastFrame >= FRAME_INTERVAL_MS) {
        engine.update(now)
        drawDitheredField(ctx, field, width, height, now)
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

function bindControls(
  mode: VizModeId,
  onSelect: (nextMode: VizModeId) => void,
  onCycle: (delta: number) => void,
): { sync: (current: VizModeId) => void } {
  const select = document.querySelector('.viz-select')
  const buttons = document.querySelectorAll('[data-viz-dir]')

  if (select instanceof HTMLSelectElement) {
    select.value = mode
    select.addEventListener('change', () => {
      const selected = VIZ_MODES.find((item) => item.id === select.value)
      if (selected) {
        onSelect(selected.id)
      }
    })
  }

  for (const button of buttons) {
    if (button instanceof HTMLButtonElement) {
      button.addEventListener('click', () => {
        const dir = Number(button.dataset['vizDir'] ?? 1)
        onCycle(dir < 0 ? -1 : 1)
      })
    }
  }

  window.addEventListener('keydown', (event) => {
    if (event.target instanceof HTMLSelectElement || event.target instanceof HTMLInputElement) {
      return
    }
    if (event.key === '[') {
      onCycle(-1)
    } else if (event.key === ']') {
      onCycle(1)
    }
  })

  return {
    sync: (current: VizModeId) => {
      if (select instanceof HTMLSelectElement) {
        select.value = current
      }
    },
  }
}

function buildEngine(
  ctx: CanvasRenderingContext2D,
  mode: VizModeId,
  width: number,
  height: number,
): { field: GridField; engine: VizEngine } {
  const field = createGridField(width, height)
  const engine = ENGINE_FACTORIES[mode](field)
  const now = performance.now()
  engine.update(now)
  drawDitheredField(ctx, field, width, height, now)
  return { field, engine }
}

function getCanvasContext(): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } | null {
  const canvas = document.querySelector('.bg-life')
  if (!(canvas instanceof HTMLCanvasElement)) {
    return null
  }
  const ctx = canvas.getContext('2d')
  return ctx === null ? null : { canvas, ctx }
}

function initBackgroundViz(): void {
  const target = getCanvasContext()
  if (target === null) {
    return
  }
  const { canvas, ctx } = target

  let mode: VizModeId = resolveInitialMode()
  let width = 0
  let height = 0
  let field = createGridField(window.innerWidth, window.innerHeight)
  let engine = ENGINE_FACTORIES[mode](field)

  const applyMode = (nextMode: VizModeId): void => {
    if (nextMode === mode) {
      return
    }
    mode = nextMode
    persistMode(mode)
    controls.sync(mode)
    ;({ field, engine } = buildEngine(ctx, mode, width, height))
  }

  const controls = bindControls(mode, applyMode, (delta) => {
    const currentIdx = VIZ_MODES.findIndex((item) => item.id === mode)
    const nextItem = VIZ_MODES[wrap(currentIdx + delta, VIZ_MODES.length)]
    if (nextItem) {
      applyMode(nextItem.id)
    }
  })

  const resize = (): void => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    width = window.innerWidth
    height = window.innerHeight
    canvas.width = Math.floor(width * dpr)
    canvas.height = Math.floor(height * dpr)
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ;({ field, engine } = buildEngine(ctx, mode, width, height))
  }

  resize()
  window.addEventListener('resize', resize, { passive: true })

  if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    startLoop(ctx, () => ({ field, engine, width, height }))
  }
}

initBackgroundViz()

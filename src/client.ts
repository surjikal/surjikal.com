/// <reference lib="dom" />

import { SPEED_PRESETS, type SpeedPresetId, VIZ_MODES, type VizModeId } from './viz-modes'
import {
  createBriansBrainEngine,
  createCyclicEngine,
  createDunesEngine,
  createLeniaEngine,
  createLifeEngine,
} from './viz/automata'
import { type VizPrefs, bindControls, persistPrefs, resolveInitialPrefs } from './viz/controls'
import {
  createFlowEngine,
  createGrayScottEngine,
  createRainEngine,
  createVoronoiEngine,
  createWavesEngine,
} from './viz/fields'
import { buildPalette, drawDitheredField } from './viz/renderer'
import { type GridField, type VizEngine, createGridField, wrap } from './viz/types'

const FRAME_INTERVAL_MS = 40

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

interface RuntimeState {
  width: number
  height: number
  field: GridField
  engine: VizEngine
  palette: readonly string[]
  speedMultiplier: number
}

function getSpeedMultiplier(speedId: SpeedPresetId): number {
  return SPEED_PRESETS.find((item) => item.id === speedId)?.multiplier ?? 1
}

function createRuntimeState(prefs: VizPrefs): RuntimeState {
  const width = window.innerWidth
  const height = window.innerHeight
  const field = createGridField(width, height)
  return {
    width,
    height,
    field,
    engine: ENGINE_FACTORIES[prefs.mode](field),
    palette: buildPalette(prefs.color),
    speedMultiplier: getSpeedMultiplier(prefs.speed),
  }
}

function redrawState(ctx: CanvasRenderingContext2D, state: RuntimeState): void {
  const now = performance.now()
  state.engine.update(now)
  drawDitheredField(ctx, state.field, state.palette, state.width, state.height, now)
}

function startLoop(ctx: CanvasRenderingContext2D, getState: () => RuntimeState): void {
  let lastReal = performance.now()
  let simTime = lastReal
  let lastStepSim = simTime
  let lastFrameReal = lastReal
  let rafId = 0

  const tick = (now: number): void => {
    if (!document.hidden) {
      const state = getState()
      const dt = Math.min(100, Math.max(0, now - lastReal))
      simTime += dt * state.speedMultiplier
      if (simTime - lastStepSim >= state.engine.stepMs) {
        state.engine.step(simTime)
        lastStepSim = simTime
      }
      if (now - lastFrameReal >= FRAME_INTERVAL_MS) {
        state.engine.update(simTime)
        drawDitheredField(ctx, state.field, state.palette, state.width, state.height, simTime)
        lastFrameReal = now
      }
    }
    lastReal = now
    rafId = window.requestAnimationFrame(tick)
  }

  rafId = window.requestAnimationFrame(tick)
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      lastReal = performance.now()
      lastFrameReal = lastReal
    }
  })
  window.addEventListener('pagehide', () => {
    window.cancelAnimationFrame(rafId)
  })
}

function initBackgroundViz(): void {
  const canvas = document.querySelector('.bg-life')
  const ctx = canvas instanceof HTMLCanvasElement ? canvas.getContext('2d') : null
  if (!(canvas instanceof HTMLCanvasElement) || ctx === null) {
    return
  }

  const prefs = resolveInitialPrefs()
  const state = createRuntimeState(prefs)

  const applyPrefs = (patch: Partial<VizPrefs>): void => {
    const modeChanged = patch.mode !== undefined && patch.mode !== prefs.mode
    Object.assign(prefs, patch)
    persistPrefs(prefs)
    controls.sync(prefs)
    state.palette = buildPalette(prefs.color)
    state.speedMultiplier = getSpeedMultiplier(prefs.speed)
    if (modeChanged) {
      state.field = createGridField(state.width, state.height)
      state.engine = ENGINE_FACTORIES[prefs.mode](state.field)
    }
    redrawState(ctx, state)
  }

  const controls = bindControls(prefs, applyPrefs, (delta) => {
    const idx = VIZ_MODES.findIndex((item) => item.id === prefs.mode)
    const nextItem = VIZ_MODES[wrap(idx + delta, VIZ_MODES.length)]
    if (nextItem) {
      applyPrefs({ mode: nextItem.id })
    }
  })

  const resize = (): void => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    state.width = window.innerWidth
    state.height = window.innerHeight
    canvas.width = Math.floor(state.width * dpr)
    canvas.height = Math.floor(state.height * dpr)
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    state.field = createGridField(state.width, state.height)
    state.engine = ENGINE_FACTORIES[prefs.mode](state.field)
    redrawState(ctx, state)
  }

  resize()
  window.addEventListener('resize', resize, { passive: true })
  if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    startLoop(ctx, () => state)
  }
}

initBackgroundViz()

/// <reference lib="dom" />

import { type VizPrefs, bindControls, persistPrefs, resolveInitialPrefs } from './controls'
import { createBriansBrainEngine, createCyclicEngine, createSandpileEngine } from './cpu-automata'
import {
  createAttractorEngine,
  createBoidsEngine,
  createPhysarumEngine,
  createRainEngine,
} from './cpu-emergent'
import { createGrayScottEngine, createIsingEngine, createKuramotoEngine } from './cpu-physics'
import {
  createChladniGpuEngine,
  createFlowGpuEngine,
  createSingularityGpuEngine,
  createVoronoiGpuEngine,
  createWavesGpuEngine,
} from './gpu-fields'
import {
  COLOR_SCHEMES,
  type ColorScheme,
  RESOLUTION_PRESETS,
  type ResolutionPreset,
  SATURATION_PRESETS,
  VIZ_MODES,
  type VizModeId,
  speedToMultiplier,
} from './presets'
import { type GridField, type VizEngine, createGridField, wrap } from './types'
import {
  type CompiledGpuProgram,
  type WebGLPipeline,
  compileGpuProgram,
  createWebGLPipeline,
} from './webgl'

const ENGINE_FACTORIES: Record<VizModeId, (field: GridField) => VizEngine> = {
  cyclic: createCyclicEngine,
  'brians-brain': createBriansBrainEngine,
  'gray-scott': createGrayScottEngine,
  waves: createWavesGpuEngine,
  flow: createFlowGpuEngine,
  voronoi: createVoronoiGpuEngine,
  rain: createRainEngine,
  physarum: createPhysarumEngine,
  chladni: createChladniGpuEngine,
  attractor: createAttractorEngine,
  kuramoto: createKuramotoEngine,
  ising: createIsingEngine,
  boids: createBoidsEngine,
  sandpile: createSandpileEngine,
  singularity: createSingularityGpuEngine,
}

export interface VizHandle {
  dispose(): void
}

interface ActiveState {
  cssWidth: number
  cssHeight: number
  dpr: number
  field: GridField
  engine: VizEngine
  gpuProg: CompiledGpuProgram | null
  scheme: ColorScheme
  resolution: ResolutionPreset
  satScale: number
  speedMultiplier: number
}

function lookupPrefs(prefs: VizPrefs): {
  scheme: ColorScheme
  resolution: ResolutionPreset
  satScale: number
  speedMultiplier: number
} {
  const fallbackScheme = COLOR_SCHEMES[0]
  const fallbackRes = RESOLUTION_PRESETS[1] ?? RESOLUTION_PRESETS[0]
  if (!fallbackScheme || !fallbackRes) {
    throw new Error('Missing default visualization presets')
  }
  return {
    scheme: COLOR_SCHEMES.find((c) => c.id === prefs.color) ?? fallbackScheme,
    resolution: RESOLUTION_PRESETS.find((r) => r.id === prefs.resolution) ?? fallbackRes,
    satScale: SATURATION_PRESETS.find((s) => s.id === prefs.saturation)?.scale ?? 1,
    speedMultiplier: speedToMultiplier(prefs.speed),
  }
}

function renderFrame(pipeline: WebGLPipeline, state: ActiveState, simTime: number): void {
  if (state.engine.kind === 'gpu' && state.gpuProg !== null) {
    pipeline.renderGpuField(
      state.gpuProg,
      state.field.cols,
      state.field.rows,
      simTime,
      state.engine.updateUniforms,
    )
  } else if (state.engine.kind === 'cpu') {
    state.engine.update(simTime)
    pipeline.uploadCpuField(state.field)
  }

  pipeline.present({
    cssWidth: state.cssWidth,
    cssHeight: state.cssHeight,
    dpr: state.dpr,
    cols: state.field.cols,
    rows: state.field.rows,
    resolution: state.resolution,
    scheme: state.scheme,
    satScale: state.satScale,
    simTime,
  })
}

function startAnimation(
  pipeline: WebGLPipeline,
  getState: () => ActiveState,
  signal: AbortSignal,
): () => void {
  let lastReal = performance.now()
  let simTime = lastReal
  let lastStepSim = simTime
  let rafId = 0

  const tick = (now: number): void => {
    if (!document.hidden) {
      const state = getState()
      const dt = Math.min(100, Math.max(0, now - lastReal))
      simTime += dt * state.speedMultiplier
      if (state.engine.kind === 'cpu' && simTime - lastStepSim >= state.engine.stepMs) {
        state.engine.step(simTime)
        lastStepSim = simTime
      }
      renderFrame(pipeline, state, simTime)
    }
    lastReal = now
    rafId = window.requestAnimationFrame(tick)
  }

  rafId = window.requestAnimationFrame(tick)
  document.addEventListener(
    'visibilitychange',
    () => {
      if (!document.hidden) lastReal = performance.now()
    },
    { signal },
  )
  return () => {
    window.cancelAnimationFrame(rafId)
  }
}

function getGpuProgram(
  gl: WebGL2RenderingContext,
  cache: Map<string, CompiledGpuProgram>,
  engine: VizEngine,
): CompiledGpuProgram | null {
  if (engine.kind !== 'gpu') return null
  const existing = cache.get(engine.fragmentSource)
  if (existing !== undefined) return existing
  const created = compileGpuProgram(gl, engine.fragmentSource)
  cache.set(engine.fragmentSource, created)
  return created
}

function createInitialState(
  gl: WebGL2RenderingContext,
  cache: Map<string, CompiledGpuProgram>,
  prefs: VizPrefs,
): ActiveState {
  const resolved = lookupPrefs(prefs)
  const field = createGridField(window.innerWidth, window.innerHeight, resolved.resolution.cellSize)
  const engine = ENGINE_FACTORIES[prefs.mode](field)
  return {
    cssWidth: window.innerWidth,
    cssHeight: window.innerHeight,
    dpr: Math.min(window.devicePixelRatio || 1, 2),
    field,
    engine,
    gpuProg: getGpuProgram(gl, cache, engine),
    ...resolved,
  }
}

function initPipeline(canvasSelector: string): {
  canvas: HTMLCanvasElement
  pipeline: WebGLPipeline
} | null {
  const canvas = document.querySelector(canvasSelector)
  if (!(canvas instanceof HTMLCanvasElement)) return null
  try {
    const pipeline = createWebGLPipeline(canvas)
    return pipeline === null ? null : { canvas, pipeline }
  } catch {
    return null
  }
}

function rebuildActiveGrid(
  pipeline: WebGLPipeline,
  cache: Map<string, CompiledGpuProgram>,
  state: ActiveState,
  mode: VizModeId,
): void {
  state.field = createGridField(state.cssWidth, state.cssHeight, state.resolution.cellSize)
  state.engine = ENGINE_FACTORIES[mode](state.field)
  state.gpuProg = getGpuProgram(pipeline.gl, cache, state.engine)
  renderFrame(pipeline, state, performance.now())
}

function syncCanvasViewport(canvas: HTMLCanvasElement, state: ActiveState): void {
  state.dpr = Math.min(window.devicePixelRatio || 1, 2)
  state.cssWidth = window.innerWidth
  state.cssHeight = window.innerHeight
  canvas.width = Math.floor(state.cssWidth * state.dpr)
  canvas.height = Math.floor(state.cssHeight * state.dpr)
}

function stepModeByDelta(current: VizModeId, delta: number): VizModeId {
  const idx = VIZ_MODES.findIndex((item) => item.id === current)
  return VIZ_MODES[wrap(idx + delta, VIZ_MODES.length)]?.id ?? current
}

export function mountBackgroundViz(canvasSelector = '.bg-life'): VizHandle | null {
  const ctx = initPipeline(canvasSelector)
  if (ctx === null) return null
  const { canvas, pipeline } = ctx
  const abort = new AbortController()
  const progCache = new Map<string, CompiledGpuProgram>()
  const prefs = resolveInitialPrefs()
  const state = createInitialState(pipeline.gl, progCache, prefs)

  const applyPrefs = (patch: Partial<VizPrefs>): void => {
    const rebuild =
      (patch.mode !== undefined && patch.mode !== prefs.mode) ||
      (patch.resolution !== undefined && patch.resolution !== prefs.resolution)
    Object.assign(prefs, patch)
    persistPrefs(prefs)
    controls.sync(prefs)
    Object.assign(state, lookupPrefs(prefs))
    if (rebuild) rebuildActiveGrid(pipeline, progCache, state, prefs.mode)
    else renderFrame(pipeline, state, performance.now())
  }

  const controls = bindControls(
    prefs,
    applyPrefs,
    (delta) => {
      applyPrefs({ mode: stepModeByDelta(prefs.mode, delta) })
    },
    abort.signal,
  )

  const resize = (): void => {
    syncCanvasViewport(canvas, state)
    rebuildActiveGrid(pipeline, progCache, state, prefs.mode)
  }

  resize()
  window.addEventListener('resize', resize, { passive: true, signal: abort.signal })
  const stopRaf = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ? () => {}
    : startAnimation(pipeline, () => state, abort.signal)

  const dispose = (): void => {
    stopRaf()
    abort.abort()
    for (const item of progCache.values()) pipeline.gl.deleteProgram(item.program)
    pipeline.dispose()
  }
  window.addEventListener('pagehide', dispose, { signal: abort.signal })
  return { dispose }
}

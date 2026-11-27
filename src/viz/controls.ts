/// <reference lib="dom" />

import {
  COLOR_SCHEMES,
  type ColorSchemeId,
  RESOLUTION_PRESETS,
  type ResolutionPresetId,
  SATURATION_DEFAULT,
  SPEED_DEFAULT,
  VIZ_MODES,
  type VizModeId,
  clampSaturation,
  clampSpeed,
} from './presets'

const STORAGE_KEY = 'surj-viz-prefs-v3'

export interface VizPrefs {
  mode: VizModeId
  color: ColorSchemeId
  saturation: number
  resolution: ResolutionPresetId
  speed: number
}

function findId<T extends string>(
  list: readonly { readonly id: T }[],
  candidate: string | null | undefined,
  fallback: T,
): T {
  return list.find((item) => item.id === candidate)?.id ?? fallback
}

function readStoredString(obj: object, key: string): string | undefined {
  const val: unknown = Reflect.get(obj, key)
  return typeof val === 'string' ? val : undefined
}

function loadStoredObject(): object {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    const parsed: unknown = raw === null ? null : JSON.parse(raw)
    if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
      return parsed
    }
  } catch {
    // Ignore storage access errors in restricted contexts
  }
  return {}
}

export function resolveInitialPrefs(): VizPrefs {
  const params = new URLSearchParams(window.location.search)
  const stored = loadStoredObject()

  return {
    mode: findId(VIZ_MODES, params.get('viz') ?? readStoredString(stored, 'mode'), 'cyclic'),
    color: findId(
      COLOR_SCHEMES,
      params.get('color') ?? readStoredString(stored, 'color'),
      'iridescent-grey',
    ),
    saturation: clampSaturation(
      Number(params.get('sat') ?? readStoredString(stored, 'saturation') ?? SATURATION_DEFAULT),
    ),
    resolution: findId(
      RESOLUTION_PRESETS,
      params.get('res') ?? readStoredString(stored, 'resolution'),
      'medium',
    ),
    speed: clampSpeed(
      Number(params.get('speed') ?? readStoredString(stored, 'speed') ?? SPEED_DEFAULT),
    ),
  }
}

export function persistPrefs(prefs: VizPrefs): void {
  const url = new URL(window.location.href)
  url.searchParams.set('viz', prefs.mode)
  url.searchParams.set('color', prefs.color)
  url.searchParams.set('sat', String(prefs.saturation))
  url.searchParams.set('res', prefs.resolution)
  url.searchParams.set('speed', String(prefs.speed))
  window.history.replaceState(null, '', url)

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs))
  } catch {
    // Ignore storage access errors in restricted contexts
  }
}

function bindSelect<T extends string>(
  selector: string,
  list: readonly { readonly id: T }[],
  initial: T,
  onChange: (value: T) => void,
): HTMLSelectElement | null {
  const el = document.querySelector(selector)
  if (!(el instanceof HTMLSelectElement)) {
    return null
  }
  el.value = initial
  el.addEventListener('change', () => {
    const match = list.find((item) => item.id === el.value)
    if (match) {
      onChange(match.id)
    }
  })
  return el
}

function bindSlider(
  name: string,
  initial: number,
  clamp: (value: number) => number,
  onChange: (value: number) => void,
): { sync: (value: number) => void } {
  const slider = document.querySelector(`[data-viz-control="${name}"]`)
  const readout = document.querySelector(`[data-viz-readout="${name}"]`)
  const render = (value: number): void => {
    if (slider instanceof HTMLInputElement) slider.value = String(value)
    if (readout !== null) readout.textContent = String(value)
  }
  render(initial)
  if (slider instanceof HTMLInputElement) {
    slider.addEventListener('input', () => {
      const value = clamp(Number(slider.value))
      render(value)
      onChange(value)
    })
  }
  return { sync: render }
}

function bindModeSteppers(onCycleMode: (delta: number) => void, signal: AbortSignal): void {
  for (const button of document.querySelectorAll('[data-viz-dir]')) {
    if (button instanceof HTMLButtonElement) {
      button.addEventListener(
        'click',
        () => {
          onCycleMode(Number(button.dataset['vizDir'] ?? 1) < 0 ? -1 : 1)
        },
        { signal },
      )
    }
  }
  window.addEventListener(
    'keydown',
    (event) => {
      if (event.target instanceof HTMLSelectElement || event.target instanceof HTMLInputElement) {
        return
      }
      if (event.key === '[' || event.key === ']') {
        onCycleMode(event.key === '[' ? -1 : 1)
      }
    },
    { signal },
  )
}

export function bindControls(
  prefs: VizPrefs,
  onUpdate: (patch: Partial<VizPrefs>) => void,
  onCycleMode: (delta: number) => void,
  signal: AbortSignal,
): { sync: (next: VizPrefs) => void } {
  const mode = bindSelect('[data-viz-control="mode"]', VIZ_MODES, prefs.mode, (v) => {
    onUpdate({ mode: v })
  })
  const color = bindSelect('[data-viz-control="color"]', COLOR_SCHEMES, prefs.color, (v) => {
    onUpdate({ color: v })
  })
  const sat = bindSlider('saturation', prefs.saturation, clampSaturation, (v) => {
    onUpdate({ saturation: v })
  })
  const res = bindSelect(
    '[data-viz-control="resolution"]',
    RESOLUTION_PRESETS,
    prefs.resolution,
    (v) => {
      onUpdate({ resolution: v })
    },
  )
  const speed = bindSlider('speed', prefs.speed, clampSpeed, (v) => {
    onUpdate({ speed: v })
  })
  bindModeSteppers(onCycleMode, signal)

  return {
    sync: (next: VizPrefs) => {
      if (mode !== null) mode.value = next.mode
      if (color !== null) color.value = next.color
      sat.sync(next.saturation)
      if (res !== null) res.value = next.resolution
      speed.sync(next.speed)
    },
  }
}

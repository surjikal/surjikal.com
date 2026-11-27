/// <reference lib="dom" />

import {
  COLOR_SCHEMES,
  type ColorSchemeId,
  SPEED_PRESETS,
  type SpeedPresetId,
  VIZ_MODES,
  type VizModeId,
} from '../viz-modes'

const STORAGE_KEY = 'surj-viz-prefs'

export interface VizPrefs {
  mode: VizModeId
  color: ColorSchemeId
  speed: SpeedPresetId
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

export function resolveInitialPrefs(): VizPrefs {
  const params = new URLSearchParams(window.location.search)
  let stored: object = {}
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    const parsed: unknown = raw === null ? null : JSON.parse(raw)
    if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
      stored = parsed
    }
  } catch {
    // Ignore storage access errors in restricted contexts
  }

  return {
    mode: findId(VIZ_MODES, params.get('viz') ?? readStoredString(stored, 'mode'), 'cyclic'),
    color: findId(
      COLOR_SCHEMES,
      params.get('color') ?? readStoredString(stored, 'color'),
      'iridescent-grey',
    ),
    speed: findId(
      SPEED_PRESETS,
      params.get('speed') ?? readStoredString(stored, 'speed'),
      'normal',
    ),
  }
}

export function persistPrefs(prefs: VizPrefs): void {
  const url = new URL(window.location.href)
  url.searchParams.set('viz', prefs.mode)
  url.searchParams.set('color', prefs.color)
  url.searchParams.set('speed', prefs.speed)
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

function bindModeSteppers(onCycleMode: (delta: number) => void): void {
  for (const button of document.querySelectorAll('[data-viz-dir]')) {
    if (button instanceof HTMLButtonElement) {
      button.addEventListener('click', () => {
        onCycleMode(Number(button.dataset['vizDir'] ?? 1) < 0 ? -1 : 1)
      })
    }
  }
  window.addEventListener('keydown', (event) => {
    if (event.target instanceof HTMLSelectElement || event.target instanceof HTMLInputElement) {
      return
    }
    if (event.key === '[' || event.key === ']') {
      onCycleMode(event.key === '[' ? -1 : 1)
    }
  })
}

export function bindControls(
  prefs: VizPrefs,
  onUpdate: (patch: Partial<VizPrefs>) => void,
  onCycleMode: (delta: number) => void,
): { sync: (next: VizPrefs) => void } {
  const mode = bindSelect('[data-viz-control="mode"]', VIZ_MODES, prefs.mode, (v) => {
    onUpdate({ mode: v })
  })
  const color = bindSelect('[data-viz-control="color"]', COLOR_SCHEMES, prefs.color, (v) => {
    onUpdate({ color: v })
  })
  const speed = bindSelect('[data-viz-control="speed"]', SPEED_PRESETS, prefs.speed, (v) => {
    onUpdate({ speed: v })
  })
  bindModeSteppers(onCycleMode)

  return {
    sync: (next: VizPrefs) => {
      if (mode !== null) {
        mode.value = next.mode
      }
      if (color !== null) {
        color.value = next.color
      }
      if (speed !== null) {
        speed.value = next.speed
      }
    },
  }
}

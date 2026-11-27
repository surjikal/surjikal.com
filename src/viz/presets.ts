export interface VizMode {
  readonly id:
    | 'cyclic'
    | 'brians-brain'
    | 'gray-scott'
    | 'waves'
    | 'flow'
    | 'voronoi'
    | 'rain'
    | 'physarum'
    | 'chladni'
    | 'attractor'
    | 'kuramoto'
    | 'ising'
    | 'boids'
    | 'sandpile'
    | 'singularity'
  readonly label: string
}

export type VizModeId = VizMode['id']

export const VIZ_MODES: readonly VizMode[] = [
  { id: 'cyclic', label: '01 · Cyclic CA' },
  { id: 'brians-brain', label: "02 · Brian's Brain" },
  { id: 'gray-scott', label: '03 · Gray-Scott' },
  { id: 'waves', label: '04 · Wave Interference' },
  { id: 'flow', label: '05 · Value Flow' },
  { id: 'voronoi', label: '06 · Voronoi Pulse' },
  { id: 'rain', label: '07 · Digital Rain' },
  { id: 'physarum', label: '08 · Slime Mold' },
  { id: 'chladni', label: '09 · Chladni Cymatics' },
  { id: 'attractor', label: '10 · Strange Attractor' },
  { id: 'kuramoto', label: '11 · Kuramoto Sync' },
  { id: 'ising', label: '12 · Ising Criticality' },
  { id: 'boids', label: '13 · Murmuration' },
  { id: 'sandpile', label: '14 · Abelian Sandpile' },
  { id: 'singularity', label: '15 · Binary Singularity' },
]

export interface ColorScheme {
  readonly id:
    | 'iridescent-grey'
    | 'pure-silver'
    | 'pearl-cyan'
    | 'oil-slick'
    | 'rose-quartz'
    | 'mint-vapor'
    | 'amber-ash'
    | 'ultraviolet'
    | 'phosphor'
    | 'crimson-smoke'
  readonly label: string
  readonly hueStart: number
  readonly hueSpan: number
  readonly saturation: number
  readonly lightness: number
  readonly alpha: number
}

export type ColorSchemeId = ColorScheme['id']

export const COLOR_SCHEMES: readonly ColorScheme[] = [
  {
    id: 'iridescent-grey',
    label: '01 · Iridescent Grey',
    hueStart: 0,
    hueSpan: 360,
    saturation: 14,
    lightness: 87,
    alpha: 0.22,
  },
  {
    id: 'pure-silver',
    label: '02 · Pure Silver',
    hueStart: 0,
    hueSpan: 0,
    saturation: 0,
    lightness: 88,
    alpha: 0.22,
  },
  {
    id: 'pearl-cyan',
    label: '03 · Pearl Cyan',
    hueStart: 175,
    hueSpan: 45,
    saturation: 18,
    lightness: 86,
    alpha: 0.22,
  },
  {
    id: 'oil-slick',
    label: '04 · Oil Slick',
    hueStart: 0,
    hueSpan: 360,
    saturation: 38,
    lightness: 78,
    alpha: 0.24,
  },
  {
    id: 'rose-quartz',
    label: '05 · Rose Quartz',
    hueStart: 315,
    hueSpan: 45,
    saturation: 18,
    lightness: 85,
    alpha: 0.22,
  },
  {
    id: 'mint-vapor',
    label: '06 · Mint Vapor',
    hueStart: 135,
    hueSpan: 50,
    saturation: 18,
    lightness: 85,
    alpha: 0.22,
  },
  {
    id: 'amber-ash',
    label: '07 · Amber Ash',
    hueStart: 28,
    hueSpan: 30,
    saturation: 20,
    lightness: 84,
    alpha: 0.22,
  },
  {
    id: 'ultraviolet',
    label: '08 · Ultraviolet',
    hueStart: 235,
    hueSpan: 60,
    saturation: 26,
    lightness: 80,
    alpha: 0.24,
  },
  {
    id: 'phosphor',
    label: '09 · Phosphor',
    hueStart: 115,
    hueSpan: 40,
    saturation: 42,
    lightness: 72,
    alpha: 0.24,
  },
  {
    id: 'crimson-smoke',
    label: '10 · Crimson Smoke',
    hueStart: 345,
    hueSpan: 35,
    saturation: 28,
    lightness: 76,
    alpha: 0.22,
  },
]

export interface SaturationPreset {
  readonly id: 'mono' | 'subtle' | 'medium' | 'vivid' | 'hyper'
  readonly label: string
  readonly scale: number
}

export type SaturationPresetId = SaturationPreset['id']

export const SATURATION_PRESETS: readonly SaturationPreset[] = [
  { id: 'mono', label: 'Sat · Mono', scale: 0 },
  { id: 'subtle', label: 'Sat · Subtle', scale: 1 },
  { id: 'medium', label: 'Sat · Medium', scale: 1.8 },
  { id: 'vivid', label: 'Sat · Vivid', scale: 2.8 },
  { id: 'hyper', label: 'Sat · Hyper', scale: 4 },
]

export interface ResolutionPreset {
  readonly id: 'coarse' | 'medium' | 'fine' | 'ultra'
  readonly label: string
  readonly cellSize: number
  readonly dotSize: number
}

export type ResolutionPresetId = ResolutionPreset['id']

export const RESOLUTION_PRESETS: readonly ResolutionPreset[] = [
  { id: 'coarse', label: 'Res · Coarse', cellSize: 24, dotSize: 3 },
  { id: 'medium', label: 'Res · Med', cellSize: 16, dotSize: 2 },
  { id: 'fine', label: 'Res · Fine', cellSize: 10, dotSize: 1.5 },
  { id: 'ultra', label: 'Res · Ultra', cellSize: 6, dotSize: 1 },
]

export const SPEED_MIN = 0
export const SPEED_MAX = 1000
export const SPEED_DEFAULT = 56

const SPEED_UNITS_PER_MULTIPLIER = 250 / 4.5

export function speedToMultiplier(speed: number): number {
  return speed / SPEED_UNITS_PER_MULTIPLIER
}

export function clampSpeed(value: number): number {
  return Number.isFinite(value)
    ? Math.min(SPEED_MAX, Math.max(SPEED_MIN, Math.round(value)))
    : SPEED_DEFAULT
}

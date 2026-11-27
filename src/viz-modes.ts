export interface VizMode {
  readonly id:
    | 'cyclic'
    | 'brians-brain'
    | 'life'
    | 'gray-scott'
    | 'waves'
    | 'flow'
    | 'lenia'
    | 'dunes'
    | 'voronoi'
    | 'rain'
  readonly label: string
}

export type VizModeId = VizMode['id']

export const VIZ_MODES: readonly VizMode[] = [
  { id: 'cyclic', label: '01 · Cyclic CA' },
  { id: 'brians-brain', label: "02 · Brian's Brain" },
  { id: 'life', label: '03 · Game of Life' },
  { id: 'gray-scott', label: '04 · Gray-Scott' },
  { id: 'waves', label: '05 · Wave Interference' },
  { id: 'flow', label: '06 · Value Flow' },
  { id: 'lenia', label: '07 · Smooth Life' },
  { id: 'dunes', label: '08 · Drift Dunes' },
  { id: 'voronoi', label: '09 · Voronoi Pulse' },
  { id: 'rain', label: '10 · Digital Rain' },
]

export interface SpeedPreset {
  readonly id: 'slow' | 'normal' | 'fast' | 'very-fast'
  readonly label: string
  readonly multiplier: number
}

export type SpeedPresetId = SpeedPreset['id']

export const SPEED_PRESETS: readonly SpeedPreset[] = [
  { id: 'slow', label: 'Slow', multiplier: 0.4 },
  { id: 'normal', label: 'Normal', multiplier: 1 },
  { id: 'fast', label: 'Fast', multiplier: 2.2 },
  { id: 'very-fast', label: 'Very Fast', multiplier: 4.5 },
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

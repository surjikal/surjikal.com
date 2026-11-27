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

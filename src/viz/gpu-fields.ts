/// <reference lib="dom" />

import { type GpuVizEngine, wrap } from './types'

const WAVES_FRAGMENT = `#version 300 es
precision highp float;
uniform vec2 u_gridSize;
uniform float u_time;
out vec4 outField;

void main() {
  vec2 cell = floor(gl_FragCoord.xy);
  float s1 = sin(distance(cell, u_gridSize * vec2(0.25, 0.35)) * 0.48 - u_time * 2.2);
  float s2 = sin(distance(cell, u_gridSize * vec2(0.72, 0.28)) * 0.42 - u_time * 1.7);
  float s3 = sin(distance(cell, u_gridSize * vec2(0.52, 0.76)) * 0.52 - u_time * 2.0);
  float norm = ((s1 + s2 + s3) / 3.0 + 1.0) * 0.5;
  outField = vec4(norm, norm, 0.0, 1.0);
}
`

const FLOW_FRAGMENT = `#version 300 es
precision highp float;
uniform vec2 u_gridSize;
uniform float u_time;
out vec4 outField;

void main() {
  vec2 cell = floor(gl_FragCoord.xy);
  float t = u_time * 0.45;
  float nx = cell.x * 0.075;
  float ny = cell.y * 0.09;
  float v1 = sin(nx + cos(ny * 0.8 + t) + t * 0.7);
  float v2 = cos(ny - sin(nx * 0.7 - t * 0.6));
  float intensity = 0.5 + 0.5 * sin((v1 + v2) * 2.1);
  float phase = fract((v1 + v2) * 0.25 + 0.5);
  outField = vec4(intensity, phase, 0.0, 1.0);
}
`

const VORONOI_FRAGMENT = `#version 300 es
precision highp float;
uniform vec2 u_gridSize;
uniform float u_time;
uniform vec3 u_seeds[12];
out vec4 outField;

void main() {
  vec2 uv = floor(gl_FragCoord.xy) / u_gridSize;
  float minDist = 9.0;
  float secondDist = 9.0;
  float seedPhase = 0.0;
  for (int i = 0; i < 12; i++) {
    vec2 diff = abs(uv - u_seeds[i].xy);
    vec2 wrapped = min(diff, 1.0 - diff);
    float d = length(wrapped);
    if (d < minDist) {
      secondDist = minDist;
      minDist = d;
      seedPhase = u_seeds[i].z;
    } else if (d < secondDist) {
      secondDist = d;
    }
  }
  float edgeDelta = (secondDist - minDist) * 18.0;
  float edge = exp(-edgeDelta * edgeDelta);
  float pulse = 0.5 + 0.5 * sin(minDist * 26.0 - u_time * 2.0);
  float intensity = clamp(edge * 0.75 + pulse * 0.35, 0.0, 1.0);
  outField = vec4(intensity, fract(seedPhase + minDist * 1.8), 0.0, 1.0);
}
`

const CHLADNI_FRAGMENT = `#version 300 es
precision highp float;
uniform vec2 u_gridSize;
uniform vec4 u_modes;
uniform float u_mix;
out vec4 outField;

float evalMode(vec2 u, vec2 nm) {
  vec2 k = nm * 3.14159265;
  return cos(k.x * u.x) * cos(k.y * u.y) - cos(k.y * u.x) * cos(k.x * u.y);
}

void main() {
  float scale = max(u_gridSize.x, u_gridSize.y) * 0.5;
  vec2 u = (floor(gl_FragCoord.xy) - u_gridSize * 0.5) / scale;
  float w = mix(evalMode(u, u_modes.xy), evalMode(u, u_modes.zw), u_mix);
  float intensity = exp(-abs(w) * 4.2);
  outField = vec4(intensity, fract(w * 0.25 + 0.5), 0.0, 1.0);
}
`

const SINGULARITY_FRAGMENT = `#version 300 es
precision highp float;
uniform vec2 u_gridSize;
uniform float u_time;
out vec4 outField;

void main() {
  float scale = min(u_gridSize.x, u_gridSize.y) * 0.5;
  vec2 u = (floor(gl_FragCoord.xy) - u_gridSize * 0.5) / scale;
  float t = u_time * 0.9;
  float orbit = 0.24 + 0.05 * sin(t * 0.4);
  vec2 c1 = vec2(orbit * cos(t), orbit * sin(t) * 0.75);
  vec2 d1 = u - c1;
  vec2 d2 = u + c1;
  float r1Sq = dot(d1, d1);
  float r2Sq = dot(d2, d2);
  if (r1Sq < 0.006 || r2Sq < 0.006) {
    outField = vec4(0.0, 0.0, 0.0, 1.0);
    return;
  }
  float m1 = 0.028 / (r1Sq + 0.012);
  float m2 = 0.028 / (r2Sq + 0.012);
  vec2 l = u
    - d1 * m1 + vec2(d1.y, -d1.x) * (m1 * 0.65)
    - d2 * m2 + vec2(d2.y, -d2.x) * (m2 * 0.65);
  float sheet = 0.5 + 0.5 * sin(l.x * 22.0 + t * 0.4) * sin(l.y * 22.0 - t * 0.3);
  float g1 = (sqrt(r1Sq) - 0.14) / 0.045;
  float g2 = (sqrt(r2Sq) - 0.14) / 0.045;
  float ring = exp(-g1 * g1) + exp(-g2 * g2);
  float intensity = clamp(sheet * 0.52 + ring * 0.72, 0.0, 1.0);
  outField = vec4(intensity, fract((m1 + m2) * 0.35 + sheet * 0.3), 0.0, 1.0);
}
`

export function createWavesGpuEngine(): GpuVizEngine {
  return { kind: 'gpu', fragmentSource: WAVES_FRAGMENT }
}

export function createFlowGpuEngine(): GpuVizEngine {
  return { kind: 'gpu', fragmentSource: FLOW_FRAGMENT }
}

export function createVoronoiGpuEngine(): GpuVizEngine {
  const seeds = Array.from({ length: 12 }, (_, i) => ({
    x0: Math.random(),
    y0: Math.random(),
    vx: (Math.random() - 0.5) * 0.045,
    vy: (Math.random() - 0.5) * 0.045,
    phase: i / 12,
  }))
  const flat = new Float32Array(36)

  return {
    kind: 'gpu',
    fragmentSource: VORONOI_FRAGMENT,
    updateUniforms: (gl, program, simTime) => {
      const sec = simTime * 0.001
      for (let i = 0; i < seeds.length; i += 1) {
        const s = seeds[i]
        if (s) {
          flat[i * 3] = wrap(s.x0 + s.vx * sec, 1)
          flat[i * 3 + 1] = wrap(s.y0 + s.vy * sec, 1)
          flat[i * 3 + 2] = s.phase
        }
      }
      gl.uniform3fv(gl.getUniformLocation(program, 'u_seeds[0]'), flat)
    },
  }
}

const CHLADNI_CHORDS: readonly (readonly [number, number])[] = [
  [3, 5],
  [4, 7],
  [5, 2],
  [6, 4],
  [2, 7],
  [5, 8],
]

export function createChladniGpuEngine(): GpuVizEngine {
  return {
    kind: 'gpu',
    fragmentSource: CHLADNI_FRAGMENT,
    updateUniforms: (gl, program, simTime) => {
      const cycle = Math.max(0, simTime * 0.00016)
      const idxA = Math.floor(cycle) % CHLADNI_CHORDS.length
      const idxB = (idxA + 1) % CHLADNI_CHORDS.length
      const a = CHLADNI_CHORDS[idxA] ?? [3, 5]
      const b = CHLADNI_CHORDS[idxB] ?? [4, 7]
      const mix = 0.5 - 0.5 * Math.cos((cycle % 1) * Math.PI)
      gl.uniform4f(gl.getUniformLocation(program, 'u_modes'), a[0], a[1], b[0], b[1])
      gl.uniform1f(gl.getUniformLocation(program, 'u_mix'), mix)
    },
  }
}

export function createSingularityGpuEngine(): GpuVizEngine {
  return { kind: 'gpu', fragmentSource: SINGULARITY_FRAGMENT }
}

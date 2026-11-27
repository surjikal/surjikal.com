export const FULLSCREEN_VERTEX_SHADER = `#version 300 es
void main() {
  vec2 pos = vec2((gl_VertexID << 1) & 2, gl_VertexID & 2);
  gl_Position = vec4(pos * 2.0 - 1.0, 0.0, 1.0);
}
`

export const DISPLAY_FRAGMENT_SHADER = `#version 300 es
precision highp float;

uniform sampler2D u_field;
uniform vec2 u_cssSize;
uniform vec2 u_gridSize;
uniform float u_dpr;
uniform float u_cellSize;
uniform float u_dotSize;
uniform float u_timePhase;
uniform vec4 u_hslBase;
uniform vec2 u_hueRange;

out vec4 outColor;

const float BAYER[16] = float[16](
  0.0, 8.0, 2.0, 10.0,
  12.0, 4.0, 14.0, 6.0,
  3.0, 11.0, 1.0, 9.0,
  15.0, 7.0, 13.0, 5.0
);

vec3 hsl2rgb(float h, float s, float l) {
  vec3 rgb = clamp(abs(mod(h * 6.0 + vec3(0.0, 4.0, 2.0), 6.0) - 3.0) - 1.0, 0.0, 1.0);
  float c = (1.0 - abs(2.0 * l - 1.0)) * s;
  return (rgb - 0.5) * c + l;
}

void main() {
  vec2 cssPos = vec2(gl_FragCoord.x / u_dpr, u_cssSize.y - gl_FragCoord.y / u_dpr);
  vec2 cell = floor(cssPos / u_cellSize);
  if (cell.x < 0.0 || cell.y < 0.0 || cell.x >= u_gridSize.x || cell.y >= u_gridSize.y) {
    discard;
  }

  float subStep = u_cellSize * 0.25;
  vec2 local = cssPos - cell * u_cellSize;
  ivec2 subIdx = clamp(ivec2(floor(local / subStep)), ivec2(0), ivec2(3));
  vec2 subLocal = local - vec2(subIdx) * subStep;
  if (subLocal.x >= u_dotSize || subLocal.y >= u_dotSize) {
    discard;
  }

  vec2 sampleVal = texelFetch(u_field, ivec2(cell), 0).rg;
  float threshold = BAYER[subIdx.y * 4 + subIdx.x] * 0.0625;
  if (sampleVal.r < 0.05 || sampleVal.r <= threshold) {
    discard;
  }

  float normPhase = fract(sampleVal.g + cell.x * 0.009 + cell.y * 0.007 + u_timePhase);
  float wave = u_hueRange.y >= 359.5 ? normPhase : 0.5 - 0.5 * cos(normPhase * 6.2831853);
  float hue = fract((u_hueRange.x + wave * u_hueRange.y) / 360.0);
  vec3 rgb = hsl2rgb(hue, u_hslBase.x, u_hslBase.y);

  vec2 centered = (cssPos / u_cssSize - 0.5) / vec2(0.75, 0.65);
  float vignette = mix(0.35, 1.0, clamp(length(centered), 0.0, 1.0));
  float alpha = u_hslBase.z * vignette;
  outColor = vec4(rgb * alpha, alpha);
}
`

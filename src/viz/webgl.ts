/// <reference lib="dom" />

import { type ColorScheme, type ResolutionPreset } from './presets'
import { DISPLAY_FRAGMENT_SHADER, FULLSCREEN_VERTEX_SHADER } from './shaders'
import { type GridField, packFieldToRgBytes } from './types'

function compileShader(gl: WebGL2RenderingContext, type: number, source: string): WebGLShader {
  const shader = gl.createShader(type)
  if (shader === null) {
    throw new Error('Failed to allocate WebGL shader')
  }
  gl.shaderSource(shader, source)
  gl.compileShader(shader)
  if (gl.getShaderParameter(shader, gl.COMPILE_STATUS) !== true) {
    const info = gl.getShaderInfoLog(shader) ?? 'unknown shader error'
    gl.deleteShader(shader)
    throw new Error(info)
  }
  return shader
}

export function createProgram(
  gl: WebGL2RenderingContext,
  vertexSrc: string,
  fragmentSrc: string,
): WebGLProgram {
  const vs = compileShader(gl, gl.VERTEX_SHADER, vertexSrc)
  const fs = compileShader(gl, gl.FRAGMENT_SHADER, fragmentSrc)
  const program = gl.createProgram()
  if (program === null) {
    throw new Error('Failed to allocate WebGL program')
  }
  gl.attachShader(program, vs)
  gl.attachShader(program, fs)
  gl.linkProgram(program)
  gl.deleteShader(vs)
  gl.deleteShader(fs)
  if (gl.getProgramParameter(program, gl.LINK_STATUS) !== true) {
    const info = gl.getProgramInfoLog(program) ?? 'unknown link error'
    gl.deleteProgram(program)
    throw new Error(info)
  }
  return program
}

export interface CompiledGpuProgram {
  readonly program: WebGLProgram
  readonly uGridSize: WebGLUniformLocation | null
  readonly uTime: WebGLUniformLocation | null
}

export function compileGpuProgram(
  gl: WebGL2RenderingContext,
  fragmentSrc: string,
): CompiledGpuProgram {
  const program = createProgram(gl, FULLSCREEN_VERTEX_SHADER, fragmentSrc)
  return {
    program,
    uGridSize: gl.getUniformLocation(program, 'u_gridSize'),
    uTime: gl.getUniformLocation(program, 'u_time'),
  }
}

export interface RenderParams {
  cssWidth: number
  cssHeight: number
  dpr: number
  cols: number
  rows: number
  resolution: ResolutionPreset
  scheme: ColorScheme
  satScale: number
  simTime: number
}

export interface WebGLPipeline {
  readonly gl: WebGL2RenderingContext
  uploadCpuField(field: GridField): void
  renderGpuField(
    gpu: CompiledGpuProgram,
    cols: number,
    rows: number,
    simTime: number,
    bindExtra?: (gl: WebGL2RenderingContext, prog: WebGLProgram, simTime: number) => void,
  ): void
  present(params: RenderParams): void
  dispose(): void
}

interface DisplayUniforms {
  program: WebGLProgram
  uField: WebGLUniformLocation | null
  uCssSize: WebGLUniformLocation | null
  uGridSize: WebGLUniformLocation | null
  uDpr: WebGLUniformLocation | null
  uCellSize: WebGLUniformLocation | null
  uDotSize: WebGLUniformLocation | null
  uTimePhase: WebGLUniformLocation | null
  uHslBase: WebGLUniformLocation | null
  uHueRange: WebGLUniformLocation | null
}

function createDisplayUniforms(gl: WebGL2RenderingContext): DisplayUniforms {
  const program = createProgram(gl, FULLSCREEN_VERTEX_SHADER, DISPLAY_FRAGMENT_SHADER)
  return {
    program,
    uField: gl.getUniformLocation(program, 'u_field'),
    uCssSize: gl.getUniformLocation(program, 'u_cssSize'),
    uGridSize: gl.getUniformLocation(program, 'u_gridSize'),
    uDpr: gl.getUniformLocation(program, 'u_dpr'),
    uCellSize: gl.getUniformLocation(program, 'u_cellSize'),
    uDotSize: gl.getUniformLocation(program, 'u_dotSize'),
    uTimePhase: gl.getUniformLocation(program, 'u_timePhase'),
    uHslBase: gl.getUniformLocation(program, 'u_hslBase'),
    uHueRange: gl.getUniformLocation(program, 'u_hueRange'),
  }
}

function drawDisplayPass(
  gl: WebGL2RenderingContext,
  canvas: HTMLCanvasElement,
  fieldTex: WebGLTexture,
  u: DisplayUniforms,
  p: RenderParams,
): void {
  gl.bindFramebuffer(gl.FRAMEBUFFER, null)
  gl.viewport(0, 0, canvas.width, canvas.height)
  gl.clearColor(0, 0, 0, 0)
  gl.clear(gl.COLOR_BUFFER_BIT)
  gl.useProgram(u.program)
  gl.activeTexture(gl.TEXTURE0)
  gl.bindTexture(gl.TEXTURE_2D, fieldTex)
  gl.uniform1i(u.uField, 0)
  gl.uniform2f(u.uCssSize, p.cssWidth, p.cssHeight)
  gl.uniform2f(u.uGridSize, p.cols, p.rows)
  gl.uniform1f(u.uDpr, p.dpr)
  gl.uniform1f(u.uCellSize, p.resolution.cellSize)
  gl.uniform1f(u.uDotSize, p.resolution.dotSize)
  gl.uniform1f(u.uTimePhase, (p.simTime * 0.000018) % 1)
  const sat = Math.min(0.95, Math.max(0, (p.scheme.saturation * p.satScale) / 100))
  gl.uniform4f(u.uHslBase, sat, p.scheme.lightness / 100, p.scheme.alpha, 0)
  gl.uniform2f(u.uHueRange, p.scheme.hueStart, p.scheme.hueSpan)
  gl.drawArrays(gl.TRIANGLES, 0, 3)
}

function allocateFieldTexture(
  gl: WebGL2RenderingContext,
  tex: WebGLTexture,
  cols: number,
  rows: number,
): void {
  gl.bindTexture(gl.TEXTURE_2D, tex)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RG8, cols, rows, 0, gl.RG, gl.UNSIGNED_BYTE, null)
}

function initGlResources(canvas: HTMLCanvasElement): {
  gl: WebGL2RenderingContext
  vao: WebGLVertexArrayObject
  fieldTex: WebGLTexture
  fbo: WebGLFramebuffer
  display: DisplayUniforms
} | null {
  const gl = canvas.getContext('webgl2', {
    alpha: true,
    antialias: false,
    depth: false,
    stencil: false,
    powerPreference: 'low-power',
  })
  if (gl === null) return null
  gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1)
  const vao = gl.createVertexArray()
  const fieldTex = gl.createTexture()
  const fbo = gl.createFramebuffer()
  if (vao === null || fieldTex === null || fbo === null) return null
  const display = createDisplayUniforms(gl)
  allocateFieldTexture(gl, fieldTex, 1, 1)
  gl.bindVertexArray(vao)
  gl.bindFramebuffer(gl.FRAMEBUFFER, fbo)
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, fieldTex, 0)
  gl.bindFramebuffer(gl.FRAMEBUFFER, null)
  return { gl, vao, fieldTex, fbo, display }
}

function uploadFieldTex(
  gl: WebGL2RenderingContext,
  fieldTex: WebGLTexture,
  field: GridField,
): void {
  gl.bindTexture(gl.TEXTURE_2D, fieldTex)
  const bytes = packFieldToRgBytes(field)
  gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, field.cols, field.rows, gl.RG, gl.UNSIGNED_BYTE, bytes)
}

export function createWebGLPipeline(canvas: HTMLCanvasElement): WebGLPipeline | null {
  const res = initGlResources(canvas)
  if (res === null) return null
  const { gl, vao, fieldTex, fbo, display } = res
  let texCols = 0
  let texRows = 0
  const ensureSize = (cols: number, rows: number): boolean => {
    if (cols === texCols && rows === texRows) return false
    texCols = cols
    texRows = rows
    allocateFieldTexture(gl, fieldTex, cols, rows)
    return true
  }

  return {
    gl,
    uploadCpuField: (field) => {
      if (!ensureSize(field.cols, field.rows) && !field.dirty) return
      field.dirty = false
      uploadFieldTex(gl, fieldTex, field)
    },
    renderGpuField: (gpu, cols, rows, simTime, bindExtra) => {
      ensureSize(cols, rows)
      gl.bindFramebuffer(gl.FRAMEBUFFER, fbo)
      gl.viewport(0, 0, cols, rows)
      gl.useProgram(gpu.program)
      gl.uniform2f(gpu.uGridSize, cols, rows)
      gl.uniform1f(gpu.uTime, simTime * 0.001)
      bindExtra?.(gl, gpu.program, simTime)
      gl.drawArrays(gl.TRIANGLES, 0, 3)
    },
    present: (params) => {
      drawDisplayPass(gl, canvas, fieldTex, display, params)
    },
    dispose: () => {
      gl.deleteProgram(display.program)
      gl.deleteFramebuffer(fbo)
      gl.deleteTexture(fieldTex)
      gl.deleteVertexArray(vao)
    },
  }
}

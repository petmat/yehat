export enum ShaderType {
  Vertex,
  Fragment,
}

export const shaderTypeToWebGLShaderType =
  (gl: WebGLRenderingContext) => (shaderType: ShaderType) =>
    shaderType === ShaderType.Vertex ? gl.VERTEX_SHADER : gl.FRAGMENT_SHADER;

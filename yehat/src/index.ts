import { mat4 } from "gl-matrix";

import { fsSource } from "./shaders/fragmentShader";
import { vsSource } from "./shaders/vertexShader";

export * from "./constants";

const isCanvasElement = (el: Element): el is HTMLCanvasElement =>
  "getContext" in el;

export type Color = [red: number, green: number, blue: number, alpha: number];

export type Vector2 = [x: number, y: number];

export type Triangle = [a: Vector2, b: Vector2, c: Vector2];

export type TriangleColor = [a: Color, b: Color, c: Color];

export type Rectangle = [
  topLeft: Vector2,
  topRight: Vector2,
  bottomRight: Vector2,
  bottomLeft: Vector2
];

export type RectangleColor = [
  topLeft: Color,
  topRight: Color,
  bottomRight: Color,
  bottomLeft: Color
];

export interface InitializeContextOptions {
  depthTestEnabled: boolean;
  depthFunc: number;
  fieldOfView: number;
  aspectRatio: number;
  zNear: number;
  zFar: number;
}

export interface SceneContext {
  createTriangle: (triangle: Triangle, color: Color | TriangleColor) => void;
  createRectangle: (rec: Rectangle, color: Color | RectangleColor) => void;
  createCircle: (
    center: Vector2,
    radius: number,
    resolution: number,
    color: Color
  ) => void;
  drawScene: () => void;
}

interface ShaderProgramInfo {
  program: WebGLProgram;
  attribLocations: {
    vertexPosition: number;
    vertexColor: number;
  };
  uniformLocations: {
    projectionMatrix: WebGLUniformLocation;
    modelViewMatrix: WebGLUniformLocation;
  };
}

export interface GameObject {
  vertexCount: number;
  drawMode: number;
  position: WebGLBuffer;
  color: WebGLBuffer;
}

export const getWebGLContext = (canvas: Element) => {
  if (!isCanvasElement(canvas)) {
    throw new Error("Element passed as an argument is not a canvas element.");
  }

  const gl = canvas.getContext("webgl");

  if (!gl) {
    throw new Error(
      "Unable to initialize WebGL. Your browser or machine may not support it."
    );
  }

  return gl;
};

const initializeDepth = (
  options: InitializeContextOptions,
  gl: WebGLRenderingContext
) => {
  const { depthTestEnabled, depthFunc } = options;

  if (depthTestEnabled) {
    gl.enable(gl.DEPTH_TEST);
  }

  gl.depthFunc(depthFunc);
};

const initializeProjectionMatrix = (options: InitializeContextOptions) => {
  const { fieldOfView, aspectRatio, zNear, zFar } = options;

  const projectionMatrix = mat4.create();
  mat4.perspective(projectionMatrix, fieldOfView, aspectRatio, zNear, zFar);
  return projectionMatrix;
};

const initializeModelViewMatrix = () => {
  const modelViewMatrix = mat4.create();
  mat4.translate(modelViewMatrix, modelViewMatrix, [-0.0, 0.0, -6.0]);
  return modelViewMatrix;
};

const loadShader = (
  gl: WebGLRenderingContext,
  type: number,
  source: string
) => {
  const shader = gl.createShader(type);

  if (!shader) {
    throw new Error("Failed to create shader.");
  }

  gl.shaderSource(shader, source);

  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const infoLog = gl.getShaderInfoLog(shader);
    gl.deleteShader(shader);
    throw new Error("An error occured compiling the shaders: " + infoLog);
  }

  return shader;
};

const initializeShaderProgram = (
  gl: WebGLRenderingContext
): ShaderProgramInfo => {
  const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
  const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);

  const shaderProgram = gl.createProgram();

  if (!shaderProgram) {
    throw new Error("Failed to create shader program.");
  }

  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
  gl.linkProgram(shaderProgram);

  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    throw new Error(
      "Unable to initialize the shader program: " +
        gl.getProgramInfoLog(shaderProgram)
    );
  }

  const projectionMatrix = gl.getUniformLocation(
    shaderProgram,
    "uProjectionMatrix"
  );

  if (!projectionMatrix) {
    throw new Error("Failed to get the projection matrix.");
  }

  const modelViewMatrix = gl.getUniformLocation(
    shaderProgram,
    "uModelViewMatrix"
  );

  if (!modelViewMatrix) {
    throw new Error("Failed to get the model view matrix.");
  }

  return {
    program: shaderProgram,
    attribLocations: {
      vertexPosition: gl.getAttribLocation(shaderProgram, "aVertexPosition"),
      vertexColor: gl.getAttribLocation(shaderProgram, "aVertexColor"),
    },
    uniformLocations: {
      projectionMatrix,
      modelViewMatrix,
    },
  };
};

const initializePositionBuffer = (
  positions: number[],
  gl: WebGLRenderingContext
): WebGLBuffer => {
  const positionBuffer = gl.createBuffer();

  if (!positionBuffer) {
    throw new Error("Failed to create position buffer");
  }

  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

  return positionBuffer;
};

const initializeColorBuffer = (
  colors: number[],
  gl: WebGLRenderingContext
): WebGLBuffer => {
  const colorBuffer = gl.createBuffer();

  if (!colorBuffer) {
    throw new Error("Failed to create color buffer");
  }

  gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);

  return colorBuffer;
};

const initializeBuffers = (
  vertexCount: number,
  drawMode: number,
  positions: number[],
  colors: number[],
  gl: WebGLRenderingContext
): GameObject => {
  const position = initializePositionBuffer(positions, gl);
  const color = initializeColorBuffer(colors, gl);

  return {
    vertexCount,
    drawMode,
    position,
    color,
  };
};

const setVertexPositionAttribute = (
  buffers: GameObject,
  programInfo: ShaderProgramInfo,
  gl: WebGLRenderingContext
) => {
  const numComponents = 2;
  const type = gl.FLOAT;
  const normalize = false;
  const stride = 0;
  const offset = 0;
  gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);
  gl.vertexAttribPointer(
    programInfo.attribLocations.vertexPosition,
    numComponents,
    type,
    normalize,
    stride,
    offset
  );
  gl.enableVertexAttribArray(programInfo.attribLocations.vertexPosition);
};

const setVertexColorAttribute = (
  buffers: GameObject,
  programInfo: ShaderProgramInfo,
  gl: WebGLRenderingContext
) => {
  const numComponents = 4;
  const type = gl.FLOAT;
  const normalize = false;
  const stride = 0;
  const offset = 0;
  gl.bindBuffer(gl.ARRAY_BUFFER, buffers.color);
  gl.vertexAttribPointer(
    programInfo.attribLocations.vertexColor,
    numComponents,
    type,
    normalize,
    stride,
    offset
  );
  gl.enableVertexAttribArray(programInfo.attribLocations.vertexColor);
};

const setShaderUniforms = (
  programInfo: ShaderProgramInfo,
  projectionMatrix: mat4,
  modelViewMatrix: mat4,
  gl: WebGLRenderingContext
) => {
  gl.uniformMatrix4fv(
    programInfo.uniformLocations.projectionMatrix,
    false,
    projectionMatrix
  );
  gl.uniformMatrix4fv(
    programInfo.uniformLocations.modelViewMatrix,
    false,
    modelViewMatrix
  );
};

const drawGameObject = (
  gameObject: GameObject,
  programInfo: ShaderProgramInfo,
  projectionMatrix: mat4,
  modelViewMatrix: mat4,
  gl: WebGLRenderingContext
) => {
  setVertexPositionAttribute(gameObject, programInfo, gl);
  setVertexColorAttribute(gameObject, programInfo, gl);

  gl.useProgram(programInfo.program);

  setShaderUniforms(programInfo, projectionMatrix, modelViewMatrix, gl);

  const offset = 0;
  gl.drawArrays(gameObject.drawMode, offset, gameObject.vertexCount);
};

const isSingleColor = <TMultiColor extends Color[]>(
  color: Color | TMultiColor
): color is Color => {
  return !color.some((c) => Array.isArray(c));
};

export const initializeScene = (
  options: InitializeContextOptions,
  gl: WebGLRenderingContext
): SceneContext => {
  initializeDepth(options, gl);
  const projectionMatrix = initializeProjectionMatrix(options);
  const modelViewMatrix = initializeModelViewMatrix();
  const programInfo = initializeShaderProgram(gl);
  const gameObjects: GameObject[] = [];

  const createTriangle = (triangle: Triangle, color: Color | TriangleColor) => {
    const positions = triangle.flat();
    const colors = isSingleColor(color)
      ? [...color, ...color, ...color, ...color]
      : color.flat();
    const buffers = initializeBuffers(
      3,
      gl.TRIANGLE_STRIP,
      positions,
      colors,
      gl
    );
    gameObjects.push(buffers);
  };

  const createRectangle = (rec: Rectangle, color: Color | RectangleColor) => {
    const positions = rec.flat();
    const colors = isSingleColor(color)
      ? [...color, ...color, ...color, ...color]
      : color.flat();
    const buffers = initializeBuffers(
      4,
      gl.TRIANGLE_STRIP,
      positions,
      colors,
      gl
    );
    gameObjects.push(buffers);
  };

  const createCircle = (
    center: Vector2,
    radius: number,
    resolution: number,
    color: Color
  ) => {
    const positions = [...center];

    const stops = resolution;

    for (let i = 0; i <= stops; i++) {
      positions.push(Math.cos((i * 2 * Math.PI) / stops) * radius + center[0]); // x coord
      positions.push(Math.sin((i * 2 * Math.PI) / stops) * radius + center[1]); // y coord
    }

    const colors = [...color];

    for (let i = 0; i <= stops; i++) {
      colors.push(...color);
    }

    const buffers = initializeBuffers(
      stops + 2,
      gl.TRIANGLE_FAN,
      positions,
      colors,
      gl
    );
    gameObjects.push(buffers);
  };

  const drawScene = () => {
    for (const gameObject of gameObjects) {
      drawGameObject(
        gameObject,
        programInfo,
        projectionMatrix,
        modelViewMatrix,
        gl
      );
    }
  };

  return {
    createRectangle,
    createTriangle,
    createCircle,
    drawScene,
  };
};

export const clear = (
  color: Color,
  depth: number,
  gl: WebGLRenderingContext
) => {
  gl.clearColor(...color);
  gl.clearDepth(depth);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
};

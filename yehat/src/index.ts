import { ReadonlyVec2, mat4, vec3 } from "gl-matrix";

import { colorPolygonFsSource } from "./shaders/colorPolygonFs";
import { colorPolygonVsSource } from "./shaders/colorPolygonVs";
import { texturePolygonFsSource } from "./shaders/texturePolygonFs";
import { texturePolygonVsSource } from "./shaders/texturePolygonVs";

export * from "./constants";

const isCanvasElement = (el: Element): el is HTMLCanvasElement =>
  "getContext" in el;

export type Color = [red: number, green: number, blue: number, alpha: number];

export type TriangleColor = [a: Color, b: Color, c: Color];

export type RectangleColor = [
  topLeft: Color,
  topRight: Color,
  bottomRight: Color,
  bottomLeft: Color
];

interface RectangleColorMaterial {
  type: "color";
  color: Color | RectangleColor;
}

interface TextureMaterial {
  type: "texture";
  texture: WebGLTexture;
}

export type RectangleMaterial = RectangleColorMaterial | TextureMaterial;

interface GameObjectColorMaterial {
  type: "color";
  colors: number[];
}

interface GameObjectTextureMaterial {
  type: "texture";
  texture: WebGLTexture;
  textureCoordinates: number[];
}

export type GameObjectMaterial =
  | GameObjectColorMaterial
  | GameObjectTextureMaterial;

export type Vector2 = [x: number, y: number];

export type Triangle = [a: Vector2, b: Vector2, c: Vector2];

export type Rectangle = [
  topLeft: Vector2,
  topRight: Vector2,
  bottomRight: Vector2,
  bottomLeft: Vector2
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
  createTriangle: (
    triangle: Triangle,
    color: Color | TriangleColor
  ) => GameObject;
  createRectangle: (rec: Rectangle, material: RectangleMaterial) => GameObject;
  createCircle: (
    center: Vector2,
    radius: number,
    resolution: number,
    color: Color
  ) => GameObject;
  translate2D: (delta: ReadonlyVec2, gameObject: GameObject) => void;
  scale2D: (value: number, gameObject: GameObject) => void;
  rotate2D: (value: number, gameObject: GameObject) => void;
  drawScene: () => void;
}

interface ColorAttribLocations {
  vertexPosition: number;
  vertexColor: number;
}

interface TextureAttribLocations {
  vertexPosition: number;
  textureCoord: number;
}

interface UniformLocations {
  projectionMatrix: WebGLUniformLocation;
  modelViewMatrix: WebGLUniformLocation;
}

interface TextureUniformLocations extends UniformLocations {
  sampler: WebGLUniformLocation;
}

interface ColorShaderProgram {
  program: WebGLProgram;
  type: "color";
  attribLocations: ColorAttribLocations;
  uniformLocations: UniformLocations;
}

interface TextureShaderProgram {
  program: WebGLProgram;
  type: "texture";
  attribLocations: TextureAttribLocations;
  uniformLocations: TextureUniformLocations;
}

type ShaderProgram = ColorShaderProgram | TextureShaderProgram;

export interface GameObject {
  modelViewMatrix: mat4;
  vertexCount: number;
  drawMode: number;
  positionBuffer: WebGLBuffer;
  materialBuffer: MaterialBuffer;
  shaderProgram: ShaderProgram;
}

interface ColorBuffer {
  type: "color";
  colorBuffer: WebGLBuffer;
}

interface TextureBuffer {
  type: "texture";
  textureCoordBuffer: WebGLBuffer;
}

type MaterialBuffer = ColorBuffer | TextureBuffer;

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

const createShaderProgram = (
  gl: WebGLRenderingContext,
  vertexShader: WebGLShader,
  fragmentShader: WebGLShader
) => {
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

  return shaderProgram;
};

const getUniformLocationOrFail = (
  gl: WebGLRenderingContext,
  shaderProgram: WebGLProgram,
  name: string
) => {
  const location = gl.getUniformLocation(shaderProgram, name);

  if (!location) {
    throw new Error(`Failed to get the uniform location for ${name}.`);
  }

  return location;
};

const initializeColorShaderProgram = (
  gl: WebGLRenderingContext
): ColorShaderProgram => {
  const vertexShader = loadShader(gl, gl.VERTEX_SHADER, colorPolygonVsSource);
  const fragmentShader = loadShader(
    gl,
    gl.FRAGMENT_SHADER,
    colorPolygonFsSource
  );

  const shaderProgram = createShaderProgram(gl, vertexShader, fragmentShader);

  const projectionMatrix = getUniformLocationOrFail(
    gl,
    shaderProgram,
    "uProjectionMatrix"
  );

  const modelViewMatrix = getUniformLocationOrFail(
    gl,
    shaderProgram,
    "uModelViewMatrix"
  );

  return {
    program: shaderProgram,
    type: "color",
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

const initializeTextureShaderProgram = (
  gl: WebGLRenderingContext
): TextureShaderProgram => {
  const vertexShader = loadShader(gl, gl.VERTEX_SHADER, texturePolygonVsSource);
  const fragmentShader = loadShader(
    gl,
    gl.FRAGMENT_SHADER,
    texturePolygonFsSource
  );

  const shaderProgram = createShaderProgram(gl, vertexShader, fragmentShader);

  const projectionMatrix = getUniformLocationOrFail(
    gl,
    shaderProgram,
    "uProjectionMatrix"
  );

  const modelViewMatrix = getUniformLocationOrFail(
    gl,
    shaderProgram,
    "uModelViewMatrix"
  );

  const sampler = getUniformLocationOrFail(gl, shaderProgram, "uSampler");

  return {
    program: shaderProgram,
    type: "texture",
    attribLocations: {
      vertexPosition: gl.getAttribLocation(shaderProgram, "aVertexPosition"),
      textureCoord: gl.getAttribLocation(shaderProgram, "aTextureCoord"),
    },
    uniformLocations: {
      projectionMatrix,
      modelViewMatrix,
      sampler,
    },
  };
};

const initializePositionBuffer = (
  gl: WebGLRenderingContext,
  positions: number[]
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
  gl: WebGLRenderingContext,
  colors: number[]
): WebGLBuffer => {
  const colorBuffer = gl.createBuffer();

  if (!colorBuffer) {
    throw new Error("Failed to create color buffer");
  }

  gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);

  return colorBuffer;
};

const initializeTextureCoordBuffer = (
  gl: WebGLRenderingContext,
  textureCoordinates: number[]
) => {
  const textureCoordBuffer = gl.createBuffer();

  if (!textureCoordBuffer) {
    throw new Error("Failed to create texture coordinate buffer");
  }

  gl.bindBuffer(gl.ARRAY_BUFFER, textureCoordBuffer);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array(textureCoordinates),
    gl.STATIC_DRAW
  );

  return textureCoordBuffer;
};

const initializeMaterialBuffer = (
  gl: WebGLRenderingContext,
  material: GameObjectMaterial
): MaterialBuffer => {
  if (material.type === "color") {
    const colorBuffer = initializeColorBuffer(gl, material.colors);
    return { type: "color", colorBuffer };
  } else {
    const textureCoordBuffer = initializeTextureCoordBuffer(
      gl,
      material.textureCoordinates
    );
    return { type: "texture", textureCoordBuffer };
  }
};

const initializeGameObject = (
  gl: WebGLRenderingContext,
  shaderProgram: ShaderProgram,
  vertexCount: number,
  drawMode: number,
  positions: number[],
  material: GameObjectMaterial
): GameObject => {
  const modelViewMatrix = initializeModelViewMatrix();
  const positionBuffer = initializePositionBuffer(gl, positions);
  const materialBuffer = initializeMaterialBuffer(gl, material);

  return {
    shaderProgram,
    modelViewMatrix,
    vertexCount,
    drawMode,
    positionBuffer: positionBuffer,
    materialBuffer,
  };
};

const setVertexPositionAttribute = (
  gl: WebGLRenderingContext,
  gameObject: GameObject
) => {
  const numComponents = 2;
  const type = gl.FLOAT;
  const normalize = false;
  const stride = 0;
  const offset = 0;
  gl.bindBuffer(gl.ARRAY_BUFFER, gameObject.positionBuffer);
  gl.vertexAttribPointer(
    gameObject.shaderProgram.attribLocations.vertexPosition,
    numComponents,
    type,
    normalize,
    stride,
    offset
  );
  gl.enableVertexAttribArray(
    gameObject.shaderProgram.attribLocations.vertexPosition
  );
};

const setMaterialAttribute = (
  gl: WebGLRenderingContext,
  gameObject: GameObject
) => {
  if (
    gameObject.materialBuffer.type === "color" &&
    gameObject.shaderProgram.type === "color"
  ) {
    const numComponents = 4;
    const type = gl.FLOAT;
    const normalize = false;
    const stride = 0;
    const offset = 0;
    gl.bindBuffer(gl.ARRAY_BUFFER, gameObject.materialBuffer.colorBuffer);
    gl.vertexAttribPointer(
      gameObject.shaderProgram.attribLocations.vertexColor,
      numComponents,
      type,
      normalize,
      stride,
      offset
    );
    gl.enableVertexAttribArray(
      gameObject.shaderProgram.attribLocations.vertexColor
    );
  } else if (
    gameObject.materialBuffer.type === "texture" &&
    gameObject.shaderProgram.type === "texture"
  ) {
    const numComponents = 2;
    const type = gl.FLOAT;
    const normalize = false;
    const stride = 0;
    const offset = 0;
    gl.bindBuffer(
      gl.ARRAY_BUFFER,
      gameObject.materialBuffer.textureCoordBuffer
    );
    gl.vertexAttribPointer(
      gameObject.shaderProgram.attribLocations.textureCoord,
      numComponents,
      type,
      normalize,
      stride,
      offset
    );
    gl.enableVertexAttribArray(
      gameObject.shaderProgram.attribLocations.textureCoord
    );
  }
};

const setShaderUniforms = (
  programInfo: ShaderProgram,
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
  gl: WebGLRenderingContext,
  projectionMatrix: mat4,
  gameObject: GameObject
) => {
  setVertexPositionAttribute(gl, gameObject);
  setMaterialAttribute(gl, gameObject);

  gl.useProgram(gameObject.shaderProgram.program);

  setShaderUniforms(
    gameObject.shaderProgram,
    projectionMatrix,
    gameObject.modelViewMatrix,
    gl
  );

  const offset = 0;
  gl.drawArrays(gameObject.drawMode, offset, gameObject.vertexCount);
};

const isSingleColor = <TMultiColor extends Color[]>(
  color: Color | TMultiColor
): color is Color => {
  return !color.some((c) => Array.isArray(c));
};

const getGameObjectMaterial = (
  material: RectangleMaterial
): GameObjectMaterial => {
  if (material.type === "color") {
    if (isSingleColor(material.color)) {
      return {
        type: "color",
        colors: [
          ...material.color,
          ...material.color,
          ...material.color,
          ...material.color,
        ],
      };
    } else {
      return {
        type: "color",
        colors: material.color.flat(),
      };
    }
  } else {
    return {
      type: "texture",
      texture: material.texture,
      textureCoordinates: [1, 1, 0, 1, 1, 0, 0, 0],
    };
  }
};

export const initializeScene = (
  options: InitializeContextOptions,
  gl: WebGLRenderingContext
): SceneContext => {
  initializeDepth(options, gl);
  const projectionMatrix = initializeProjectionMatrix(options);
  const colorProgramInfo = initializeColorShaderProgram(gl);
  const textureProgramInfo = initializeTextureShaderProgram(gl);
  const gameObjects: GameObject[] = [];

  const createTriangle = (
    triangle: Triangle,
    color: Color | TriangleColor
  ): GameObject => {
    const positions = triangle.flat();
    const colors = isSingleColor(color)
      ? [...color, ...color, ...color, ...color]
      : color.flat();
    const gameObject = initializeGameObject(
      gl,
      colorProgramInfo,
      3,
      gl.TRIANGLE_STRIP,
      positions,
      { type: "color", colors }
    );
    gameObjects.push(gameObject);
    return gameObject;
  };

  const createRectangle = (
    rec: Rectangle,
    rectangleMaterial: RectangleMaterial
  ): GameObject => {
    const positions = rec.flat();
    const material = getGameObjectMaterial(rectangleMaterial);

    const gameObject = initializeGameObject(
      gl,
      rectangleMaterial.type === "color"
        ? colorProgramInfo
        : textureProgramInfo,
      4,
      gl.TRIANGLE_STRIP,
      positions,
      material
    );
    gameObjects.push(gameObject);
    return gameObject;
  };

  const createCircle = (
    center: Vector2,
    radius: number,
    resolution: number,
    color: Color
  ): GameObject => {
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

    const gameObject = initializeGameObject(
      gl,
      colorProgramInfo,
      stops + 2,
      gl.TRIANGLE_FAN,
      positions,
      { type: "color", colors }
    );
    gameObjects.push(gameObject);
    return gameObject;
  };

  const translate2D = (
    delta: ReadonlyVec2,
    { modelViewMatrix }: GameObject
  ) => {
    mat4.translate(
      modelViewMatrix,
      modelViewMatrix,
      vec3.fromValues(delta[0], delta[1], 0.0)
    );
  };

  const scale2D = (value: number, { modelViewMatrix }: GameObject) => {
    mat4.scale(
      modelViewMatrix,
      modelViewMatrix,
      vec3.fromValues(value, value, 0.0)
    );
  };

  const rotate2D = (value: number, { modelViewMatrix }: GameObject) => {
    mat4.rotateZ(modelViewMatrix, modelViewMatrix, value);
  };

  const drawScene = () => {
    for (const gameObject of gameObjects) {
      drawGameObject(gl, projectionMatrix, gameObject);
    }
  };

  return {
    createRectangle,
    createTriangle,
    createCircle,
    translate2D,
    scale2D,
    rotate2D,
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

export const loadTexture = (gl: WebGLRenderingContext, url: string) => {
  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);

  const level = 0;
  const internalFormat = gl.RGBA;
  const width = 1;
  const height = 1;
  const border = 0;
  const srcFormat = gl.RGBA;
  const srcType = gl.UNSIGNED_BYTE;
  const pixel = new Uint8Array([0, 0, 255, 255]);
  gl.texImage2D(
    gl.TEXTURE_2D,
    level,
    internalFormat,
    width,
    height,
    border,
    srcFormat,
    srcType,
    pixel
  );

  const image = new Image();
  image.onload = () => {
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(
      gl.TEXTURE_2D,
      level,
      internalFormat,
      srcFormat,
      srcType,
      image
    );

    if (isPowerOf2(image.width) && isPowerOf2(image.height)) {
      gl.generateMipmap(gl.TEXTURE_2D);
    } else {
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    }
  };
  image.src = url;

  return texture;
};

const isPowerOf2 = (value: number) => (value & (value - 1)) == 0;

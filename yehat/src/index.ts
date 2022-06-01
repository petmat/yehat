import { ReadonlyVec2, mat4, vec2, vec3 } from "gl-matrix";

import { colorPolygonFsSource } from "./shaders/colorPolygonFs";
import { colorPolygonVsSource } from "./shaders/colorPolygonVs";
import { spriteFsSource } from "./shaders/spriteFs";
import { spriteVsSource } from "./shaders/spriteVs";
import { texturePolygonFsSource } from "./shaders/texturePolygonFs";
import { texturePolygonVsSource } from "./shaders/texturePolygonVs";

export * from "./colors";

const vec2AttribSize = 2;
const colorAttribSize = 4;

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
  texture: TextureInfo;
  stretch?: boolean;
  scale?: number;
}

export type RectangleMaterial = RectangleColorMaterial | TextureMaterial;

interface GameObjectColorMaterial {
  type: "color";
  colors: number[];
}

interface GameObjectTextureMaterial {
  type: "texture";
  texture: TextureInfo;
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

export interface SceneOptions {
  depthTestEnabled: boolean;
  depthFunc: number;
  fieldOfView: number;
  zNear: number;
  zFar: number;
}

export interface SceneContext {
  createTriangle: (
    triangle: Triangle,
    color: Color | TriangleColor
  ) => Transformable2DGameObject;
  createRectangle: (
    x: number,
    y: number,
    width: number,
    height: number,
    material: RectangleMaterial
  ) => Transformable2DGameObject;
  createCircle: (
    center: Vector2,
    radius: number,
    resolution: number,
    color: Color
  ) => Transformable2DGameObject;
  createSprite: (
    point: Vector2,
    size: number,
    texture: TextureInfo
  ) => GameObject;
  translate2D: (
    delta: ReadonlyVec2,
    gameObject: Transformable2DGameObject
  ) => void;
  scale2D: (value: number, gameObject: Transformable2DGameObject) => void;
  rotate2D: (value: number, gameObject: Transformable2DGameObject) => void;
  clear: (color: Color, depth?: number) => void;
  drawScene: () => void;
  loadTexture: (url: string) => Promise<TextureInfo>;
}

interface ColorAttribLocations {
  position: number;
  vertexColor: number;
}

interface TextureAttribLocations {
  position: number;
  textureCoord: number;
}

interface UniformLocations {
  projectionMatrix: WebGLUniformLocation;
  modelViewMatrix: WebGLUniformLocation;
  screenSize: WebGLUniformLocation;
}

interface ColorShaderProgram {
  program: WebGLProgram;
  type: "color";
  attribLocations: ColorAttribLocations;
  uniformLocations: UniformLocations;
}

interface TextureUniformLocations extends UniformLocations {
  texture: WebGLUniformLocation;
}

interface TextureShaderProgram {
  program: WebGLProgram;
  type: "texture";
  attribLocations: TextureAttribLocations;
  uniformLocations: TextureUniformLocations;
}

interface SpriteAttribLocations {
  spritePosition: number;
  spriteSize: number;
}

interface SpriteUniformLocations {
  screenSize: WebGLUniformLocation;
  texture: WebGLUniformLocation;
}

interface SpriteShaderProgram {
  program: WebGLProgram;
  type: "sprite";
  attribLocations: SpriteAttribLocations;
  uniformLocations: SpriteUniformLocations;
}

interface GameObjectAttribute {
  location: number;
  size: number;
  buffer: WebGLBuffer;
}

type UniformKey =
  | "modelViewMatrix"
  | "projectionMatrix"
  | "screenSize"
  | "texture";

interface Uniform1i {
  type: "1i";
  location: WebGLUniformLocation;
  value: number;
}

interface Uniform1f {
  type: "1f";
  location: WebGLUniformLocation;
  value: number;
}

interface Uniform2f {
  type: "2f";
  location: WebGLUniformLocation;
  valueX: number;
  valueY: number;
}

interface Uniform2fv {
  type: "2fv";
  location: WebGLUniformLocation;
  value: vec2;
}

interface UniformMatrix4fv {
  type: "Matrix4fv";
  location: WebGLUniformLocation;
  transpose: boolean;
  value: mat4;
}

type GameObjectUniform =
  | Uniform1i
  | Uniform1f
  | Uniform2f
  | Uniform2fv
  | UniformMatrix4fv;

export interface Transformable2D {
  uniforms: { modelViewMatrix: UniformMatrix4fv };
}

export interface GameObject {
  vertexCount: number;
  drawMode: number;
  shaderProgram: WebGLProgram;
  attributes: GameObjectAttribute[];
  uniforms: Partial<Record<UniformKey, GameObjectUniform>>;
  texture?: WebGLTexture;
}

type Transformable2DGameObject = GameObject & Transformable2D;

export interface TextureInfo {
  textureIndex: number;
  width: number;
  height: number;
  texture: WebGLTexture;
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

const initializeDepth = (gl: WebGLRenderingContext, options: SceneOptions) => {
  const { depthTestEnabled, depthFunc } = options;
  if (depthTestEnabled) {
    gl.enable(gl.DEPTH_TEST);
  }

  gl.depthFunc(depthFunc);
};

const initializeProjectionMatrix = (
  canvasWidth: number,
  canvasHeight: number,
  options: SceneOptions
) => {
  const { fieldOfView, zNear, zFar } = options;

  const aspectRatio = canvasWidth / canvasHeight;
  const projectionMatrix = mat4.create();
  //mat4.perspective(projectionMatrix, fieldOfView, aspectRatio, zNear, zFar);

  return projectionMatrix;
};

const initializeModelViewMatrix = () => {
  const modelViewMatrix = mat4.create();
  mat4.translate(modelViewMatrix, modelViewMatrix, [-0.0, 0.0, -0.0]);
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

  const screenSize = getUniformLocationOrFail(gl, shaderProgram, "screenSize");
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
      position: gl.getAttribLocation(shaderProgram, "position"),
      vertexColor: gl.getAttribLocation(shaderProgram, "aVertexColor"),
    },
    uniformLocations: {
      screenSize,
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

  const screenSize = getUniformLocationOrFail(gl, shaderProgram, "screenSize");
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

  const texture = getUniformLocationOrFail(gl, shaderProgram, "texture");

  return {
    program: shaderProgram,
    type: "texture",
    attribLocations: {
      position: gl.getAttribLocation(shaderProgram, "position"),
      textureCoord: gl.getAttribLocation(shaderProgram, "aTextureCoord"),
    },
    uniformLocations: {
      screenSize,
      projectionMatrix,
      modelViewMatrix,
      texture,
    },
  };
};

const initializeSpriteShaderProgram = (
  gl: WebGLRenderingContext
): SpriteShaderProgram => {
  const vertexShader = loadShader(gl, gl.VERTEX_SHADER, spriteVsSource);
  const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, spriteFsSource);

  const shaderProgram = createShaderProgram(gl, vertexShader, fragmentShader);

  const screenSize = getUniformLocationOrFail(gl, shaderProgram, "screenSize");
  const texture = getUniformLocationOrFail(gl, shaderProgram, "texture");

  return {
    program: shaderProgram,
    type: "sprite",
    attribLocations: {
      spritePosition: gl.getAttribLocation(shaderProgram, "spritePosition"),
      spriteSize: gl.getAttribLocation(shaderProgram, "spriteSize"),
    },
    uniformLocations: {
      screenSize,
      texture,
    },
  };
};

const initializeBuffer = (
  gl: WebGLRenderingContext,
  values: number[]
): WebGLBuffer => {
  const buffer = gl.createBuffer();

  if (!buffer) {
    throw new Error("Failed to create position buffer");
  }

  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(values), gl.STATIC_DRAW);

  return buffer;
};

const initializeColorAttribute = (
  gl: WebGLRenderingContext,
  colorShaderProgram: ColorShaderProgram,
  colors: number[]
): GameObjectAttribute => {
  const colorBuffer = initializeBuffer(gl, colors);
  return {
    location: colorShaderProgram.attribLocations.vertexColor,
    size: colorAttribSize,
    buffer: colorBuffer,
  };
};

const initializeMaterialUniforms = (
  textureShaderProgram: TextureShaderProgram,
  material: GameObjectMaterial
) => {
  if (material.type === "color") {
    return {};
  } else {
    const textureUniform: Uniform1i = {
      type: "1i",
      location: textureShaderProgram.uniformLocations.texture,
      value: material.texture.textureIndex,
    };

    return { texture: textureUniform };
  }
};

const initializeMaterialAttributes = (
  gl: WebGLRenderingContext,
  colorShaderProgram: ColorShaderProgram,
  textureShaderProgram: TextureShaderProgram,
  material: GameObjectMaterial
): GameObjectAttribute[] => {
  if (material.type === "color") {
    return [initializeColorAttribute(gl, colorShaderProgram, material.colors)];
  } else {
    const textureCoordBuffer = initializeBuffer(
      gl,
      material.textureCoordinates
    );

    return [
      {
        location: textureShaderProgram.attribLocations.textureCoord,
        size: vec2AttribSize,
        buffer: textureCoordBuffer,
      },
    ];
  }
};

const setAttribute = (
  gl: WebGLRenderingContext,
  buffer: WebGLBuffer,
  location: number,
  size: number
) => {
  const type = gl.FLOAT;
  const normalize = false;
  const stride = 0;
  const offset = 0;
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.vertexAttribPointer(location, size, type, normalize, stride, offset);
  gl.enableVertexAttribArray(location);
};

const drawGameObject = (gl: WebGLRenderingContext, gameObject: GameObject) => {
  for (const attribute of gameObject.attributes) {
    setAttribute(gl, attribute.buffer, attribute.location, attribute.size);
  }

  gl.useProgram(gameObject.shaderProgram);

  for (const uniform of Object.values(gameObject.uniforms)) {
    switch (uniform.type) {
      case "1i":
        gl.uniform1i(uniform.location, uniform.value);
        break;
      case "1f":
        gl.uniform1f(uniform.location, uniform.value);
        break;
      case "2f":
        gl.uniform2f(uniform.location, uniform.valueX, uniform.valueY);
        break;
      case "2fv":
        gl.uniform2fv(uniform.location, uniform.value);
        break;
      case "Matrix4fv":
        gl.uniformMatrix4fv(uniform.location, uniform.transpose, uniform.value);
        break;
      default:
        throw new Error("Unsupported uniform");
    }
  }

  // This here is to allow transparency for the textures (sprites mostly)
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

  if (gameObject.texture) {
    activateTexture(gl, (gameObject.uniforms.texture as Uniform1i).value);
    gl.bindTexture(gl.TEXTURE_2D, gameObject.texture);
  }

  const offset = 0;
  gl.drawArrays(gameObject.drawMode, offset, gameObject.vertexCount);
};

const isSingleColor = <TMultiColor extends Color[]>(
  color: Color | TMultiColor
): color is Color => {
  return !color.some((c) => Array.isArray(c));
};

const getGameObjectMaterial = (
  material: RectangleMaterial,
  width: number,
  height: number
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
    const textureWidth = material.texture.width;
    const textureHeight = material.texture.height;
    const scale = material.scale ?? 1;

    return {
      type: "texture",
      texture: material.texture,
      textureCoordinates: [
        width / textureWidth / scale,
        height / textureHeight / scale,
        0,
        height / textureHeight / scale,
        width / textureWidth / scale,
        0,
        0,
        0,
      ],
    };
  }
};

const createTriangle =
  (
    gl: WebGLRenderingContext,
    colorShaderProgram: ColorShaderProgram,
    gameObjects: GameObject[],
    projectionMatrix: mat4
  ) =>
  (
    triangle: Triangle,
    color: Color | TriangleColor
  ): Transformable2DGameObject => {
    const positions = triangle.flat();
    const colors = isSingleColor(color)
      ? [...color, ...color, ...color, ...color]
      : color.flat();

    const modelViewMatrix = initializeModelViewMatrix();
    const positionBuffer = initializeBuffer(gl, positions);
    const colorAttribute = initializeColorAttribute(
      gl,
      colorShaderProgram,
      colors
    );

    const gameObject: Transformable2DGameObject = {
      drawMode: gl.TRIANGLE_STRIP,
      vertexCount: 3,
      shaderProgram: colorShaderProgram.program,
      uniforms: {
        modelViewMatrix: {
          type: "Matrix4fv",
          location: colorShaderProgram.uniformLocations.modelViewMatrix,
          transpose: false,
          value: modelViewMatrix,
        },
        projectionMatrix: {
          type: "Matrix4fv",
          location: colorShaderProgram.uniformLocations.projectionMatrix,
          transpose: false,
          value: projectionMatrix,
        },
      },
      attributes: [
        {
          location: colorShaderProgram.attribLocations.position,
          size: vec2AttribSize,
          buffer: positionBuffer,
        },
        colorAttribute,
      ],
    };

    gameObjects.push(gameObject);

    return gameObject;
  };

const createRectangle =
  (
    gl: WebGLRenderingContext,
    screenSize: vec2,
    colorShaderProgram: ColorShaderProgram,
    textureShaderProgram: TextureShaderProgram,
    gameObjects: GameObject[],
    projectionMatrix: mat4
  ) =>
  (
    x: number,
    y: number,
    width: number,
    height: number,
    rectangleMaterial: RectangleMaterial
  ): Transformable2DGameObject => {
    const positions = [
      x + width,
      y + height,
      x,
      y + height,
      x + width,
      y,
      x,
      y,
    ];
    const material = getGameObjectMaterial(rectangleMaterial, width, height);

    const modelViewMatrix = initializeModelViewMatrix();
    const positionBuffer = initializeBuffer(gl, positions);
    const materialUniforms = initializeMaterialUniforms(
      textureShaderProgram,
      material
    );
    const materialAttributes = initializeMaterialAttributes(
      gl,
      colorShaderProgram,
      textureShaderProgram,
      material
    );

    const program =
      material.type === "color" ? colorShaderProgram : textureShaderProgram;
    const screenSizeUniform: GameObjectUniform = {
      type: "2fv",
      location: program.uniformLocations.screenSize,
      value: screenSize,
    };
    const modelViewMatrixUniform: UniformMatrix4fv = {
      type: "Matrix4fv",
      location: program.uniformLocations.modelViewMatrix,
      transpose: false,
      value: modelViewMatrix,
    };
    const projectionMatrixUniform: UniformMatrix4fv = {
      type: "Matrix4fv",
      location: program.uniformLocations.projectionMatrix,
      transpose: false,
      value: projectionMatrix,
    };

    const gameObject: Transformable2DGameObject = {
      drawMode: gl.TRIANGLE_STRIP,
      vertexCount: 4,
      shaderProgram: program.program,
      uniforms: {
        screenSize: screenSizeUniform,
        modelViewMatrix: modelViewMatrixUniform,
        projectionMatrix: projectionMatrixUniform,
        ...materialUniforms,
      },
      attributes: [
        {
          location: program.attribLocations.position,
          size: vec2AttribSize,
          buffer: positionBuffer,
        },
        ...materialAttributes,
      ],
      texture:
        material.type === "texture" ? material.texture.texture : undefined,
    };

    gameObjects.push(gameObject);

    return gameObject;
  };

const createCircle =
  (
    gl: WebGLRenderingContext,
    colorShaderProgram: ColorShaderProgram,
    gameObjects: GameObject[],
    projectionMatrix: mat4
  ) =>
  (
    center: Vector2,
    radius: number,
    resolution: number,
    color: Color
  ): Transformable2DGameObject => {
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

    const modelViewMatrix = initializeModelViewMatrix();
    const positionBuffer = initializeBuffer(gl, positions);
    const colorAttribute = initializeColorAttribute(
      gl,
      colorShaderProgram,
      colors
    );

    const modelViewMatrixUniform: UniformMatrix4fv = {
      type: "Matrix4fv",
      location: colorShaderProgram.uniformLocations.modelViewMatrix,
      transpose: false,
      value: modelViewMatrix,
    };
    const projectionMatrixUniform: UniformMatrix4fv = {
      type: "Matrix4fv",
      location: colorShaderProgram.uniformLocations.projectionMatrix,
      transpose: false,
      value: projectionMatrix,
    };

    const gameObject: Transformable2DGameObject = {
      drawMode: gl.TRIANGLE_FAN,
      vertexCount: stops + 2,
      shaderProgram: colorShaderProgram.program,
      uniforms: {
        modelViewMatrix: modelViewMatrixUniform,
        projectionMatrix: projectionMatrixUniform,
      },
      attributes: [
        {
          location: colorShaderProgram.attribLocations.position,
          size: vec2AttribSize,
          buffer: positionBuffer,
        },
        colorAttribute,
      ],
    };

    gameObjects.push(gameObject);

    return gameObject;
  };

const createSprite =
  (
    gl: WebGLRenderingContext,
    screenSize: vec2,
    spriteShaderProgram: SpriteShaderProgram,
    gameObjects: GameObject[]
  ) =>
  (position: Vector2, size: number, textureInfo: TextureInfo) => {
    const screenSizeUniform: GameObjectUniform = {
      type: "2fv",
      location: spriteShaderProgram.uniformLocations.screenSize,
      value: screenSize,
    };
    const textureUniform: GameObjectUniform = {
      type: "1i",
      location: spriteShaderProgram.uniformLocations.texture,
      value: textureInfo.textureIndex,
    };

    const positionBuffer = initializeBuffer(gl, position);
    const positionAttribute = {
      location: spriteShaderProgram.attribLocations.spritePosition,
      size: vec2AttribSize,
      buffer: positionBuffer,
    };

    const sizeBuffer = initializeBuffer(gl, [size]);
    const sizeAttribute = {
      location: spriteShaderProgram.attribLocations.spriteSize,
      size: 1,
      buffer: sizeBuffer,
    };

    const gameObject: GameObject = {
      drawMode: gl.POINTS,
      vertexCount: 1,
      shaderProgram: spriteShaderProgram.program,
      uniforms: {
        screenSize: screenSizeUniform,
        texture: textureUniform,
      },
      attributes: [positionAttribute, sizeAttribute],
      texture: textureInfo.texture,
    };

    gameObjects.push(gameObject);

    return gameObject;
  };

const clear =
  (gl: WebGLRenderingContext) =>
  (color: Color, depth: number = 1) => {
    gl.clearColor(...color);
    gl.clearDepth(depth);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  };

const drawScene =
  (gl: WebGLRenderingContext, gameObjects: GameObject[]) => () => {
    for (const gameObject of gameObjects) {
      drawGameObject(gl, gameObject);
    }
  };

let textureCount = 0;

const activateTexture = (gl: WebGLRenderingContext, index: number) => {
  gl.activeTexture(
    (gl as unknown as Record<string, number>)[`TEXTURE${index}`]
  );
};

const loadTexture =
  (gl: WebGLRenderingContext) =>
  (url: string): Promise<TextureInfo> =>
    new Promise((resolve, reject) => {
      const texture = gl.createTexture();

      if (!texture) {
        reject(new Error("Failed to create texture"));
        return;
      }

      gl.bindTexture(gl.TEXTURE_2D, texture);

      const level = 0;
      const internalFormat = gl.RGBA;
      const srcFormat = gl.RGBA;
      const srcType = gl.UNSIGNED_BYTE;

      const image = new Image();
      image.onload = () => {
        const textureIndex = textureCount;
        activateTexture(gl, textureIndex);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(
          gl.TEXTURE_2D,
          level,
          internalFormat,
          srcFormat,
          srcType,
          image
        );
        // if (isPowerOf2(image.width) && isPowerOf2(image.height)) {
        //   gl.generateMipmap(gl.TEXTURE_2D);
        // } else {
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        // }

        textureCount = textureCount + 1;
        resolve({
          textureIndex,
          width: image.width,
          height: image.height,
          texture,
        });
      };
      image.src = url;
    });

const translate2D = (
  delta: ReadonlyVec2,
  gameObject: Transformable2DGameObject
) => {
  const modelViewMatrix = gameObject.uniforms.modelViewMatrix.value;

  mat4.translate(
    modelViewMatrix,
    modelViewMatrix,
    vec3.fromValues(delta[0], delta[1], 0.0)
  );
};

const scale2D = (value: number, gameObject: Transformable2DGameObject) => {
  const modelViewMatrix = gameObject.uniforms.modelViewMatrix.value;

  mat4.scale(
    modelViewMatrix,
    modelViewMatrix,
    vec3.fromValues(value, value, 0.0)
  );
};

const rotate2D = (value: number, gameObject: Transformable2DGameObject) => {
  const modelViewMatrix = gameObject.uniforms.modelViewMatrix.value;

  mat4.rotateZ(modelViewMatrix, modelViewMatrix, value);
};

export const initializeScene = (
  gl: WebGLRenderingContext,
  options?: Partial<SceneOptions>
): SceneContext => {
  const defaultSceneOptions: SceneOptions = {
    depthTestEnabled: true,
    depthFunc: gl.LEQUAL,
    fieldOfView: (45 * Math.PI) / 360,
    zNear: 0.1,
    zFar: 100.0,
  };
  const combinedOptions = { ...defaultSceneOptions, ...options };

  initializeDepth(gl, combinedOptions);
  const screenSize = new Float32Array([
    gl.canvas.clientWidth,
    gl.canvas.clientHeight,
  ]);
  const projectionMatrix = initializeProjectionMatrix(
    screenSize[0],
    screenSize[1],
    combinedOptions
  );

  const colorShaderProgram = initializeColorShaderProgram(gl);
  const textureShaderProgram = initializeTextureShaderProgram(gl);
  const spriteShaderProgram = initializeSpriteShaderProgram(gl);

  const gameObjects: GameObject[] = [];

  return {
    createTriangle: createTriangle(
      gl,
      colorShaderProgram,
      gameObjects,
      projectionMatrix
    ),
    createRectangle: createRectangle(
      gl,
      screenSize,
      colorShaderProgram,
      textureShaderProgram,
      gameObjects,
      projectionMatrix
    ),
    createCircle: createCircle(
      gl,
      colorShaderProgram,
      gameObjects,
      projectionMatrix
    ),
    createSprite: createSprite(
      gl,
      screenSize,
      spriteShaderProgram,
      gameObjects
    ),
    translate2D,
    scale2D,
    rotate2D,
    clear: clear(gl),
    drawScene: drawScene(gl, gameObjects),
    loadTexture: loadTexture(gl),
  };
};

const isPowerOf2 = (value: number) => (value & (value - 1)) == 0;

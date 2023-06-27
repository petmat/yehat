import * as O from "fp-ts/lib/Option";
import { range } from "fp-ts/lib/ReadonlyNonEmptyArray";
import {
  DrawMode,
  GameObject2D,
  GameObject2DCreated,
  Texture,
  calculateAspectRatio,
} from "./core";
import { vector2, vector4 } from "./math";
import { assoc } from "./utils";
import { vec2 } from "gl-matrix";

const getAspectRatio = (gl: WebGLRenderingContext) =>
  gl.canvas.width / gl.canvas.height;

export const createRectangleShape = () =>
  new Float32Array([
    -0.5, 0.5, 0.5, 0.5, 0.5, -0.5, -0.5, 0.5, 0.5, -0.5, -0.5, -0.5,
  ]);

export const getRectangleDrawMode = () => DrawMode.Triangles;

export const createRectangleTextureCoords = () =>
  new Float32Array([0, 1, 1, 1, 1, 0, 0, 1, 1, 0, 0, 0]);

export const createRectangle =
  (gl: WebGLRenderingContext) => (): GameObject2DCreated => ({
    vertices: createRectangleShape(),
    translation: vector2.zero(),
    scale: vector2.create(1.0, getAspectRatio(gl)),
    rotation: vector2.create(0, 1),
    color: vector4.create(1.0, 1.0, 1.0, 1.0),
    drawMode: getRectangleDrawMode(),
    texture: O.none,
    textureCoords: createRectangleTextureCoords(),
  });

export const createTriangleShape = () =>
  new Float32Array([0, 0.5, 0.5, -0.5, -0.5, -0.5]);

export const getTriangleDrawMode = () => DrawMode.Triangles;

export const createTriangleTextureCoords = () =>
  new Float32Array([0, 0, 0, 0, 0, 0, 0, 0]);

export const createTriangle =
  (gl: WebGLRenderingContext) => (): GameObject2DCreated => ({
    vertices: createTriangleShape(),
    translation: vector2.zero(),
    scale: vector2.create(1.0, getAspectRatio(gl)),
    rotation: vector2.create(0, 1),
    color: vector4.create(1.0, 1.0, 1.0, 1.0),
    drawMode: getTriangleDrawMode(),
    texture: O.none,
    textureCoords: createTriangleTextureCoords(),
  });

export const createCircleShape = () =>
  new Float32Array(
    [
      0.0,
      0.0,
      ...range(0, 30).map((i) => [
        Math.cos((i * 2 * Math.PI) / 30) * 0.5,
        Math.sin((i * 2 * Math.PI) / 30) * 0.5,
      ]),
    ].flat()
  );

export const getCircleDrawMode = () => DrawMode.TriangleFan;

export const createCircleTextureCoords = () =>
  new Float32Array(
    [
      0.0,
      0.0,
      ...range(0, 30).map((i) => [
        Math.cos((i * 2 * Math.PI) / 30) * 0.5,
        Math.sin((i * 2 * Math.PI) / 30) * 0.5,
      ]),
    ].flat()
  );

export const createCircle =
  (gl: WebGLRenderingContext) => (): GameObject2DCreated => ({
    vertices: createCircleShape(),
    translation: vector2.zero(),
    scale: vector2.create(1.0, getAspectRatio(gl) * 1.0),
    rotation: vector2.create(0, 1),
    color: vector4.create(1.0, 1.0, 1.0, 1.0),
    drawMode: getCircleDrawMode(),
    texture: O.none,
    textureCoords: createCircleTextureCoords(),
  });

export const setScale = assoc<GameObject2D>("scale");

export const setTranslation = assoc<GameObject2D>("translation");

export const setColor = assoc<GameObject2D>("color");

export const setRotation = assoc<GameObject2D>("rotation");

export const setTexture = assoc<GameObject2D>("texture");

export const setScaleLockAspectRatio =
  (value: number) => (gl: WebGLRenderingContext) =>
    setScale(vector2.create(value, calculateAspectRatio(gl) * value));

export const emptyTextures = () => new Map<number, Texture>();

export const addTexture =
  (index: number, url: string) =>
  (textures: Map<number, Texture>): Map<number, Texture> => {
    const newTextures = new Map<number, Texture>(textures);
    newTextures.set(index, { url });
    return newTextures;
  };

import * as O from "fp-ts/lib/Option";
import {
  DrawMode,
  GameObject2D,
  GameObject2DCreated,
  Texture,
  calculateAspectRatio,
} from "./core";
import { addV2, createV2, createV4, zeroV2 } from "./math";
import { assoc, log, logF, tap } from "./utils";
import { vec2 } from "gl-matrix";
import { identity, pipe } from "fp-ts/lib/function";
import { chunksOf, flatten, reverse } from "fp-ts/lib/Array";
import { range } from "fp-ts/lib/NonEmptyArray";
import { monoidString } from "fp-ts/lib/Monoid";
import { semigroupString } from "fp-ts/lib/Semigroup";

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
    translation: zeroV2(),
    scale: createV2(1.0, getAspectRatio(gl)),
    rotation: createV2(0, 1),
    color: createV4(1.0, 1.0, 1.0, 1.0),
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
    translation: zeroV2(),
    scale: createV2(1.0, getAspectRatio(gl)),
    rotation: createV2(0, 1),
    color: createV4(1.0, 1.0, 1.0, 1.0),
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
    translation: zeroV2(),
    scale: createV2(1.0, getAspectRatio(gl) * 1.0),
    rotation: createV2(0, 1),
    color: createV4(1.0, 1.0, 1.0, 1.0),
    drawMode: getCircleDrawMode(),
    texture: O.none,
    textureCoords: createCircleTextureCoords(),
  });

const chars = pipe(
  "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ- ".split(""),
  chunksOf(8),
  reverse,
  flatten
);

const calculateXOffset = (char: string): number =>
  (chars.indexOf(char) % 8) / 8;

const calculateYOffset = (char: string): number =>
  Math.floor(chars.indexOf(char) / 8) / 8;

const calculateTextTextureCoord =
  (scale: number) =>
  (char: string): Float32Array =>
    new Float32Array(
      [
        [0, 1 * scale],
        [1 * scale, 1 * scale],
        [1 * scale, 0],
        [0, 1 * scale],
        [1 * scale, 0],
        [0, 0],
      ]
        .map(([x, y]) => [
          x + calculateXOffset(char),
          y + tap(console.log)(calculateYOffset(char)),
        ])
        .flat()
    );

export const createText =
  (gl: WebGLRenderingContext) =>
  (texture: number) =>
  (text: string): GameObject2DCreated[] =>
    Array.from(text).map((char, index) => ({
      vertices: createRectangleShape(),
      translation: createV2(0 + index, 0),
      scale: createV2(1.0, getAspectRatio(gl) * 1.0),
      rotation: createV2(0, 1),
      color: createV4(1.0, 1.0, 1.0, 1.0),
      drawMode: getCircleDrawMode(),
      texture: O.some(texture),
      textureCoords: calculateTextTextureCoord(16 / 128)(char),
    }));

export const setScale = assoc<GameObject2D>("scale");

export const setTranslation = assoc<GameObject2D>("translation");

export const translate =
  (delta: vec2) =>
  (gameObject: GameObject2D): GameObject2D =>
    assoc<GameObject2D>("translation")(addV2(delta)(gameObject.translation))(
      gameObject
    );

export const setColor = assoc<GameObject2D>("color");

export const setRotation = assoc<GameObject2D>("rotation");

export const setTexture = assoc<GameObject2D>("texture");

export const setScaleLockAspectRatio =
  (value: number) => (gl: WebGLRenderingContext) =>
    setScale(createV2(value, calculateAspectRatio(gl) * value));

export const setGroupScaleLockAspectRatio =
  (value: number) =>
  (gl: WebGLRenderingContext) =>
  (gameObjects: GameObject2D[]): GameObject2D[] =>
    gameObjects
      .map(setScale(createV2(value, calculateAspectRatio(gl) * value)))
      .map((gameObject, index) =>
        translate(createV2(-7 * value * index, 0))(gameObject)
      );

export const emptyTextures = () => new Map<number, Texture>();

export const addTexture =
  (index: number, url: string) =>
  (textures: Map<number, Texture>): Map<number, Texture> => {
    const newTextures = new Map<number, Texture>(textures);
    newTextures.set(index, { url });
    return newTextures;
  };

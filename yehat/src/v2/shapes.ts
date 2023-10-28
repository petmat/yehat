import { pipe } from "fp-ts/lib/function";
import { chunksOf, flatten, reverse } from "fp-ts/lib/Array";
import { range } from "fp-ts/lib/NonEmptyArray";

import {
  DrawMode,
  GameObject2D,
  createDefaultGameObject,
  setDrawMode,
  setTexture,
  setTextureCoords,
  setTranslation,
  setVertices,
} from "./gameObject";
import { createV2 } from "./math";

// Rectangle

export const createRectangleShape = () =>
  new Float32Array([-1, 1, 1, 1, 1, -1, -1, 1, 1, -1, -1, -1]);

export const getRectangleDrawMode = () => DrawMode.Triangles;

export const createRectangleTextureCoords = () =>
  new Float32Array([0, 1, 1, 1, 1, 0, 0, 1, 1, 0, 0, 0]);

export const createRectangle =
  (gl: WebGLRenderingContext) => (): GameObject2D =>
    pipe(
      createDefaultGameObject(gl)(),
      pipe(createRectangleShape(), setVertices),
      pipe(getRectangleDrawMode(), setDrawMode),
      pipe(createRectangleTextureCoords(), setTextureCoords)
    );

// Triangle

export const createTriangleShape = () =>
  new Float32Array([0, 1, 1, -1, -1, -1]);

export const getTriangleDrawMode = () => DrawMode.Triangles;

export const createTriangleTextureCoords = () =>
  new Float32Array([0, 0, 0, 0, 0, 0, 0, 0]);

export const createTriangle = (gl: WebGLRenderingContext) => (): GameObject2D =>
  pipe(
    createDefaultGameObject(gl)(),
    pipe(createTriangleShape(), setVertices),
    pipe(getTriangleDrawMode(), setDrawMode),
    pipe(createTriangleTextureCoords(), setTextureCoords)
  );

// Circle

export const createCircleShape = () =>
  new Float32Array(
    [
      0.0,
      0.0,
      ...range(0, 30).map((i) => [
        Math.cos((i * 2 * Math.PI) / 30),
        Math.sin((i * 2 * Math.PI) / 30),
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

export const createCircle = (gl: WebGLRenderingContext) => (): GameObject2D =>
  pipe(
    createDefaultGameObject(gl)(),
    pipe(createCircleShape(), setVertices),
    pipe(getCircleDrawMode(), setDrawMode),
    pipe(createCircleTextureCoords(), setTextureCoords)
  );

// Text

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
          y + calculateYOffset(char),
        ])
        .flat()
    );

export const createText =
  (gl: WebGLRenderingContext) =>
  (texture: number) =>
  (text: string): GameObject2D[] =>
    Array.from(text).map((char, index) =>
      pipe(
        createDefaultGameObject(gl)(),
        pipe(createRectangleShape(), setVertices),
        pipe(createV2(-1 + index, -1), setTranslation),
        pipe(getRectangleDrawMode(), setDrawMode),
        pipe(texture, setTexture),
        pipe(char, pipe(16 / 128, calculateTextTextureCoord), setTextureCoords)
      )
    );

// Sprite

export const createSprite = (gl: WebGLRenderingContext) => (): GameObject2D =>
  pipe(
    createDefaultGameObject(gl)(),
    pipe(createRectangleShape(), setVertices),
    pipe(getRectangleDrawMode(), setDrawMode),
    pipe(createRectangleTextureCoords(), setTextureCoords)
  );

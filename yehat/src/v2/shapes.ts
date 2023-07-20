import * as O from "fp-ts/lib/Option";
import {
  DrawMode,
  GameObject2D,
  GameObject2DCreated,
  Texture,
  calculateAspectRatio,
} from "./core";
import {
  addV2,
  createV2,
  createV4,
  divideV2,
  multiplyV2,
  zeroV2,
} from "./math";
import { assoc, log, logF, tap } from "./utils";
import { vec2 } from "gl-matrix";
import { flow, pipe } from "fp-ts/lib/function";
import { chunksOf, flatten, reverse } from "fp-ts/lib/Array";
import { range } from "fp-ts/lib/NonEmptyArray";

const getAspectRatio = (gl: WebGLRenderingContext) =>
  gl.canvas.width / gl.canvas.height;

export const px =
  (gl: WebGLRenderingContext) =>
  (x: number, y: number): vec2 =>
    createV2(x / gl.canvas.width, y / gl.canvas.height);

export const pxToWebGLCoords = (gl: WebGLRenderingContext) => (coords: vec2) =>
  pipe(
    coords,
    divideV2(createV2(gl.canvas.width, gl.canvas.height)),
    multiplyV2(createV2(2, 2)),
    flow(pipe(createV2(-1, -1), addV2))
  );

export const createRectangleShape = () =>
  new Float32Array([-1, 1, 1, 1, 1, -1, -1, 1, 1, -1, -1, -1]);

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
          y + calculateYOffset(char),
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

export const setScale = assoc<GameObject2D, "scale">("scale");

export const setTranslation = assoc<GameObject2D, "translation">("translation");

export const translate =
  (delta: vec2) =>
  (gameObject: GameObject2D): GameObject2D =>
    setTranslation(addV2(delta)(gameObject.translation))(gameObject);

export const setColor = assoc<GameObject2D, "color">("color");

export const setRotation = assoc<GameObject2D, "rotation">("rotation");

export const setTexture = (texture: number) =>
  assoc<GameObject2D, "texture">("texture")(O.some(texture));

export const setScaleLockAspectRatio =
  (value: number) => (gl: WebGLRenderingContext) =>
    setScale(createV2(value, calculateAspectRatio(gl) * value));

const calculateGroupScaleOffsetStep = (
  value: number,
  prevScale: number,
  scalePx: number
) => (640 / scalePx - 2) / (prevScale / value); // 0.95; //value * 18;

const calculateGroupScaleOffset = (
  index: number,
  value: number,
  prevScale: number,
  scalePx: number
) => index * calculateGroupScaleOffsetStep(value, prevScale, scalePx) * -1;

export const setGroupScaleLockAspectRatio =
  (value: number, scalePx: number) =>
  (gl: WebGLRenderingContext) =>
  (gameObjects: GameObject2D[]): GameObject2D[] =>
    gameObjects
      .map((gameObject, index) =>
        translate(
          createV2(
            pipe(
              calculateGroupScaleOffset(
                index,
                value,
                gameObject.scale[0],
                scalePx
              )
            ),
            0
          )
        )(gameObject)
      )
      .map(setScale(createV2(value, calculateAspectRatio(gl) * value)));

export const emptyTextures = () => new Map<number, Texture>();

export const addTexture =
  (index: number, url: string) =>
  (textures: Map<number, Texture>): Map<number, Texture> => {
    const newTextures = new Map<number, Texture>(textures);
    newTextures.set(index, { url });
    return newTextures;
  };

export const setTextureCoords = assoc<GameObject2D, "textureCoords">(
  "textureCoords"
);

export const getSpriteDrawMode = () => DrawMode.Points;

export const createSprite =
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

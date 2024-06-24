import { pipe } from "fp-ts/lib/function";
import { chunksOf, flatten, reverse } from "fp-ts/lib/Array";
import { range } from "fp-ts/lib/NonEmptyArray";

import {
  DrawMode,
  GameObject2D,
  color,
  createDefaultGameObject,
  drawMode,
  movePosition,
  scale,
  setPosition,
  setSize,
  setTexture,
  setTextureCoords,
  texture,
  textureCoords,
  translation,
  vertices,
} from "./gameObject";
import { createV2 } from "./math";
import { getIndexOfCharInString } from "./utils";

// Rectangle

export const createRectangleShape = () =>
  new Float32Array([-1, 1, 1, 1, 1, -1, -1, 1, 1, -1, -1, -1]);

export const getRectangleDrawMode = () => DrawMode.Triangles;

export const createRectangleTextureCoords = () =>
  new Float32Array([0, 1, 1, 1, 1, 0, 0, 1, 1, 0, 0, 0]);

export const createRectangle =
  (gl: WebGLRenderingContext) =>
  (position: [x: number, y: number], size: [width: number, height: number]) =>
    pipe(
      createDefaultGameObject(gl)(),
      pipe(createRectangleShape(), vertices.set),
      pipe(getRectangleDrawMode(), drawMode.set),
      pipe(createRectangleTextureCoords(), setTextureCoords),
      setPosition(gl)(...position),
      setSize(gl)(...size)
    );

// Triangle

export const createTriangleShape = () =>
  new Float32Array([0, 1, 1, -1, -1, -1]);

export const getTriangleDrawMode = () => DrawMode.Triangles;

export const createTriangleTextureCoords = () =>
  new Float32Array([0, 0, 0, 0, 0, 0, 0, 0]);

export const createTriangle =
  (gl: WebGLRenderingContext) =>
  (position: [x: number, y: number], size: [width: number, height: number]) =>
    pipe(
      createDefaultGameObject(gl)(),
      pipe(createTriangleShape(), vertices.set),
      pipe(getTriangleDrawMode(), drawMode.set),
      pipe(createTriangleTextureCoords(), setTextureCoords),
      setPosition(gl)(...position),
      setSize(gl)(...size)
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

export const createCircle =
  (gl: WebGLRenderingContext) =>
  (position: [x: number, y: number], size: [width: number, height: number]) =>
    pipe(
      createDefaultGameObject(gl)(),
      pipe(createCircleShape(), vertices.set),
      pipe(getCircleDrawMode(), drawMode.set),
      pipe(createCircleTextureCoords(), setTextureCoords),
      setPosition(gl)(...position),
      setSize(gl)(...size)
    );

// Text

export const getIndexOfChar = (chars: string) => (char: string) => {
  return pipe(char, getIndexOfCharInString(chars));
};

export const calculateXOffset =
  (chars: string) =>
  (textureSize: number, charWidth: number) =>
  (char: string): number =>
    (getIndexOfChar(chars)(char) % (textureSize / charWidth)) /
    (textureSize / charWidth);

export const calculateYOffset =
  (chars: string) =>
  (textureSize: number, charWidth: number, charHeight: number) =>
  (char: string): number =>
    1 -
    (Math.floor(getIndexOfChar(chars)(char) / (textureSize / charWidth)) + 1) /
      (textureSize / charHeight);

const calculateTextTextureCoord =
  (chars: string) =>
  (charWidth: number, charHeight: number, textureSize: number) =>
  (char: string): Float32Array => {
    const xScale = charWidth / textureSize;
    const yScale = charHeight / textureSize;

    return new Float32Array(
      [
        [0, yScale],
        [xScale, yScale],
        [xScale, 0],
        [0, yScale],
        [xScale, 0],
        [0, 0],
      ]
        .map(([x, y]) => {
          const craxzy = [
            x + calculateXOffset(chars)(textureSize, charWidth)(char),
            y +
              calculateYOffset(chars)(textureSize, charWidth, charHeight)(char),
          ];
          return craxzy;
        })
        .flat()
    );
  };

export const createText =
  (gl: WebGLRenderingContext) =>
  (texture: number) =>
  (chars: string) =>
  (charWidth: number, charHeight: number, textureSize: number) =>
  (text: string): GameObject2D[] =>
    Array.from(text).map((char, index) =>
      pipe(
        createDefaultGameObject(gl)(),
        pipe(createRectangleShape(), vertices.set),
        pipe(createV2(-1 + index, -1), translation.set),
        pipe(getRectangleDrawMode(), drawMode.set),
        pipe(texture, setTexture),
        pipe(
          char,
          calculateTextTextureCoord(chars)(charWidth, charHeight, textureSize),
          setTextureCoords
        )
      )
    );

// Effects

export const createDropShadow =
  (gl: WebGLRenderingContext) =>
  (deltaX: number, deltaY: number) =>
  (gameObj: GameObject2D): GameObject2D[] => {
    const shadow = pipe(
      createDefaultGameObject(gl)(),
      pipe(createRectangleShape(), vertices.set),
      pipe(getRectangleDrawMode(), drawMode.set),
      textureCoords.set(gameObj.textureCoords),
      translation.set(gameObj.translation),
      movePosition(gl)(deltaX, deltaY),
      scale.set(gameObj.scale),
      texture.set(gameObj.texture),
      color.set([0, 0, 0, 1])
    );
    return [shadow, gameObj];
  };

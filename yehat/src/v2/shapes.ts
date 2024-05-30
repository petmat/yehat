import { pipe } from "fp-ts/lib/function";
import { chunksOf, flatten, reverse } from "fp-ts/lib/Array";
import { range } from "fp-ts/lib/NonEmptyArray";

import {
  DrawMode,
  GameObject2D,
  createDefaultGameObject,
  drawMode,
  setPosition,
  setSize,
  setTexture,
  setTextureCoords,
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

const getIndexOfChar =
  (chars: string) => (charsInRow: number) => (char: string) => {
    const temp1 = chars.split("");
    const temp2 = chunksOf(charsInRow)(temp1);
    const temp4 = flatten(temp2);
    console.log("wert", temp4);
    //const str = pipe(chars.split(""), chunksOf(charsInRow), reverse, flatten);
    return pipe(char, getIndexOfCharInString(temp4.join("")));
  };

const calculateXOffset =
  (chars: string) =>
  (charsInRow: number) =>
  (char: string): number =>
    (getIndexOfChar(chars)(charsInRow)(char) % charsInRow) / charsInRow;

const calculateYOffset =
  (chars: string) =>
  (charsInRow: number) =>
  (char: string): number =>
    Math.floor(chars.indexOf(char) / charsInRow) / charsInRow;

const calculateTextTextureCoord =
  (chars: string) =>
  (charWidth: number, textureWidth: number) =>
  (char: string): Float32Array => {
    const scale = charWidth / textureWidth;
    return new Float32Array(
      [
        [0, scale],
        [scale, scale],
        [scale, 0],
        [0, scale],
        [scale, 0],
        [0, 0],
      ]
        .map(([x, y]) => [
          x + calculateXOffset(chars)(textureWidth / charWidth)(char),
          y + calculateYOffset(chars)(textureWidth / charWidth)(char),
        ])
        .flat()
    );
  };

export const createText =
  (gl: WebGLRenderingContext) =>
  (texture: number) =>
  (chars: string) =>
  (charWidth: number, textureWidth: number) =>
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
          calculateTextTextureCoord(chars)(charWidth, textureWidth),
          setTextureCoords
        )
      )
    );

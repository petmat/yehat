import { flow, pipe } from "fp-ts/lib/function";
import * as O from "fp-ts/lib/Option";
import { Option } from "fp-ts/lib/Option";
import { upsertAt } from "fp-ts/lib/Record";
import { vec2, vec4 } from "gl-matrix";

import {
  addV2,
  createV2,
  createV4,
  divideV2,
  multiplyV2,
  rightV2,
  zeroV2,
} from "./math";

export enum DrawMode {
  Points,
  Triangles,
  TriangleFan,
}

export interface GameObject2D {
  vertices: Float32Array;
  translation: vec2;
  previousTranslation: vec2;
  velocity: vec2;
  scale: vec2;
  rotation: vec2;
  color: vec4;
  drawMode: DrawMode;
  texture: Option<number>;
  textureCoords: Float32Array;
  textureFrameGridWidth: Option<number>;
  defaultFrame: number;
  animations: Record<number, number[]>;
  currentAnimation: Option<number>;
  lastFrameChange: number;
  direction: vec2;
  currentFrame: number;
  tag: Option<string>;
  vertexBuffer: Option<WebGLBuffer>;
  textureCoordBuffer: Option<WebGLBuffer>;
}

export interface Texture {
  url: string;
}
export const assocGameObj =
  <T extends GameObject2D, K extends keyof T>(key: K) =>
  (val: T[K]) =>
  (obj: T): T => ({ ...obj, [key]: val });

export const setVertices =
  (vertices: Float32Array) =>
  <T extends GameObject2D>(gameObj: T): T =>
    pipe(gameObj, pipe(vertices, assocGameObj("vertices")));

export const setScale = assocGameObj("scale");

export const translate =
  (delta: vec2) =>
  <T extends GameObject2D>(gameObject: T): T =>
    pipe(gameObject, setTranslation(addV2(delta)(gameObject.translation)));

export const setTranslation =
  <T extends GameObject2D>(val: T["translation"]) =>
  (gameObject: T): T =>
    pipe(
      gameObject,
      pipe(gameObject.translation, assocGameObj("previousTranslation")),
      pipe(val, assocGameObj("translation"))
    );

export const setVelocity =
  (velocity: vec2) =>
  <T extends GameObject2D>(gameObj: T): T =>
    pipe(gameObj, pipe(velocity, assocGameObj("velocity")));

export const setColor = assocGameObj("color");

export const setDrawMode = assocGameObj("drawMode");

export const setRotation = assocGameObj("rotation");

export const setTexture = (texture: number) =>
  assocGameObj("texture")(O.some(texture));

export const setTag = (tag: string) => assocGameObj("tag")(O.some(tag));

const calculateGroupScaleOffsetStep = (
  value: number,
  prevScale: number,
  scalePx: number,
  canvasWidth: number
) => (canvasWidth / scalePx - 2) / (prevScale / value);

const calculateGroupSizeOffset = (
  index: number,
  width: number,
  prevScale: number,
  canvasWidth: number
) =>
  index *
  calculateGroupScaleOffsetStep(width, prevScale, width, canvasWidth) *
  -1;

export const emptyTextures = () => new Map<number, Texture>();

export const addTexture =
  (index: number, url: string) =>
  (textures: Map<number, Texture>): Map<number, Texture> => {
    const newTextures = new Map<number, Texture>(textures);
    newTextures.set(index, { url });
    return newTextures;
  };

export const setTextureCoords =
  (val: Float32Array) =>
  <T extends GameObject2D>(gameObj: T): T =>
    pipe(gameObj, pipe(val, assocGameObj("textureCoords")));

export const setTextureFrameGridWidth =
  (gridWidth: number) =>
  <T extends GameObject2D>(gameObj: T): T =>
    pipe(
      gameObj,
      pipe(gridWidth, O.some, assocGameObj("textureFrameGridWidth"))
    );

export const setDefaultFrame = assocGameObj("defaultFrame");

export const numberToString = (n: number) => n.toString();

export const addAnimation =
  (key: number, animation: number[]) =>
  <T extends GameObject2D>(gameObj: T): T =>
    pipe(
      gameObj,
      pipe(
        pipe(
          gameObj.animations,
          upsertAt(pipe(key, numberToString), animation)
        ),
        assocGameObj("animations")
      )
    );

export const setCurrentAnimation =
  (animation: number) =>
  <T extends GameObject2D>(gameObj: T): T =>
    pipe(gameObj, pipe(animation, O.some, assocGameObj("currentAnimation")));

export const clearCurrentAnimation = <T extends GameObject2D>(gameObj: T): T =>
  pipe(gameObj, pipe(O.none, assocGameObj("currentAnimation")));

export const setDirection =
  (direction: vec2) =>
  <T extends GameObject2D>(gameObj: T): T =>
    pipe(gameObj, pipe(direction, assocGameObj("direction")));

export const setCurrentFrame = assocGameObj("currentFrame");

export const setLastFrameChange = assocGameObj("lastFrameChange");

// Aspect ratio dependent functions

const calculateAspectRatio = (gl: WebGLRenderingContext) =>
  gl.canvas.width / gl.canvas.height;

const pxToWebGLCoords =
  (gl: WebGLRenderingContext) =>
  (coords: vec2): vec2 =>
    pipe(
      coords,
      divideV2(createV2(gl.canvas.width, gl.canvas.height)),
      multiplyV2(createV2(2, 2)),
      flow(pipe(createV2(-1, -1), addV2))
    );

const pxToWebGLScale =
  (gl: WebGLRenderingContext) =>
  (coords: vec2): vec2 =>
    pipe(coords, divideV2(createV2(gl.canvas.width, gl.canvas.height)));

const pxToWebGLDelta =
  (gl: WebGLRenderingContext) =>
  (coords: vec2): vec2 =>
    pipe(coords, divideV2(createV2(gl.canvas.width / 2, gl.canvas.height / 2)));

export const createDefaultGameObject =
  (gl: WebGLRenderingContext) => (): GameObject2D => ({
    vertices: new Float32Array(),
    translation: createV2(-1, -1),
    previousTranslation: createV2(-1, -1),
    velocity: zeroV2(),
    scale: createV2(1.0, calculateAspectRatio(gl)),
    rotation: createV2(0, 1),
    color: createV4(1.0, 1.0, 1.0, 1.0),
    drawMode: DrawMode.Triangles,
    texture: O.none,
    textureCoords: new Float32Array(),
    textureFrameGridWidth: O.none,
    defaultFrame: 0,
    animations: {},
    currentAnimation: O.none,
    lastFrameChange: 0,
    direction: rightV2(),
    currentFrame: 0,
    tag: O.none,
    vertexBuffer: O.none,
    textureCoordBuffer: O.none,
  });

export const setSize =
  (gl: WebGLRenderingContext) => (width: number, height: number) =>
    pipe(createV2(width, height), pxToWebGLScale(gl), assocGameObj("scale"));

export const setPosition =
  (gl: WebGLRenderingContext) => (x: number, y: number) =>
    pipe(createV2(x, y), pxToWebGLCoords(gl), setTranslation);

export const movePosition =
  (gl: WebGLRenderingContext) =>
  (deltaX: number, deltaY: number) =>
  <T extends GameObject2D>(gameObject: T): T =>
    pipe(createV2(deltaX, deltaY), pxToWebGLDelta(gl), translate)(gameObject);

export const setGroupSize =
  (gl: WebGLRenderingContext) =>
  (width: number, height: number) =>
  (gameObjects: GameObject2D[]): GameObject2D[] =>
    gameObjects
      .map((gameObject, index) =>
        translate(
          createV2(
            pipe(
              calculateGroupSizeOffset(
                index,
                width,
                gameObject.scale[0] * gl.canvas.width,
                gl.canvas.width
              )
            ),
            0
          )
        )(gameObject)
      )
      .map(setSize(gl)(width, height));

export const getAspectRatioCoreFns = (gl: WebGLRenderingContext) => ({
  createDefaultGameObject: createDefaultGameObject(gl),
  setSize: setSize(gl),
  setPosition: setPosition(gl),
  movePosition: movePosition(gl),
  setGroupSize: setGroupSize(gl),
});

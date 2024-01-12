import { constant, flow, identity, pipe } from "fp-ts/lib/function";
import * as A from "fp-ts/lib/Array";
import * as E from "fp-ts/lib/Either";
import { Either } from "fp-ts/lib/Either";
import * as O from "fp-ts/lib/Option";
import { Option } from "fp-ts/lib/Option";
import * as R from "fp-ts/lib/Record";
import { vec2, vec4 } from "gl-matrix";
import { Lens, fromTraversable } from "monocle-ts";

import {
  addArray,
  addV2,
  createV2,
  createV4,
  divideV2,
  equalsV2,
  inverse,
  multiplyArray,
  multiplyV2,
  reciprocal,
  rightV2,
  zeroV2,
} from "./math";
import { numberToString, tap, toFloat32Array, wrap } from "./utils";

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
  textureFrameGridWidth: number;
  defaultFrame: number;
  animations: Record<string, number[]>;
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

export const vertices = Lens.fromProp<GameObject2D>()("vertices");

export const translation = Lens.fromProp<GameObject2D>()("translation");

export const previousTranslation = Lens.fromProp<GameObject2D>()(
  "previousTranslation"
);

export const velocity = Lens.fromProp<GameObject2D>()("velocity");

export const scale = Lens.fromProp<GameObject2D>()("scale");

export const rotation = Lens.fromProp<GameObject2D>()("rotation");

export const color = Lens.fromProp<GameObject2D>()("color");

export const drawMode = Lens.fromProp<GameObject2D>()("drawMode");

export const texture = Lens.fromProp<GameObject2D>()("texture");

export const textureCoords = Lens.fromProp<GameObject2D>()("textureCoords");

export const textureFrameGridWidth = Lens.fromProp<GameObject2D>()(
  "textureFrameGridWidth"
);

export const defaultFrame = Lens.fromProp<GameObject2D>()("defaultFrame");

export const animations = Lens.fromProp<GameObject2D>()("animations");

export const currentAnimation =
  Lens.fromProp<GameObject2D>()("currentAnimation");

export const lastFrameChange = Lens.fromProp<GameObject2D>()("lastFrameChange");

export const direction = Lens.fromProp<GameObject2D>()("direction");

export const currentFrame = Lens.fromProp<GameObject2D>()("currentFrame");

export const tag = Lens.fromProp<GameObject2D>()("tag");

export const setTexture = (val: number) => texture.set(O.some(val));

export const setCurrentAnimation = (val: number) =>
  currentAnimation.set(O.some(val));

export const clearCurrentAnimation = () => currentAnimation.set(O.none);

export const setTag = (val: string) => tag.set(O.some(val));

export const translate =
  (delta: vec2) =>
  (gameObject: GameObject2D): GameObject2D =>
    pipe(gameObject, translation.modify(addV2(delta)));

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
  (gameObj: GameObject2D): GameObject2D =>
    pipe(gameObj, pipe(val, textureCoords.set));

export const addAnimation =
  (key: number, animation: number[]) =>
  (gameObj: GameObject2D): GameObject2D =>
    pipe(
      gameObj,
      pipe(
        pipe(
          animations.get(gameObj),
          R.upsertAt(pipe(key, numberToString), animation)
        ),
        animations.set
      )
    );

const turnLeftArray = (frameSize: number) =>
  pipe([1, 0, -1, 0, -1, 0, 1, 0, -1, 0, 1, 0], multiplyArray(frameSize));

const turnLeftTextureCoords =
  (frameSize: number) => (textureCoords: number[]) =>
    addArray(turnLeftArray(frameSize))(textureCoords);

const setDirectionForTextureCoords =
  (frameSize: number) =>
  (direction: vec2) =>
  (textureCoords: number[]): number[] =>
    equalsV2(rightV2())(direction)
      ? textureCoords
      : turnLeftTextureCoords(frameSize)(textureCoords);

export const getTextureCoordsForFrame =
  (numberOfCols: number) =>
  (direction: vec2) =>
  (frameIndex: number): Float32Array => {
    const frameSize = reciprocal(numberOfCols);

    const xIndex = frameIndex % numberOfCols;
    const nextXIndex = xIndex + 1;
    const yIndex = Math.floor(frameIndex / numberOfCols);
    const nextYIndex = yIndex + 1;

    const frameLeft = frameSize * xIndex;
    const frameRight = frameSize * nextXIndex;
    const frameTop = inverse(frameSize * yIndex);
    const frameBottom = inverse(frameSize * nextYIndex);
    const frameLeftTop = [frameLeft, frameTop];
    const frameRightTop = [frameRight, frameTop];
    const frameRightBottom = [frameRight, frameBottom];
    const frameLeftBottom = [frameLeft, frameBottom];

    const textureCoords = [
      ...frameLeftTop,
      ...frameRightTop,
      ...frameRightBottom,
      ...frameLeftTop,
      ...frameRightBottom,
      ...frameLeftBottom,
    ];

    return pipe(
      textureCoords,
      pipe(direction, setDirectionForTextureCoords(frameSize)),
      toFloat32Array
    );
  };

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
    textureFrameGridWidth: 1,
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
    pipe(createV2(width, height), pxToWebGLScale(gl), scale.set);

export const setPosition =
  (gl: WebGLRenderingContext) => (x: number, y: number) =>
    pipe(createV2(x, y), pxToWebGLCoords(gl), translation.set);

export const movePosition =
  (gl: WebGLRenderingContext) =>
  (deltaX: number, deltaY: number) =>
  (gameObject: GameObject2D): GameObject2D =>
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

// Buffers

export const createBuffers =
  (gl: WebGLRenderingContext) =>
  (gameObject: GameObject2D): Either<string, GameObject2D> =>
    pipe(
      gameObject,
      (go) => {
        return pipe(
          gl.createBuffer(),
          E.fromNullable("Cannot create buffer"),
          E.map((buffer) => [go, buffer] as const)
        );
      },
      E.chain((goAndBuffer) => {
        const [go, firstBuffer] = goAndBuffer;
        return pipe(
          gl.createBuffer(),
          E.fromNullable("Cannot create buffer"),
          E.map((buffer) => [go, firstBuffer, buffer] as const)
        );
      }),
      E.map((result) => {
        const [go, firstBuffer, secondBuffer] = result;
        return {
          ...go,
          vertexBuffer: O.some(firstBuffer),
          textureCoordBuffer: O.some(secondBuffer),
          initialized: true as const,
        };
      })
    );

const bindArrayBuffer =
  (gl: WebGLRenderingContext) =>
  (arr: Float32Array) =>
  (buffer: WebGLBuffer): void => {
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, arr, gl.STATIC_DRAW);
  };

export const bindBuffers =
  (gl: WebGLRenderingContext) =>
  (gameObject: GameObject2D): Either<string, GameObject2D> => {
    return pipe(
      gameObject.vertexBuffer,
      E.fromOption(() => "Vertex buffer is not set"),
      E.map(tap(pipe(gameObject.vertices, bindArrayBuffer(gl)))),
      E.map(() => gameObject.textureCoordBuffer),
      E.chain(E.fromOption(() => "Texture coordinate buffer is not set")),
      E.map(tap(pipe(gameObject.textureCoords, bindArrayBuffer(gl)))),
      E.map(() => gameObject)
    );
  };

const nextAnimationFrameIndex = (frame: number) => (animation: number[]) =>
  animation.indexOf(frame) + 1;

const nextFrameFromAnimation = (frame: number) => (animation: number[]) => {
  return pipe(
    pipe(
      animation,
      A.lookup(
        pipe(
          nextAnimationFrameIndex(frame)(animation),
          wrap(animation.length - 1)
        )
      )
    ),
    O.fold(constant(frame), identity)
  );
};

// Animations
const nextFrame = (animation: Option<number[]>) => (frame: number) =>
  pipe(animation, O.fold(constant(frame), nextFrameFromAnimation(frame)));

const gameObjectTraversal = fromTraversable(A.Traversable)<GameObject2D>();

const getTextureCoordsForGameObject = (gameObj: GameObject2D): Float32Array =>
  pipe(
    gameObj.currentFrame,
    getTextureCoordsForFrame(gameObj.textureFrameGridWidth)(gameObj.direction)
  );

const applyAnimation =
  (currentTime: number, animationInterval: number) =>
  (gameObj: GameObject2D) =>
  (animationKey: number) =>
    currentTime - gameObj.lastFrameChange >= animationInterval
      ? pipe(
          gameObj,
          currentFrame.modify(
            nextFrame(pipe(gameObj.animations, R.lookup(String(animationKey))))
          ),
          lastFrameChange.set(currentTime),
          pipe(getTextureCoordsForGameObject(gameObj), setTextureCoords)
        )
      : gameObj;

const animateGameObject =
  (currentTime: number, animationInterval: number) =>
  (gameObj: GameObject2D): GameObject2D => {
    return pipe(
      gameObj.currentAnimation,
      O.fold(
        constant(gameObj),
        applyAnimation(currentTime, animationInterval)(gameObj)
      )
    );
  };

export const updateAnimations =
  (gl: WebGLRenderingContext) =>
  (currentTime: number, animationInterval: number) =>
  (gameObjects: GameObject2D[]): GameObject2D[] => {
    return pipe(
      gameObjects,
      gameObjectTraversal.modify(
        animateGameObject(currentTime, animationInterval)
      ),
      A.map(tap(bindBuffers(gl)))
    );
  };

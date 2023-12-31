import { identity, pipe } from "fp-ts/lib/function";
import { vec4 } from "gl-matrix";

import {
  YehatScene2D,
  createYehat2DScene,
  startGame,
} from "@yehat/yehat/src/v2/core";
import {
  createCircleShape,
  createTriangleShape,
  getCircleDrawMode,
  createCircleTextureCoords,
  getTriangleDrawMode,
  createTriangleTextureCoords,
  createRectangleShape,
  getRectangleDrawMode,
  createRectangleTextureCoords,
} from "@yehat/yehat/src/v2/shapes";
import {
  getAspectRatioCoreFns,
  color,
  drawMode,
  setTextureCoords,
  vertices,
  DrawMode,
} from "@yehat/yehat/src/v2/gameObject";
import { red, green, blue } from "@yehat/yehat/src/v2/colors";

type HelloWorldScene = YehatScene2D<{}>;

const createScene = (gl: WebGLRenderingContext): HelloWorldScene => {
  const { createDefaultGameObject, setPosition, setSize } =
    getAspectRatioCoreFns(gl);

  const createSize100GameObject =
    (
      verticesVal: Float32Array,
      drawModeVal: DrawMode,
      textureCoordsVal: Float32Array
    ) =>
    (x: number, y: number) =>
    (colorVal: vec4) =>
      pipe(
        createDefaultGameObject(),
        setSize(100, 100),
        setPosition(x, y),
        color.set(colorVal),
        vertices.set(verticesVal),
        drawMode.set(drawModeVal),
        setTextureCoords(textureCoordsVal)
      );

  const createSize100Circle = createSize100GameObject(
    createCircleShape(),
    getCircleDrawMode(),
    createCircleTextureCoords()
  );

  const createSize100Rectangle = createSize100GameObject(
    createRectangleShape(),
    getRectangleDrawMode(),
    createRectangleTextureCoords()
  );

  const createSize100Triangle = createSize100GameObject(
    createTriangleShape(),
    getTriangleDrawMode(),
    createTriangleTextureCoords()
  );

  return createYehat2DScene(gl)({
    gameData: {},
    gameObjects: [
      createSize100Circle(160, 240)(red),
      createSize100Triangle(320, 240)(green),
      createSize100Rectangle(480, 240)(blue),
    ],
  });
};

const updateScene = (_gl: WebGLRenderingContext) => identity<YehatScene2D<{}>>;

const initOptions = {
  window,
  canvasId: "#glcanvas",
  createScene,
  updateScene,
};

pipe(initOptions, startGame);

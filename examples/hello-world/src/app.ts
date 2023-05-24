import { flow, pipe } from "fp-ts/lib/function";
import * as E from "fp-ts/lib/Either";
import { Either } from "fp-ts/lib/Either";
import * as TE from "fp-ts/lib/TaskEither";
import { TaskEither } from "fp-ts/lib/TaskEither";

import {
  addLoadEventListenerWithDefaults,
  getCanvasElement,
  getWebGLContext,
} from "yehat/src/v2/web";
import {
  GameData,
  YehatContext,
  YehatScene2DCreated,
  YehatScene2DInitialized,
  initializeDefaultYehatContext,
  initializeScene2D,
  processGameTick,
} from "yehat/src/v2/core";
import { vec2 } from "gl-matrix";

interface HelloWorldGameData extends GameData {
  // this feels like it should not be here, but built into Yehat
  aspectRatio: number;

  currentAngle: number;
  previousTime: number;
  currentTime: number;
  degreesPerSecond: number;
}

type HelloWorldScene = YehatScene2DInitialized<HelloWorldGameData>;

const createScene = (
  context: YehatContext
): YehatScene2DCreated<HelloWorldGameData> => {
  const {
    webGLRenderingContext: { canvas },
  } = context;
  const aspectRatio = canvas.width / canvas.height;
  // prettier-ignore
  const vertexArray = new Float32Array([
        -0.5, 0.5, 0.5, 0.5, 0.5, -0.5,
        -0.5, 0.5, 0.5, -0.5, -0.5, -0.5,
      ]);

  const rectangle = {
    vertices: vertexArray,
    translation: vec2.fromValues(0.5, 0.5),
    scale: vec2.fromValues(1.0 * 0.5, aspectRatio * 0.5),
    rotation: vec2.fromValues(0, 1),
  };

  return {
    isInitialized: false,
    context,
    gameData: {
      aspectRatio,
      previousTime: 0,
      currentTime: 0,
      currentAngle: 0.0,
      degreesPerSecond: 90,
    },
    gameObjects: [rectangle],
  };
};

const calculateRotation = (currentAngle: number): vec2 => {
  const radians = (currentAngle * Math.PI) / 180.0;
  return vec2.fromValues(Math.sin(radians), Math.cos(radians));
};

const calculateDeltaAngle =
  (previousTime: number) =>
  (currentTime: number) =>
  (degreesPerSecond: number) =>
    ((currentTime - previousTime) / 1000.0) * degreesPerSecond;

const updateScene = (scene: HelloWorldScene): HelloWorldScene => {
  const {
    gameData: {
      currentAngle,
      previousTime,
      currentTime,
      degreesPerSecond,
      ...gameData
    },
  } = scene;
  return {
    ...scene,
    gameObjects: [
      { ...scene.gameObjects[0], rotation: calculateRotation(currentAngle) },
    ],
    gameData: {
      ...gameData,
      currentAngle:
        (currentAngle +
          calculateDeltaAngle(previousTime)(currentTime)(degreesPerSecond)) %
        360,
      currentTime,
      previousTime: currentTime,
      degreesPerSecond,
    },
  };
};

const startup = (document: Document) =>
  pipe(
    document,
    getCanvasElement("glcanvas"),
    E.chain(getWebGLContext),
    E.chain(initializeDefaultYehatContext),
    E.map(createScene),
    E.chain(initializeScene2D),
    processGameTick(updateScene)
  );

const onLoad = (document: Document) => () =>
  pipe(
    document,
    startup,
    TE.mapLeft((error) => {
      throw new Error(error);
    })
  )();

addLoadEventListenerWithDefaults(onLoad(document))(window);

// const main = async () => {
//   const canvas = document.querySelector("#glCanvas");

//   if (!canvas) {
//     throw new Error("Could not get canvas");
//   }

//   const gl = getWebGLContextV1(canvas);
//   const {
//     createRectangle,
//     createRectanglePos,
//     createTriangle,
//     createCircle,
//     translate2D,
//     scale2D,
//     rotate2D,
//     clear,
//     drawScene,
//     loadTexture,
//   } = initializeScene(gl);

//   const texture = await loadTexture("assets/textures/arrow.png");

//   // const positions = [
//   //   x + width,
//   //   y + height,
//   //   x,
//   //   y + height,
//   //   x + width,
//   //   y,
//   //   x,
//   //   y,
//   // ];

//   const rectangle = createRectanglePos(
//     [260, 180, 260, 300, 380, 180, 380, 300],
//     {
//       type: "texture",
//       texture,
//     }
//   );

//   // const x = 0.25;
//   // const y = 0.1875;

//   // const rectangle = createRectanglePos(
//   //   [-1 * x, y, -1 * x, -1 * y, x, y, x, -1 * y],
//   //   {
//   //     type: "texture",
//   //     texture,
//   //   }
//   // );

//   // const rectangle = createRectangle(-0.25, 0.1875, 0.5, -0.375, {
//   //   type: "texture",
//   //   texture,
//   // });

//   // const rectangle = createRectangle(0.40625, 0.375, 0.1875, 0.25, {
//   //   type: "texture",
//   //   texture,
//   // });

//   // const rectangle = createRectangle(260, 180, 120, 120, {
//   //   type: "texture",
//   //   texture,
//   // });

//   // scale2D(0.8, rectangle);
//   // translate2D([-2.2, 0.0], rectangle);

//   // const triangle = createTriangle(
//   //   [
//   //     [0, 1],
//   //     [1, -1],
//   //     [-1, -1],
//   //   ],
//   //   Colors.Yellow
//   // );
//   // scale2D(0.8, triangle);

//   // const circle = createCircle([0, 0], 1, 100, Colors.Green);
//   // scale2D(0.8, circle);
//   // translate2D([2.2, 0.0], circle);

//   let then = 0;

//   // const render = (now: number) => {
//   // const deltaTime = now - then;
//   // then = now;
//   rotate2D(25, rectangle);
//   //translate2D([0.01, 0.01], rectangle);
//   clear(Colors.Black);
//   drawScene();
//   //   requestAnimationFrame(render);
//   // };

//   // requestAnimationFrame(render);
// };

import { flow, pipe } from "fp-ts/lib/function";
import * as E from "fp-ts/lib/Either";

import {
  Colors,
  getWebGLContext as getWebGLContextV1,
  initializeScene,
} from "yehat/src/v1/legacy";
import {
  addLoadEventListenerWithDefaults,
  getCanvasElement,
  getWebGLContext,
} from "yehat/src/v2/web";
import { Either } from "fp-ts/lib/Either";

const main = async () => {
  const canvas = document.querySelector("#glCanvas");

  if (!canvas) {
    throw new Error("Could not get canvas");
  }

  const gl = getWebGLContextV1(canvas);
  const {
    createRectangle,
    createRectanglePos,
    createTriangle,
    createCircle,
    translate2D,
    scale2D,
    rotate2D,
    clear,
    drawScene,
    loadTexture,
  } = initializeScene(gl);

  const texture = await loadTexture("assets/textures/arrow.png");

  // const positions = [
  //   x + width,
  //   y + height,
  //   x,
  //   y + height,
  //   x + width,
  //   y,
  //   x,
  //   y,
  // ];

  const rectangle = createRectanglePos(
    [260, 180, 260, 300, 380, 180, 380, 300],
    {
      type: "texture",
      texture,
    }
  );

  // const x = 0.25;
  // const y = 0.1875;

  // const rectangle = createRectanglePos(
  //   [-1 * x, y, -1 * x, -1 * y, x, y, x, -1 * y],
  //   {
  //     type: "texture",
  //     texture,
  //   }
  // );

  // const rectangle = createRectangle(-0.25, 0.1875, 0.5, -0.375, {
  //   type: "texture",
  //   texture,
  // });

  // const rectangle = createRectangle(0.40625, 0.375, 0.1875, 0.25, {
  //   type: "texture",
  //   texture,
  // });

  // const rectangle = createRectangle(260, 180, 120, 120, {
  //   type: "texture",
  //   texture,
  // });

  // scale2D(0.8, rectangle);
  // translate2D([-2.2, 0.0], rectangle);

  // const triangle = createTriangle(
  //   [
  //     [0, 1],
  //     [1, -1],
  //     [-1, -1],
  //   ],
  //   Colors.Yellow
  // );
  // scale2D(0.8, triangle);

  // const circle = createCircle([0, 0], 1, 100, Colors.Green);
  // scale2D(0.8, circle);
  // translate2D([2.2, 0.0], circle);

  let then = 0;

  // const render = (now: number) => {
  // const deltaTime = now - then;
  // then = now;
  rotate2D(25, rectangle);
  //translate2D([0.01, 0.01], rectangle);
  clear(Colors.Black);
  drawScene();
  //   requestAnimationFrame(render);
  // };

  // requestAnimationFrame(render);
};

const buildYehatProgram = (
  gl: WebGLRenderingContext
): Either<string, YehatProgram> =>
  pipe(
    gl.createProgram(),
    E.fromNullable("Cannot create shader program"),
    E.map((program) => {
      sources.forEach((desc) => {
        pipe(
          compileShader(desc)(gl),
          E.map((shader) => {
            gl.attachShader(program, shader);
          })
        );
      });

      gl.linkProgram(program);
    }),
    E.chain(
      E.fromPredicate(
        (program) => !!gl.getProgramParameter(program, gl.LINK_STATUS),
        (program) => `Error linking shader program:
            ${gl.getProgramInfoLog(program)}`
      )
    ),
    E.map((program) => ({ webGLRenderingContext: gl, webGLProgram: program }))
  );

const startup = flow(
  getCanvasElement("glcanvas"),
  E.chain(getWebGLContext),
  E.chain(buildYehatProgram),
  E.chain(buildDefaultShaders),
  E.chain(getInitialScene),
  processGameTick
);

const onLoad = () =>
  pipe(
    startup(document),
    E.mapLeft((error) => {
      throw new Error(error);
    })
  );

addLoadEventListenerWithDefaults(onLoad)(window);

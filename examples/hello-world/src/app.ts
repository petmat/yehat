import { Colors, getWebGLContext, initializeScene } from "yehat/src/v1/legacy";

const main = async () => {
  const canvas = document.querySelector("#glCanvas");

  if (!canvas) {
    throw new Error("Could not get canvas");
  }

  const gl = getWebGLContext(canvas);
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

window.onload = () => main().catch(console.error);

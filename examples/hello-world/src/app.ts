import { Colors, getWebGLContext, initializeScene } from "yehat";

const main = async () => {
  const canvas = document.querySelector("#glCanvas");
  const gl = getWebGLContext(canvas);
  const {
    createRectangle,
    createTriangle,
    createCircle,
    translate2D,
    scale2D,
    rotate2D,
    clear,
    drawScene,
    loadTexture,
  } = initializeScene(gl);

  const texture = await loadTexture("assets/textures/square_texture.png");

  const rectangle = createRectangle(260, 180, 120, 120, {
    type: "texture",
    texture,
  });
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

  const render = (now: number) => {
    const deltaTime = now - then;
    then = now;
    rotate2D(0.002 * deltaTime * -1, rectangle);
    clear(Colors.Black);
    drawScene();
    requestAnimationFrame(render);
  };

  requestAnimationFrame(render);
};

window.onload = () => main().catch(console.error);

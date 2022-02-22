import { Colors, clear, getWebGLContext, initializeScene } from "yehat";

const main = () => {
  const canvas = document.querySelector("#glCanvas");
  const gl = getWebGLContext(canvas);
  const {
    createRectangle,
    createTriangle,
    createCircle,
    translate2D,
    scale2D,
    drawScene,
  } = initializeScene(
    {
      depthTestEnabled: true,
      depthFunc: gl.LEQUAL,
      fieldOfView: (45 * Math.PI) / 180,
      aspectRatio: gl.canvas.clientWidth / gl.canvas.clientHeight,
      zNear: 0.1,
      zFar: 100.0,
    },
    gl
  );

  clear(Colors.Black, 1.0, gl);

  const rectangle = createRectangle(
    [
      [1, 1],
      [-1, 1],
      [1, -1],
      [-1, -1],
    ],
    Colors.Red
  );
  scale2D(0.8, rectangle);
  translate2D([-2.2, 0.0], rectangle);
  const triangle = createTriangle(
    [
      [0, 1],
      [1, -1],
      [-1, -1],
    ],
    Colors.Yellow
  );
  scale2D(0.8, triangle);
  const circle = createCircle([0, 0], 1, 100, Colors.Green);
  scale2D(0.8, circle);
  translate2D([2.2, 0.0], circle);

  drawScene();
};

window.onload = main;

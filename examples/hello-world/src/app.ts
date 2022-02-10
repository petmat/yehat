import { Colors, clear, getWebGLContext, initializeScene } from "yehat";

const main = () => {
  const canvas = document.querySelector("#glCanvas");
  const gl = getWebGLContext(canvas);
  const { createRectangle, createTriangle, createCircle, drawScene } =
    initializeScene(
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

  createRectangle(
    [
      [-1.0, 0.8],
      [-2.6, 0.8],
      [-1.0, -0.8],
      [-2.6, -0.8],
    ],
    Colors.Red
  );
  createTriangle(
    [
      [0, 0.8],
      [0.8, -0.8],
      [-0.8, -0.8],
    ],
    Colors.Yellow
  );
  createCircle([1.8, 0.0], 0.8, 100, Colors.Green);

  drawScene();
};

window.onload = main;

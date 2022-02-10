import { clear, getWebGLContext, initializeScene } from "yehat";

const main = () => {
  const canvas = document.querySelector("#glCanvas");
  const gl = getWebGLContext(canvas);
  const { drawRectangle, renderScene } = initializeScene(
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

  clear([0.0, 0.0, 0.0, 1.0], 1.0, gl);

  drawRectangle(
    [
      [1.0, 1.0],
      [-1.0, 1.0],
      [1.0, -1.0],
      [-1.0, -1.0],
    ],
    [1.0, 1.0, 1.0, 1.0]
  );

  renderScene();
};

window.onload = main;

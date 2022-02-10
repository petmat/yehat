import { Colors, clear, getWebGLContext, initializeScene } from "yehat";

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

  clear(Colors.Black, 1.0, gl);

  drawRectangle(
    [
      [1.0, 1.0],
      [-1.0, 1.0],
      [1.0, -1.0],
      [-1.0, -1.0],
    ],
    [Colors.White, Colors.Red, Colors.Green, Colors.Blue]
  );

  renderScene();
};

window.onload = main;

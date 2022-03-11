import { Colors, getWebGLContext, initializeScene } from "yehat";

const main = () => {
  const canvas = document.querySelector("#glCanvas");
  const gl = getWebGLContext(canvas);
  const { createSprite, loadTexture, clear, drawScene } = initializeScene(gl);

  const texture = loadTexture("assets/textures/joy.png");

  createSprite([128, 128], 64, texture);

  createSprite([256, 128], 96, texture);

  createSprite([288, 128], 64, texture);

  const render = (now: number) => {
    clear(Colors.Black);
    drawScene();
    requestAnimationFrame(render);
  };

  requestAnimationFrame(render);
};

window.onload = main;

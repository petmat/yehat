import { Colors, getWebGLContext, initializeScene } from "yehat";

const main = async () => {
  const canvas = document.querySelector("#glCanvas");
  const gl = getWebGLContext(canvas);
  const { createSprite, loadTexture, clear, drawScene } = initializeScene(gl);

  const texture = await loadTexture("assets/textures/joy.png");

  createSprite([128, 128], 64, texture);
  createSprite([256, 128], 64, texture);
  createSprite([384, 128], 92, texture);
  createSprite([128, 128], 64, texture);

  createSprite([128, 256], 64, texture);
  createSprite([256, 256], 64, texture);
  createSprite([288, 256], 64, texture);

  clear(Colors.Black);
  drawScene();
};

window.onload = () => main().catch(console.error);

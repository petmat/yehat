import { Colors, getWebGLContext, initializeScene } from "yehat";

const main = async () => {
  const canvas = document.querySelector("#glCanvas");

  if (!canvas) {
    throw new Error("Could not get canvas");
  }

  const gl = getWebGLContext(canvas);
  const { createSprite, loadTexture, clear, drawScene } = initializeScene(gl);

  const texture1 = await loadTexture("assets/textures/joy.png");
  const texture2 = await loadTexture("assets/textures/square_texture.png");

  createSprite([256, 128], 64, texture1);
  createSprite([384, 128], 92, texture2);

  clear(Colors.Black);
  drawScene();
};

window.onload = () => main().catch(console.error);

import { getWebGLContext, initializeScene, rgb } from "yehat";

const main = async () => {
  const canvas = document.querySelector("#glCanvas");
  const gl = getWebGLContext(canvas);
  const { createRectangle, createSprite, loadTexture, clear, drawScene } =
    initializeScene(gl);

  const floorTile = await loadTexture("assets/textures/floor_tile.png");
  const bricksTile = await loadTexture("assets/textures/bricks_tile.png");
  const ironTile = await loadTexture("assets/textures/iron_tile.png");
  const tile25 = await loadTexture("assets/textures/25_tile.png");

  // floor
  createRectangle(0, 460, 640, 32, {
    type: "texture",
    texture: floorTile,
    scale: 2,
  });

  // platform tiles

  createRectangle(144, 368, 32, 32, {
    type: "texture",
    texture: tile25,
    scale: 2,
  });
  createRectangle(240, 368, 32, 32, {
    type: "texture",
    texture: bricksTile,
    scale: 2,
  });
  createRectangle(272, 368, 32, 32, {
    type: "texture",
    texture: ironTile,
    scale: 2,
  });
  createRectangle(304, 368, 32, 32, {
    type: "texture",
    texture: bricksTile,
    scale: 2,
  });
  createRectangle(336, 368, 32, 32, {
    type: "texture",
    texture: tile25,
    scale: 2,
  });
  createRectangle(368, 368, 32, 32, {
    type: "texture",
    texture: bricksTile,
    scale: 2,
  });
  createRectangle(304, 272, 32, 32, {
    type: "texture",
    texture: tile25,
    scale: 2,
  });

  clear(rgb(127, 149, 255));
  drawScene();
};

window.onload = () => main().catch(console.error);

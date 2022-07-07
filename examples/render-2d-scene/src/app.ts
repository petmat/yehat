import { getWebGLContext, initializeScene, rgb } from "yehat";

const main = async () => {
  const canvas = document.querySelector("#glCanvas");

  if (!canvas) {
    throw new Error("Could not get canvas");
  }

  const gl = getWebGLContext(canvas);
  const {
    createRectangle,
    createSprite,
    createText,
    loadTexture,
    clear,
    drawScene,
  } = initializeScene(gl);

  const bush = await loadTexture("assets/textures/bush.png");
  const bushSmall = await loadTexture("assets/textures/bush_small.png");
  const hill = await loadTexture("assets/textures/hill.png");

  const floorTile = await loadTexture("assets/textures/floor_tile.png");
  const bricksTile = await loadTexture("assets/textures/bricks_tile.png");
  const ironTile = await loadTexture("assets/textures/iron_tile.png");
  const tile25 = await loadTexture("assets/textures/25_tile.png");
  const pipe = await loadTexture("assets/textures/pipe.png");

  const cloud = await loadTexture("assets/textures/cloud.png");
  const cloudSmall = await loadTexture("assets/textures/cloud_small.png");

  const dickHead = await loadTexture("assets/textures/dick_head.png");

  const mario = await loadTexture("assets/textures/mario.png");

  const mushroom = await loadTexture("assets/textures/mushroom.png");

  const marioFont = await loadTexture("assets/fonts/mario_font_square.png");
  const xChar = await loadTexture("assets/textures/x.png");
  const coin = await loadTexture("assets/textures/coin.png");

  // background

  createRectangle(20, 396, 128, 64, {
    type: "texture",
    texture: bush,
    scale: 2,
  });
  createRectangle(134, 396, 128, 64, {
    type: "texture",
    texture: hill,
    scale: 2,
  });
  createRectangle(380, 396, 64, 64, {
    type: "texture",
    texture: bushSmall,
    scale: 2,
  });

  // floor
  createRectangle(0, 460, 640, 32, {
    type: "texture",
    texture: floorTile,
    scale: 2,
  });

  // platform tiles

  createRectangle(144, 348, 32, 32, {
    type: "texture",
    texture: tile25,
    scale: 2,
  });
  createRectangle(240, 348, 32, 32, {
    type: "texture",
    texture: bricksTile,
    scale: 2,
  });
  createRectangle(272, 348, 32, 32, {
    type: "texture",
    texture: ironTile,
    scale: 2,
  });
  createRectangle(304, 348, 32, 32, {
    type: "texture",
    texture: bricksTile,
    scale: 2,
  });
  createRectangle(336, 348, 32, 32, {
    type: "texture",
    texture: tile25,
    scale: 2,
  });
  createRectangle(368, 348, 32, 32, {
    type: "texture",
    texture: bricksTile,
    scale: 2,
  });
  createRectangle(304, 272, 32, 32, {
    type: "texture",
    texture: tile25,
    scale: 2,
  });

  // pipe
  createRectangle(500, 396, 64, 64, {
    type: "texture",
    texture: pipe,
    scale: 2,
  });

  // monsters

  createSprite([126, 446], 32, dickHead);

  // mario
  createSprite([310, 410], 32, mario);

  // power-ups

  createSprite([340, 334], 32, mushroom);

  // sky

  createRectangle(90, 200, 64, 64, {
    type: "texture",
    texture: cloudSmall,
    scale: 2,
  });
  createRectangle(440, 220, 128, 64, {
    type: "texture",
    texture: cloud,
    scale: 2,
  });

  // game info text
  createText([100, 80], "MARIO", marioFont, 16);
  createText([320, 80], "WORLD", marioFont, 16);
  createText([430, 80], "TIME", marioFont, 16);

  createText([100, 100], "000000", marioFont, 16);
  createSprite([232, 108], 16, coin);
  createSprite([250, 108], 16, xChar);
  createText([260, 100], "00", marioFont, 16);
  createText([340, 100], "1-1", marioFont, 16);
  createText([440, 100], "913", marioFont, 16);

  clear(rgb(127, 149, 255));
  drawScene();
};

window.onload = () => main().catch(console.error);

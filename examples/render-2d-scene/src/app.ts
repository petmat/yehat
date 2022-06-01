import { getWebGLContext, initializeScene, rgb } from "yehat";

const main = async () => {
  const canvas = document.querySelector("#glCanvas");
  const gl = getWebGLContext(canvas);
  const { createRectangle, createSprite, loadTexture, clear, drawScene } =
    initializeScene(gl);

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

  clear(rgb(127, 149, 255));
  drawScene();
};

window.onload = () => main().catch(console.error);

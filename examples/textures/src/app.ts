import { Effect, Option, pipe } from "effect";

import {
  GameObject,
  Rectangle,
  Vector2,
  Vector4,
  WglGameScene,
  WglRenderingContext,
  Yehat,
  YehatGlobal,
} from "@yehat/yehat/src/v3";

enum Textures {
  Wood,
  Square,
  Joy,
}

interface GameScene {
  bgColor: Vector4.Vector4;
  textures: Map<number, string>;
  gameObjects: GameObject.GameObject[];
}

type AnimationWglGameScene = WglGameScene.WglGameScene<GameScene>;

const createScene = (): GameScene => ({
  bgColor: Vector4.make(0, 0, 0, 1),
  textures: new Map([
    [Textures.Wood, "assets/textures/wood_0.png"],
    [Textures.Square, "assets/textures/brick_2.png"],
    [Textures.Joy, "assets/textures/joy.png"],
  ]),
  gameObjects: [
    pipe(
      Rectangle.create(Vector2.make(100, 100)),
      GameObject.setPosition(Vector2.make(160, 240)),
      GameObject.setTexture(Option.some(Textures.Wood))
    ),
    pipe(
      Rectangle.create(Vector2.make(100, 100)),
      GameObject.setPosition(Vector2.make(320, 240)),
      GameObject.setTexture(Option.some(Textures.Square))
    ),
    pipe(
      Rectangle.create(Vector2.make(100, 100)),
      GameObject.setPosition(Vector2.make(480, 240)),
      GameObject.setTexture(Option.some(Textures.Joy))
    ),
  ],
});

const updateScene =
  (_currentMs: number) =>
  (scene: AnimationWglGameScene): AnimationWglGameScene =>
    scene;

const app = pipe(
  document,
  WglRenderingContext.fromCanvasWithId("glcanvas"),
  Effect.flatMap(Yehat.runGame(createScene)(updateScene)(Yehat.renderScene))
);

pipe(
  window,
  YehatGlobal.addEventListener("load", () =>
    Effect.runPromise(app).catch(console.error)
  )
);

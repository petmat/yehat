import { Effect, pipe } from "effect";

import {
  Circle,
  GameObject,
  Rectangle,
  Triangle,
  Vector2,
  Vector4,
  WglGameScene,
  WglRenderingContext,
  Yehat,
  YehatGlobal,
} from "@yehat/yehat/src/v3";

interface GameScene {
  bgColor: Vector4.Vector4;
  textures: Map<number, string>;
  gameObjects: GameObject.GameObject[];
}

type HelloWorldWglGameScene = WglGameScene.WglGameScene<GameScene>;

const createScene = (): GameScene => ({
  bgColor: Vector4.make(0, 0, 0, 1),
  textures: new Map(),
  gameObjects: [
    pipe(
      Circle.create(Vector2.make(100, 100)),
      GameObject.setPosition(Vector2.make(160, 240)),
      GameObject.setColor(Vector4.make(1, 0, 0, 1))
    ),
    pipe(
      Triangle.create(Vector2.make(100, 100)),
      GameObject.setPosition(Vector2.make(320, 240)),
      GameObject.setColor(Vector4.make(0, 1, 0, 1))
    ),
    pipe(
      Rectangle.create(Vector2.make(100, 100)),
      GameObject.setPosition(Vector2.make(480, 240)),
      GameObject.setColor(Vector4.make(0, 0, 1, 1))
    ),
  ],
});

const updateScene =
  (_currentMs: number) =>
  (scene: HelloWorldWglGameScene): HelloWorldWglGameScene =>
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

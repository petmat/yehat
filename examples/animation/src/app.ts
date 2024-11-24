import { Effect, Option, pipe } from "effect";

import {
  GameObject,
  Radian,
  Vector2,
  Vector4,
  WglGameScene,
  Yehat,
  YehatGlobal,
  WglRenderingContext,
  Rectangle,
} from "@yehat/yehat/src/v3";

interface GameScene {
  bgColor: Vector4.Vector4;
  currentAngle: number;
  degreesPerMs: number;
  previousMs: Option.Option<number>;
  textures: Map<number, string>;
  gameObjects: GameObject.GameObject[];
}

type AnimationWglGameScene = WglGameScene.WglGameScene<GameScene>;

const createScene = (): GameScene => ({
  bgColor: Vector4.make(0, 0, 0, 1),
  currentAngle: 0,
  degreesPerMs: 90 / 1000,
  previousMs: Option.none<number>(),
  textures: new Map(),
  gameObjects: [
    pipe(
      Rectangle.create(Vector2.make(200, 200)),
      GameObject.setPosition(Vector2.make(220, 140)),
      GameObject.setColor(Vector4.make(0, 1, 0, 1))
    ),
  ],
});

const updateScene =
  (currentMs: number) =>
  (scene: AnimationWglGameScene): AnimationWglGameScene =>
    pipe(
      scene.previousMs,
      Option.map((previousMs) => currentMs - previousMs),
      Option.getOrElse(() => 0),
      (elapsedMs) => elapsedMs * scene.degreesPerMs,
      (deltaAngle) => (scene.currentAngle + deltaAngle) % 360,
      (newAngle) => ({
        ...scene,
        previousMs: Option.some(currentMs),
        currentAngle: newAngle,
        gameObjects: scene.gameObjects.map((gameObject) => ({
          ...gameObject,
          rotation: pipe(newAngle, Radian.fromDegrees, Vector2.fromRadians),
        })),
      })
    );

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

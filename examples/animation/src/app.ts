import { Cause, Console, Effect, Exit, Option, pipe } from "effect";

import {
  Canvas,
  Document,
  GameObject,
  YehatGlobal,
  Vector2,
  Vector4,
  Radian,
  Yehat,
} from "@yehat/yehat/src/v3";

interface Model {
  bgColor: Vector4.Vector4;
  currentAngle: number;
  degreesPerMs: number;
  previousTimestamp: Option.Option<number>;
  gameObjects: GameObject.GameObject[];
}

const createModel = (): Model => ({
  bgColor: Vector4.make(0, 0, 0, 1),
  currentAngle: 0,
  degreesPerMs: 90 / 1000,
  previousTimestamp: Option.none<number>(),
  gameObjects: [
    {
      color: Vector4.make(0, 1, 0, 1),
      translation: Vector2.make(0, 0),
      rotation: Vector2.make(0, 1),
      scale: Vector2.make(0.3125, 0.3125 * (640 / 480)),
      vertexCoordinates: [-1, 1, 1, 1, 1, -1, -1, 1, 1, -1, -1, -1],
      hasTexture: false,
      texture: 0,
    },
  ],
});

const updateModel =
  (timestamp: number) =>
  (model: Yehat.WebGLModel<Model>): Yehat.WebGLModel<Model> =>
    pipe(
      model.previousTimestamp,
      Option.getOrElse(() => timestamp),
      (previousTimestamp) => timestamp - previousTimestamp,
      (timespan) => timespan * model.degreesPerMs,
      (deltaAngle) => (model.currentAngle + deltaAngle) % 360,
      (newAngle) => ({
        ...model,
        previousTimestamp: Option.some(timestamp),
        currentAngle: newAngle,
        gameObjects: model.gameObjects.map((gameObject) => ({
          ...gameObject,
          rotation: pipe(newAngle, Radian.fromDegrees, Vector2.fromRadians),
        })),
      })
    );

const app = Effect.gen(function* () {
  const exit = yield* Effect.exit(
    Document.getElementById<HTMLCanvasElement>("glcanvas")(document).pipe(
      Effect.flatMap(Canvas.getContext("webgl")),
      Effect.flatMap(Yehat.initializeGame),
      Effect.flatMap(Yehat.startGame(updateModel)(createModel()))
    )
  );

  if (Exit.isFailure(exit)) {
    if (
      Cause.isDieType(exit.cause) &&
      Cause.isRuntimeException(exit.cause.defect)
    ) {
      yield* Console.error(`Runtime exception: ${exit.cause.defect.message}`);
    } else {
      yield* Console.error(`Unknown error: ${exit.cause}`);
    }
  }
});

const handleWindowLoad = () => {
  Effect.runPromiseExit(app).then((exit) => {
    if (Exit.isSuccess(exit)) {
      console.log("Application ended");
    } else {
      console.error("Failure");
    }
  });
};

pipe(window, YehatGlobal.addEventListener("load", handleWindowLoad));

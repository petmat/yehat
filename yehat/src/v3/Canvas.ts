import { Effect } from "effect";
import { NoSuchElementException } from "effect/Cause";

export const getContext =
  (contextId: "webgl") =>
  (
    canvas: HTMLCanvasElement
  ): Effect.Effect<WebGLRenderingContext, NoSuchElementException, never> =>
    Effect.sync(() => canvas.getContext(contextId)).pipe(
      Effect.flatMap(Effect.fromNullable),
      Effect.mapError(
        () => new NoSuchElementException("Failed to get WebGL context.")
      )
    );

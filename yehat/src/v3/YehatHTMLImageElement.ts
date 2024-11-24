import { Effect } from "effect";

export const load = (
  url: string
): Effect.Effect<HTMLImageElement, Error, never> =>
  Effect.async<HTMLImageElement, Error>((resume) => {
    const image = new Image();
    image.onload = () => {
      resume(Effect.succeed(image));
    };
    image.onerror = () => {
      resume(Effect.fail(new Error(`Failed to load image ${url}.`)));
    };
    image.src = url;
  });

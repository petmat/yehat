import { Effect } from "effect";
import { NoSuchElementException } from "effect/Cause";
import { YehatHTMLElement } from ".";

export const getCanvasById =
  (id: string) =>
  (
    document: YehatHTMLElement.PartialDocument
  ): Effect.Effect<HTMLCanvasElement, NoSuchElementException, never> =>
    YehatHTMLElement.getElementById<HTMLCanvasElement>(id)(document);

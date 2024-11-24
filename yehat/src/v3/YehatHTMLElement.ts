import { Effect } from "effect";
import { NoSuchElementException } from "effect/Cause";

export type PartialDocument = Pick<Document, "getElementById">;

export const getElementById =
  <T extends HTMLElement>(id: string) =>
  (
    document: PartialDocument
  ): Effect.Effect<T, NoSuchElementException, never> =>
    Effect.sync(() => document.getElementById(id)).pipe(
      Effect.flatMap(Effect.fromNullable),
      Effect.mapBoth({
        onFailure: () =>
          new NoSuchElementException(`No element found with id: ${id}`),
        onSuccess: (element) => element as T,
      })
    );

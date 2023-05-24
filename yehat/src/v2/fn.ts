import * as E from "fp-ts/lib/Either";
import { Either } from "fp-ts/lib/Either";
import { pipe } from "fp-ts/lib/function";

export const tap =
  <A>(f: (a: A) => void) =>
  (a: A): A => {
    f(a);
    return a;
  };

export const tapE =
  <A, E>(f: (a: A) => Either<E, void>) =>
  (a: A) => {
    return pipe(
      a,
      f,
      E.map(() => a)
    );
  };

export const log = <T>(...data: unknown[]) =>
  tap((a: T) => {
    console.log(...data, a);
  });

export const logF = (...data: unknown[]): false => {
  console.log(...data);
  return false;
};

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

export const logE = <T>(...data: unknown[]) =>
  E.map(
    tap((a: T) => {
      console.log(...data, a);
    })
  );

export const logF = (...data: unknown[]): false => {
  console.log(...data);
  return false;
};

export const assoc =
  <T, K extends keyof T>(key: K) =>
  (val: T[K]) =>
  (obj: T): T => ({ ...obj, [key]: val });

export const append =
  <T>(arr: T[]) =>
  (val: T): T[] =>
    [...arr, val];

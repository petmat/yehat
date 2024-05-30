import * as E from "fp-ts/lib/Either";
import { Either } from "fp-ts/lib/Either";
import * as O from "fp-ts/lib/Option";
import { Option } from "fp-ts/lib/Option";
import * as TE from "fp-ts/lib/TaskEither";
import { pipe } from "fp-ts/lib/function";
import { vec2 } from "gl-matrix";

export const numberToString = (n: number) => n.toString();

// Tap

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

// Log

export const log = (...data: unknown[]): false => {
  console.log(...data);
  return false;
};

export const getLogOnce = () => {
  let logged = false;
  return (...data: unknown[]): false => {
    if (!logged) {
      console.log(...data);
      logged = true;
    }
    return false;
  };
};

export const tapLog = <T>(...data: unknown[]) =>
  tap((a: T) => {
    console.log(...data, a);
  });

export const tapLogE = <T>(...data: unknown[]) =>
  E.map(
    tap((a: T) => {
      console.log(...data, a);
    })
  );

export const tapLogTE = <T>(...data: unknown[]) =>
  TE.map(
    tap((a: T) => {
      console.log(...data, a);
    })
  );

// TODO: replace assoc with monocle-ts
export const assoc =
  <T extends { [Property in K]: T[K] }, K extends keyof T>(key: K) =>
  (val: T[K]) =>
  (obj: T): T => ({ ...obj, [key]: val });

export const append =
  <T>(arr: T[]) =>
  (val: T): T[] =>
    [...arr, val];

export const v2ToString = (v: vec2) => `[${v[0]}, ${1}]`;

export const toFloat32Array = (arr: number[]) => new Float32Array(arr);

export const wrap = (max: number) => (v: number) => v > max ? 0 : v;

export const getIndexOfCharInString =
  (str: string) =>
  (char: string): number =>
    str.indexOf(char);

import { vec2, vec4 } from "gl-matrix";
import { pipe } from "fp-ts/lib/function";
import * as A from "fp-ts/lib/Array";

export const multiply = (b: number) => (a: number) => a * b;

export const sumPair = ([a, b]: [a: number, b: number]) => a + b;

export const inverse = (num: number) => 1 - num;

export const reciprocal = (num: number) => 1 / num;

// Arrays

export const addArray = (b: number[]) => (a: number[]) =>
  pipe(a, A.zip(b), A.map(sumPair));

export const multiplyArray = (a: number) => (arr: number[]) =>
  pipe(arr, A.map(multiply(a)));

// 2-dimensional vector

export const createV2 = (x: number, y: number): vec2 => vec2.fromValues(x, y);

export const zeroV2 = () => {
  const v = vec2.create();
  vec2.zero(v);
  return v;
};

export const rightV2 = () => vec2.fromValues(1, 0);

export const addV2 =
  (b: vec2) =>
  (a: vec2): vec2 => {
    let out = vec2.create();
    vec2.add(out, a, b);
    return out;
  };

export const divideV2 =
  (b: vec2) =>
  (a: vec2): vec2 => {
    let out = vec2.create();
    vec2.divide(out, a, b);
    return out;
  };

export const multiplyV2 =
  (b: vec2) =>
  (a: vec2): vec2 => {
    let out = vec2.create();
    vec2.multiply(out, a, b);
    return out;
  };

export const equalsV2 = (b: vec2) => (a: vec2) => vec2.equals(a, b);

// 4-dimensional vector

export const createV4 = (x: number, y: number, z: number, w: number): vec4 =>
  vec4.fromValues(x, y, z, w);

export const zeroV4 = () => {
  const v = vec4.create();
  vec4.zero(v);
  return v;
};

export const addV4 =
  (b: vec4) =>
  (a: vec4): vec4 => {
    let out = vec4.create();
    vec4.add(out, a, b);
    return out;
  };

export const divideV4 =
  (b: vec4) =>
  (a: vec4): vec4 => {
    let out = vec4.create();
    vec4.divide(out, a, b);
    return out;
  };

export const multiplyV4 =
  (b: vec4) =>
  (a: vec4): vec4 => {
    let out = vec4.create();
    vec4.multiply(out, a, b);
    return out;
  };

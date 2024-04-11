import { vec2, vec4 } from "gl-matrix";
import { pipe } from "fp-ts/lib/function";
import * as A from "fp-ts/lib/Array";
import { Lens } from "monocle-ts";

export const add = (b: number) => (a: number) => a + b;

export const multiply = (b: number) => (a: number) => a * b;

export const sumPair = ([a, b]: [a: number, b: number]) => a + b;

export const inverse = (num: number) => 1 - num;

export const reciprocal = (num: number) => 1 / num;

// Arrays

export const addArray = (b: number[]) => (a: number[]) =>
  pipe(a, A.zip(b), A.map(sumPair));

export const multiplyArray = (a: number) => (arr: number[]) =>
  pipe(arr, A.map(multiply(a)));

// Tuples

export const addTuple =
  ([ax, ay]: [x: number, y: number]) =>
  ([bx, by]: [x: number, y: number]): [x: number, y: number] =>
    [ax + bx, ay + by];

// 2-dimensional vector

export const createV2 = (x: number, y: number): vec2 => vec2.fromValues(x, y);

export const zeroV2 = () => {
  const v = vec2.create();
  vec2.zero(v);
  return v;
};

export const addV2 =
  (b: vec2) =>
  (a: vec2): vec2 => {
    const out = vec2.create();
    vec2.add(out, a, b);
    return out;
  };

export const subtractV2 =
  (b: vec2) =>
  (a: vec2): vec2 => {
    const out = vec2.create();
    vec2.subtract(out, a, b);
    return out;
  };

export const divideV2 =
  (b: vec2) =>
  (a: vec2): vec2 => {
    const out = vec2.create();
    vec2.divide(out, a, b);
    return out;
  };

export const multiplyV2 =
  (b: vec2) =>
  (a: vec2): vec2 => {
    const out = vec2.create();
    vec2.multiply(out, a, b);
    return out;
  };

export const equalsV2 = (b: vec2) => (a: vec2) => vec2.equals(a, b);

export const upV2 = () => vec2.fromValues(0, 1);
export const downV2 = () => vec2.fromValues(0, -1);
export const leftV2 = () => vec2.fromValues(-1, 0);
export const rightV2 = () => vec2.fromValues(1, 0);

export const upLeftV2 = () => addV2(upV2())(leftV2());
export const upRightV2 = () => addV2(upV2())(rightV2());
export const downRightV2 = () => addV2(downV2())(rightV2());
export const downLeftV2 = () => addV2(downV2())(leftV2());

export const sqrDistV2 = (b: vec2) => (a: vec2) => {
  return vec2.sqrDist(a, b);
};

export const xV2 = Lens.fromProp<vec2>()(0);
export const yV2 = Lens.fromProp<vec2>()(1);

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
    const out = vec4.create();
    vec4.add(out, a, b);
    return out;
  };

export const divideV4 =
  (b: vec4) =>
  (a: vec4): vec4 => {
    const out = vec4.create();
    vec4.divide(out, a, b);
    return out;
  };

export const multiplyV4 =
  (b: vec4) =>
  (a: vec4): vec4 => {
    const out = vec4.create();
    vec4.multiply(out, a, b);
    return out;
  };

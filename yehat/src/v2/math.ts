import { vec2, vec4 } from "gl-matrix";

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
    let out = vec2.create();
    vec2.add(out, a, b);
    return out;
  };

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

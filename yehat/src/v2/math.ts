import { vec2, vec4 } from "gl-matrix";

// 2-dimensional vector

const createVec2 = (x: number, y: number): vec2 => vec2.fromValues(x, y);

const zeroVec2 = () => {
  const v = vec2.create();
  vec2.zero(v);
  return v;
};

// 4-dimensional vector

const createVec4 = (x: number, y: number, z: number, w: number): vec4 =>
  vec4.fromValues(x, y, z, w);

const zeroVec4 = () => {
  const v = vec4.create();
  vec4.zero(v);
  return v;
};

export const vector2 = { create: createVec2, zero: zeroVec2 };
export const vector4 = { create: createVec4, zero: zeroVec4 };

export type Vector2 = [number, number];

export const make = (x: number, y: number): Vector2 => [x, y];

export const fromRadians = (radians: number): Vector2 => [
  Math.sin(radians),
  Math.cos(radians),
];
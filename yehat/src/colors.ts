import { Color } from "./legacy";

export const Colors = {
  White: [1.0, 1.0, 1.0, 1.0] as Color,
  Black: [0.0, 0.0, 0.0, 1.0] as Color,
  Red: [1.0, 0.0, 0.0, 1.0] as Color,
  Green: [0.0, 1.0, 0.0, 1.0] as Color,
  Blue: [0.0, 0.0, 1.0, 1.0] as Color,
  Yellow: [1.0, 1.0, 0.0, 1.0] as Color,
} as const;

export const rgb = (r: number, g: number, b: number): Color => [
  r / 255,
  g / 255,
  b / 255,
  1,
];

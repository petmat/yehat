import { createV4 } from "./math";

export const rgb = (r: number, b: number, g: number) =>
  createV4(r / 255, b / 255, g / 255, 1.0);

export const hex = (hex: string) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? createV4(
        parseInt(result[1], 16) / 255,
        parseInt(result[2], 16) / 255,
        parseInt(result[3], 16) / 255,
        1
      )
    : createV4(1, 1, 1, 1);
};

export const red = createV4(1, 0, 0, 1);
export const green = createV4(0, 1, 0, 1);
export const blue = createV4(0, 0, 1, 1);

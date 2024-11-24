import { expect, test } from "vitest";
import { calculateXOffset, calculateYOffset, getIndexOfChar } from "./shapes";

test("getIndexOfChar returns correct index for the first char", () => {
  const chars = "0123456789ABCDEF";

  const result = getIndexOfChar(chars)("0");

  expect(result).toBe(0);
});

test("calculateXOffset returns correct offset for the first char", () => {
  const chars = "0123456789ABCDEF";
  const textureWidth = 128;
  const charWidth = 16;

  const result = calculateXOffset(chars)(textureWidth, charWidth)("0");

  expect(result).toBe(0);
});

test("calculateYOffset returns correct offset for the first char", () => {
  const chars = "0123456789ABCDEF";
  const textureWidth = 128;
  const charWidth = 16;

  const charHeight = 16;

  const result = calculateYOffset(chars)(textureWidth, charWidth, charHeight)(
    "0"
  );

  expect(result).toBe(0.875);
});

test("calculateXOffset returns correct offset for a char in the first row", () => {
  const chars = "0123456789ABCDEF";
  const textureWidth = 128;
  const charWidth = 16;

  const result = calculateXOffset(chars)(textureWidth, charWidth)("3");

  expect(result).toBe(0.375);
});

test("calculateYOffset returns correct offset for a char in the first row", () => {
  const chars = "0123456789ABCDEF";
  const textureWidth = 128;
  const charWidth = 16;
  const charHeight = 16;

  const result = calculateYOffset(chars)(textureWidth, charWidth, charHeight)(
    "3"
  );

  expect(result).toBe(0.875);
});

test("calculateXOffset returns correct offset for the last char in the first row", () => {
  const chars = "0123456789ABCDEF";
  const textureWidth = 128;
  const charWidth = 16;

  const result = calculateXOffset(chars)(textureWidth, charWidth)("7");

  expect(result).toBe(0.875);
});

test("calculateYOffset returns correct offset for the last char in the first row", () => {
  const chars = "0123456789ABCDEF";
  const textureWidth = 128;
  const charWidth = 16;
  const charHeight = 16;

  const result = calculateYOffset(chars)(textureWidth, charWidth, charHeight)(
    "7"
  );

  expect(result).toBe(0.875);
});

test("calculateXOffset returns correct offset for the first char in the second row", () => {
  const chars = "0123456789ABCDEF";
  const textureWidth = 128;
  const charWidth = 16;

  const result = calculateXOffset(chars)(textureWidth, charWidth)("8");

  expect(result).toBe(0);
});

test("calculateYOffset returns correct offset for the first char in the second row", () => {
  const chars = "0123456789ABCDEF";
  const textureWidth = 128;
  const charWidth = 16;
  const charHeight = 16;

  const result = calculateYOffset(chars)(textureWidth, charWidth, charHeight)(
    "8"
  );

  expect(result).toBe(0.75);
});

test("calculateXOffset returns correct offset for a char in the second row", () => {
  const chars = "0123456789ABCDEF";
  const textureWidth = 128;
  const charWidth = 16;

  const result = calculateXOffset(chars)(textureWidth, charWidth)("D");

  expect(result).toBe(0.625);
});

test("calculateYOffset returns correct offset for a char in the second row", () => {
  const chars = "0123456789ABCDEF";
  const textureWidth = 128;
  const charWidth = 16;
  const charHeight = 16;

  const result = calculateYOffset(chars)(textureWidth, charWidth, charHeight)(
    "D"
  );

  expect(result).toBe(0.75);
});

test("calculateXOffset returns correct offset for the last char in the second row", () => {
  const chars = "0123456789ABCDEF";
  const textureWidth = 128;
  const charWidth = 16;

  const result = calculateXOffset(chars)(textureWidth, charWidth)("F");

  expect(result).toBe(0.875);
});

test("calculateYOffset returns correct offset for the last char in the second row", () => {
  const chars = "0123456789ABCDEF";
  const textureWidth = 128;
  const charWidth = 16;
  const charHeight = 16;

  const result = calculateYOffset(chars)(textureWidth, charWidth, charHeight)(
    "F"
  );

  expect(result).toBe(0.75);
});

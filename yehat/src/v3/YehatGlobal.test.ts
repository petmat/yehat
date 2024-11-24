import { expect, test, vi } from "vitest";
import * as YehatGlobal from "./YehatGlobal";

test("Can add event handler without options", () => {
  const window = {
    addEventListener: vi.fn(),
  };
  const listener = vi.fn();

  YehatGlobal.addEventListener("click", listener)(window);

  expect(window.addEventListener).toHaveBeenCalledWith("click", listener);
});

test("Can add event handler with options", () => {
  const window = {
    addEventListener: vi.fn(),
  };
  const listener = vi.fn();
  const options = { capture: true };

  YehatGlobal.addEventListener("click", listener, options)(window);

  expect(window.addEventListener).toHaveBeenCalledWith(
    "click",
    listener,
    options
  );
});

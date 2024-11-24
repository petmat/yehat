import { Effect } from "effect";

export type EventListener<K extends keyof WindowEventMap> = (
  this: Window,
  ev: WindowEventMap[K]
) => any;

export type PartialWindow = Pick<Window, "addEventListener">;

export const addEventListener: {
  <K extends keyof WindowEventMap>(type: K, listener: EventListener<K>): (
    window: PartialWindow
  ) => void;
  <K extends keyof WindowEventMap>(
    type: K,
    listener: EventListener<K>,
    options: boolean | AddEventListenerOptions
  ): (window: PartialWindow) => void;
} = (type, listener, options?) => (window: PartialWindow) => {
  if (options) {
    window.addEventListener(type, listener, options);
  } else {
    window.addEventListener(type, listener);
  }
};

export const getAnimationFrame = () =>
  Effect.promise<number>(
    () => new Promise((resolve) => requestAnimationFrame(resolve))
  );

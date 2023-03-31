import { pipe } from "fp-ts/function";
import * as O from "fp-ts/Option";
import { Option } from "fp-ts/Option";

export const addEventListener =
  <K extends keyof WindowEventMap>(type: K) =>
  (listener: (this: Window, ev: WindowEventMap[K]) => any) =>
  (options: AddEventListenerOptions) =>
  (window: Window) => {
    window.addEventListener(type, listener, options);
  };

export const addLoadEventListener = addEventListener("load");

export const getElementById =
  (elementId: string) =>
  (doc: Document): Option<HTMLElement> =>
    pipe(elementId, doc.getElementById.bind(doc), O.fromNullable);

// Only "webgl" is allowed because Yehat only supports WebGL version 1
// and Canvas typing makes it difficult to allow any string.
export const getContext =
  (contextId: "webgl") =>
  (glCanvas: HTMLCanvasElement): Option<WebGLRenderingContext> =>
    pipe(contextId, (id) => glCanvas.getContext(id), O.fromNullable);

export const getWebGLContext = getContext("webgl");

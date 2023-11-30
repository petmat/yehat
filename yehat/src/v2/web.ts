import { flow, pipe } from "fp-ts/function";
import * as O from "fp-ts/Option";
import { Option } from "fp-ts/Option";
import * as E from "fp-ts/Either";
import { Either } from "fp-ts/Either";
import { Task } from "fp-ts/lib/Task";

export const addWindowEventListener =
  (options: AddEventListenerOptions) =>
  <K extends keyof WindowEventMap>(type: K) =>
  (listener: (this: Window, ev: WindowEventMap[K]) => any) =>
  (window: Window) => {
    window.addEventListener(type, listener, options);
  };

export const addWindowEventListenerWithDefaults = addWindowEventListener({
  capture: false,
});

export const addLoadEventListener = addWindowEventListenerWithDefaults("load");

export const addKeydownEventListener =
  addWindowEventListenerWithDefaults("keydown");

export const addKeyupEventListener =
  addWindowEventListenerWithDefaults("keyup");

export const getElementById =
  (elementId: string) =>
  (doc: Document): Option<HTMLElement> =>
    pipe(elementId, doc.getElementById.bind(doc), O.fromNullable);

export const getElementByIdOrFail = (elementId: string) =>
  flow(
    getElementById(elementId),
    E.fromOption(() => `Element not found with ID ${elementId}`)
  );

// Only "webgl" is allowed because Yehat only supports WebGL version 1
// and Canvas typing makes it difficult to allow any string.
export const getContext =
  (contextId: "webgl") =>
  (glCanvas: HTMLCanvasElement): Either<string, WebGLRenderingContext> =>
    pipe(
      contextId,
      (id) => glCanvas.getContext(id),
      E.fromNullable("Cannot get WebGL context")
    );

export const getWebGLContext = getContext("webgl");

const hasElement = E.fromOption(() => "Element not found");

const isCanvas = flow(
  E.fromPredicate(
    (e: Element) => "getContext" in e,
    () => "Element is not a canvas"
  ),
  E.map((e) => e as unknown as HTMLCanvasElement)
);

export const querySelector =
  (elementId: string) =>
  (doc: Document): Option<Element> =>
    pipe(elementId, doc.querySelector.bind(doc), O.fromNullable);

export const getCanvasElement = (elementSelector: string) =>
  flow(querySelector(elementSelector), hasElement, E.chain(isCanvas));

export const getElementText =
  (elementId: string) =>
  (document: Document): Either<string, Option<string>> =>
    pipe(
      document,
      getElementByIdOrFail(elementId),
      E.chain((el) =>
        pipe(
          el.firstChild,
          E.fromNullable("Element does not have text child element")
        )
      ),
      E.map((childNode) => pipe(childNode.nodeValue, O.fromNullable))
    );

export const requestAnimationFrameTask: Task<number> = () =>
  new Promise<number>((resolve) => {
    window.requestAnimationFrame((time) => resolve(time));
  });

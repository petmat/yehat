import { pipe } from "fp-ts/lib/function";
import {
  initializeDefaultYehatContext,
  loadGame,
  processGameTick,
} from "yehat/src/v2/core";

const startup = (gl: WebGLRenderingContext) =>
  pipe(
    gl,
    initializeDefaultYehatContext,
    createScene,
    initializeScene,
    processGameTick(updateScene)
  );

pipe(startup, loadGame(window)("#glcanvas"));

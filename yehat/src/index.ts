// yehat 1
import * as legacy from "./v1/legacy";

export const v1 = { legacy };

// yehat 2
import * as collisions from "./v2/collisions";
import * as colors from "./v2/colors";
import * as core from "./v2/core";
import * as fn from "./v2/utils";
import * as gameObject from "./v2/gameObject";
import * as math from "./v2/math";
import * as physics from "./v2/physics";
import * as shapes from "./v2/shapes";
import * as web from "./v2/web";

export const v2 = {
  collisions,
  colors,
  core,
  fn,
  gameObject,
  math,
  physics,
  shapes,
  web,
};

export * as v3 from "./v3";

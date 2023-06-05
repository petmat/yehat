// yehat 1
import * as legacy from "./v1/legacy";

export const v1 = { legacy };

// yehat 2
import * as core from "./v2/core";
import * as fn from "./v2/utils";
import * as web from "./v2/web";
import * as math from "./v2/math";
import * as shapes from "./v2/shapes";

export const v2 = { core, fn, web, math, shapes };

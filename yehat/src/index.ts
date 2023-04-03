// yehat 1
import * as colors from "./colors";
import * as legacy from "./legacy";

export const y1 = { ...legacy, colors };

// yehat 2
import * as core from "./v2/core";
import * as fn from "./v2/fn";
import * as web from "./v2/web";

export const y2 = { core, fn, web };

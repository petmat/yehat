import * as GameObject from "./GameObject";
import * as YehatWglBuffer from "./YehatWglBuffer";

export type WglGameObject = GameObject.GameObject & {
  vertexCoordinatesBuffer: YehatWglBuffer.YehatWglBuffer;
};

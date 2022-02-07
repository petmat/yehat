import { clearColor, getWebGLContext } from "yehat";

const main = () => {
  const canvas = document.querySelector("#glCanvas");
  const gl = getWebGLContext(canvas);
  clearColor([0.0, 0.0, 0.0, 1.0], gl);
};

window.onload = main;

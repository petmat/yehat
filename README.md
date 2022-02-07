# Yehat

Yehat is a game engine built on WebGL.

This library is still a work in progress.

## Initialization

To get the WebGL rendering context, first you need a canvas element:

HTML:

```html
<canvas id="glCanvas" width="640" height="480"></canvas>
```

And then you need to query it. Do this in the `window.onload` event to make sure
the canvas is loaded and ready.

JS/TS:

```ts
const main = () => {
  const canvas = document.querySelector("#glCanvas");
};

window.onload = main;
```

Then you can get the context:

```ts
const gl = getWebGLContext(canvas);
```

## Clearing the scene

To start for example with a blank black screen you can clear it with:

```ts
clearColor([0.0, 0.0, 0.0, 1.0], gl);
```

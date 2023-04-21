import { flow, pipe } from "fp-ts/function";
import * as E from "fp-ts/Either";
import { Either } from "fp-ts/Either";
import * as A from "fp-ts/Array";
import * as T from "fp-ts/Task";
import { TaskEither } from "fp-ts/TaskEither";
import * as TE from "fp-ts/TaskEither";

import { tap } from "yehat/src/v2/fn";
import {
  getCanvasElement,
  getWebGLContext,
  getElementText,
  addLoadEventListenerWithDefaults,
  requestAnimationFrameTask,
} from "yehat/src/v2/web";
import {
  ShaderType,
  initializeYehatProgram,
  shaderTypeToWebGLShaderType,
} from "yehat/src/v2/core";

interface ShaderInfo {
  type: ShaderType;
  id: string;
}

type SceneWithoutVertexBuffer = {
  aspectRatio: number;
  currentScale: number[];
  currentRotation: number[];
  currentTranslation: number[];
  vertexNumComponents: number;
  vertexCount: number;
  currentAngle: number;
  previousTime: number;
  currentTime: number;
  vertexArray: Float32Array;
  degreesPerSecond: number;
};

type Scene = SceneWithoutVertexBuffer & {
  vertexBuffer: WebGLBuffer;
};

const getShaderSource =
  (document: Document) =>
  ({ id, type }: ShaderInfo): Either<string, ShaderSource> =>
    pipe(
      document,
      getElementText(id),
      E.chain(E.fromOption(() => "Shader element text is empty")),
      E.map((source) => ({ type, source }))
    );

const shaderInfos: ShaderInfo[] = [
  {
    type: ShaderType.Vertex,
    id: "vertex-shader",
  },
  {
    type: ShaderType.Fragment,
    id: "fragment-shader",
  },
];

const addShaderSourcesToRenderingContext = (
  gl: WebGLRenderingContext
): RenderingContextWithShaderSources => ({ gl, sources: [] });

const reduceShaderSources =
  (glE: Either<string, WebGLRenderingContext>) =>
  (
    shaderSources: E.Either<string, ShaderSource>[]
  ): Either<string, RenderingContextWithShaderSources> =>
    pipe(
      shaderSources,
      A.reduce(
        pipe(glE, E.map(addShaderSourcesToRenderingContext)),
        (accE, shaderSourceE) =>
          pipe(
            accE,
            E.chain(({ gl, sources }) =>
              pipe(
                shaderSourceE,
                E.map((source) => ({
                  gl,
                  sources: [...sources, source],
                }))
              )
            )
          )
      )
    );

const getShaderSources = (): Either<
  string,
  RenderingContextWithShaderSources
> =>
  pipe(shaderInfos, A.map(getShaderSource(document)), reduceShaderSources(glE));

const compileShader =
  ({ type, source }: ShaderSource) =>
  (gl: WebGLRenderingContext): Either<string, WebGLShader> => {
    return pipe(
      type,
      shaderTypeToWebGLShaderType(gl),
      gl.createShader.bind(gl),
      E.fromNullable("Cannot create shader"),
      E.map((shader) => {
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        return shader;
      }),
      E.chain(
        E.fromPredicate(
          (shader) => !!gl.getShaderParameter(shader, gl.COMPILE_STATUS),
          (shader) =>
            `Error compiling ${
              type === ShaderType.Vertex ? "vertex" : "fragment"
            } shader:
            ${gl.getShaderInfoLog(shader)}`
        )
      )
    );
  };

const buildShaderProgram = (
  shaderSourcesE: Either<string, RenderingContextWithShaderSources>
): Either<string, RenderingContextWithProgram> =>
  pipe(
    shaderSourcesE,
    E.chain(({ gl, sources }) => {
      return pipe(
        gl.createProgram(),
        E.fromNullable("Cannot create shader program"),
        E.map((program) => {
          sources.forEach((desc) => {
            pipe(
              compileShader(desc)(gl),
              E.map((shader) => {
                gl.attachShader(program, shader);
              })
            );
          });

          gl.linkProgram(program);

          return program;
        }),
        E.chain(
          E.fromPredicate(
            (program) => !!gl.getProgramParameter(program, gl.LINK_STATUS),
            (program) => `Error linking shader program:
            ${gl.getProgramInfoLog(program)}`
          )
        ),
        E.map((program) => ({ gl, program }))
      );
    })
  );

const getInitialScene = (
  programE: Either<string, RenderingContextWithProgram>
): Either<string, SceneWithoutVertexBuffer> =>
  pipe(
    programE,
    E.map((program): SceneWithoutVertexBuffer => {
      const {
        gl: { canvas },
      } = program;
      const aspectRatio = canvas.width / canvas.height;
      // prettier-ignore
      const vertexArray = new Float32Array([
        -0.5, 0.5, 0.5, 0.5, 0.5, -0.5,
        -0.5, 0.5, 0.5, -0.5, -0.5, -0.5,
      ]);
      const vertexNumComponents = 2;

      return {
        aspectRatio,
        currentRotation: [0, 1],
        currentScale: [1.0 * 0.5, aspectRatio * 0.5],
        currentTranslation: [0.5, 0.5],
        vertexNumComponents,
        vertexCount: vertexArray.length / vertexNumComponents,
        currentAngle: 0.0,
        previousTime: 0,
        currentTime: 0,
        vertexArray,
        degreesPerSecond: 90,
        program: program.program,
        gl: program.gl,
      };
    })
  );

const createVertexBuffer = E.chain(
  ({ gl, ...scene }: SceneWithoutVertexBuffer): Either<string, Scene> =>
    pipe(
      gl.createBuffer(),
      E.fromNullable("Cannot create buffer"),
      E.map((b) => ({ ...scene, gl, vertexBuffer: b }))
    )
);

const bindVertexBuffer = ({ gl, vertexBuffer, vertexArray }: Scene): void => {
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, vertexArray, gl.STATIC_DRAW);
};

const initializeVertexBuffer = flow(
  createVertexBuffer,
  E.map(tap(bindVertexBuffer))
);

const calculateRotation = (currentAngle: number) => {
  const radians = (currentAngle * Math.PI) / 180.0;
  return [Math.sin(radians), Math.cos(radians)];
};
const calculateDeltaAngle =
  (previousTime: number) =>
  (currentTime: number) =>
  (degreesPerSecond: number) =>
    ((currentTime - previousTime) / 1000.0) * degreesPerSecond;

const updateScene: (s: Either<string, Scene>) => Either<string, Scene> = flow(
  E.map(
    ({
      previousTime,
      currentTime,
      currentAngle,
      degreesPerSecond,
      ...scene
    }) => ({
      ...scene,
      currentRotation: calculateRotation(currentAngle),
      currentAngle:
        (currentAngle +
          calculateDeltaAngle(previousTime)(currentTime)(degreesPerSecond)) %
        360,
      previousTime: currentTime,
      currentTime,
      degreesPerSecond,
    })
  )
);

const draw = ({ gl, program, ...scene }: Scene) => {
  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
  gl.clearColor(0.8, 0.9, 1.0, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT);

  gl.useProgram(program);

  const uScalingFactor = gl.getUniformLocation(program, "uScalingFactor");
  const uGlobalColor = gl.getUniformLocation(program, "uGlobalColor");
  const uRotationVector = gl.getUniformLocation(program, "uRotationVector");
  const uTranslationVector = gl.getUniformLocation(
    program,
    "uTranslationVector"
  );

  gl.uniform2fv(uScalingFactor, scene.currentScale);
  gl.uniform2fv(uRotationVector, scene.currentRotation);
  gl.uniform2fv(uTranslationVector, scene.currentTranslation);
  gl.uniform4fv(uGlobalColor, [0.1, 0.7, 0.2, 1.0]);

  gl.bindBuffer(gl.ARRAY_BUFFER, scene.vertexBuffer);

  const aVertexPosition = gl.getAttribLocation(program, "aVertexPosition");

  gl.enableVertexAttribArray(aVertexPosition);
  gl.vertexAttribPointer(
    aVertexPosition,
    scene.vertexNumComponents,
    gl.FLOAT,
    false,
    0,
    0
  );

  gl.drawArrays(gl.TRIANGLES, 0, scene.vertexCount);
};

const drawScene = E.map(tap(draw));

const processGameTick = (
  sceneE: Either<string, Scene>
): TaskEither<string, Scene> =>
  pipe(
    sceneE,
    updateScene,
    drawScene,
    T.of,
    T.chain((e) =>
      pipe(
        requestAnimationFrameTask,
        T.map((currentTime) =>
          pipe(
            e,
            E.map((scene) => ({ ...scene, currentTime }))
          )
        )
      )
    ),
    T.chain(processGameTick)
  );

const startup = flow(
  getCanvasElement("glcanvas"),
  E.chain(getWebGLContext),
  E.chain((gl) =>
    pipe(getShaderSources(), E.chain(initializeYehatProgram(gl)))
  ),
  getInitialScene,
  initializeVertexBuffer,
  processGameTick
);

const onLoad = () =>
  pipe(
    startup(document),
    TE.mapLeft((error) => {
      throw new Error(error);
    })
  )();

addLoadEventListenerWithDefaults(onLoad)(window);

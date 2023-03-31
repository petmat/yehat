import { flow, pipe } from "fp-ts/function";
import * as E from "fp-ts/Either";
import { Either } from "fp-ts/Either";
import * as A from "fp-ts/Array";
import { Task } from "fp-ts/Task";
import * as T from "fp-ts/Task";

import { addLoadEventListener, getElementById, getWebGLContext } from "yehat";

interface ShaderInfo {
  type: number;
  id: string;
}

interface ShaderInfoWithSource {
  type: number;
  id: string;
  source: string;
}

interface ShaderSources {
  gl: WebGLRenderingContext;
  sources: ShaderInfoWithSource[];
}

interface ShaderProgram {
  gl: WebGLRenderingContext;
  program: WebGLProgram;
}

interface SceneWithContext {
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
  gl: WebGLRenderingContext;
  program: WebGLProgram;
}

type SceneWithVertexBuffer = SceneWithContext & {
  vertexBuffer: WebGLBuffer;
};

const tap =
  <T>(f: (a: T) => void) =>
  (a: T) => {
    f(a);
    return a;
  };

const hasElement = E.fromOption(() => "Element not found");

const isCanvas = flow(
  E.fromPredicate(
    (e: HTMLElement) => "getContext" in e,
    () => "Element is not a canvas"
  ),
  E.map((e) => e as unknown as HTMLCanvasElement)
);

const getCanvasElement = (elementId: string) =>
  flow(getElementById(elementId), hasElement, E.chain(isCanvas));

const getWebGLContextFromCanvas = E.chain(
  flow(
    getWebGLContext,
    E.fromOption(() => "Cannot get WebGL context")
  )
);

const getShaderSource =
  (info: ShaderInfo) =>
  (document: Document): Either<string, ShaderInfoWithSource> => {
    return pipe(
      document,
      getElementById(info.id),
      E.fromOption(() => `Shader element not found with ID ${info.id}`),
      E.chain((el) =>
        E.fromNullable("Shader element does not have text")(el.firstChild)
      ),
      E.chain((childNode) =>
        E.fromNullable("Shader element text is empty")(childNode.nodeValue)
      ),
      E.map((source) => ({ ...info, source }))
    );
  };

const getShaderSources = (glE: Either<string, WebGLRenderingContext>) => {
  const foo = pipe(
    glE,
    E.chain((gl) => {
      const shaderInfos: ShaderInfo[] = [
        {
          type: gl.VERTEX_SHADER,
          id: "vertex-shader",
        },
        {
          type: gl.FRAGMENT_SHADER,
          id: "fragment-shader",
        },
      ];
      const bar = pipe(
        shaderInfos,
        A.map((source) => getShaderSource(source)(document))
      );
      const wtf = bar.reduce<Either<string, ShaderSources>>(
        (acc, v) =>
          pipe(
            acc,
            E.chain((g) =>
              pipe(
                v,
                E.map((b) => ({ gl: g.gl, sources: [...g.sources, b] }))
              )
            )
          ),
        pipe(
          glE,
          E.map((a) => ({ gl: a, sources: [] }))
        )
      );
      return wtf;
    })
  );
  return foo;
};

const compileShader =
  ({ type, source }: ShaderInfoWithSource) =>
  (gl: WebGLRenderingContext) => {
    const shader = gl.createShader(type);

    if (!shader) {
      throw new Error("Cannot create shader");
    }

    if (!source) {
      throw new Error("Cannot get shader code");
    }

    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.log(
        `Error compiling ${
          type === gl.VERTEX_SHADER ? "vertex" : "fragment"
        } shader:`
      );
      console.log(gl.getShaderInfoLog(shader));
    }

    return shader;
  };

const buildShaderProgram = (
  shaderSourcesE: Either<string, ShaderSources>
): Either<string, ShaderProgram> => {
  const hi = pipe(
    shaderSourcesE,
    E.map(({ gl, sources }) => {
      const program = gl.createProgram();
      console.log("PRÖÖGGG", program);
      if (!program) {
        throw new Error("Cannot create shader program");
      }

      sources.forEach((desc) => {
        const shader = compileShader(desc)(gl);

        if (shader) {
          gl.attachShader(program, shader);
        }
      });

      gl.linkProgram(program);

      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.log("Error linking shader program:");
        console.log(gl.getProgramInfoLog(program));
      }

      return { gl, program };
    })
  );
  return hi;
};

const getInitialScene = (
  programE: Either<string, ShaderProgram>
): Either<string, SceneWithContext> =>
  pipe(
    programE,
    E.map((program): SceneWithContext => {
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
  ({ gl, ...scene }: SceneWithContext): Either<string, SceneWithVertexBuffer> =>
    pipe(
      gl.createBuffer(),
      E.fromNullable("Cannot create buffer"),
      E.map((b) => ({ ...scene, gl, vertexBuffer: b }))
    )
);

const bindVertexBuffer = ({
  gl,
  vertexBuffer,
  vertexArray,
}: SceneWithVertexBuffer): void => {
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

const updateScene: (
  s: Either<string, SceneWithVertexBuffer>
) => Either<string, SceneWithVertexBuffer> = flow(
  E.map(
    ({
      previousTime,
      currentTime,
      currentAngle,
      degreesPerSecond,
      ...scene
    }) => {
      return {
        ...scene,
        currentRotation: calculateRotation(currentAngle),
        currentAngle:
          (currentAngle +
            calculateDeltaAngle(previousTime)(currentTime)(degreesPerSecond)) %
          360,
        previousTime: currentTime,
        currentTime,
        degreesPerSecond,
      };
    }
  )
);

const requestAnimationFrameTask: Task<number> = () =>
  new Promise<number>((resolve) => {
    requestAnimationFrame((time) => resolve(time));
  });

const draw = ({ gl, program, ...scene }: SceneWithVertexBuffer) => {
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

const processGameTick = (sceneE: Either<string, SceneWithVertexBuffer>) =>
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
  getWebGLContextFromCanvas,
  getShaderSources,
  buildShaderProgram,
  getInitialScene,
  initializeVertexBuffer,
  processGameTick
);

const onLoad = (): void => {
  const startupResultTE = startup(document)();
  startupResultTE.then((startupResultE) => {
    if (startupResultE._tag === "Left") {
      throw new Error(startupResultE.left);
    }
  });
};

addLoadEventListener(onLoad)({ capture: false })(window);

export const tap =
  <T>(f: (a: T) => unknown) =>
  (a: T) => {
    f(a);
    return a;
  };

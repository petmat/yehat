export const tap =
  <T>(f: (a: T) => void) =>
  (a: T) => {
    f(a);
    return a;
  };

export function assert(predicate: any, message: string | (() => string)): asserts predicate {
  if (
    process.env.NODE_ENV !== 'production' &&
    (typeof predicate === 'function' ? !predicate() : !predicate)
  ) {
    throw new Error(typeof message === 'function' ? message() : message);
  }
}

let ranOnce: Set<string> | undefined;

export function assertRanOnce(label: string): void {
  if (process.env.NODE_ENV !== 'production') {
    if (!ranOnce) {
      ranOnce = new Set();
    }
    assert(!ranOnce.has(label), `Code labelled "${label}" should only run once`);
    ranOnce.add(label);
  }
}

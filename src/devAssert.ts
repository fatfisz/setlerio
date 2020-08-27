export function assert(predicate: any, message: string): asserts predicate {
  if (
    process.env.NODE_ENV !== 'production' &&
    (typeof predicate === 'function' ? !predicate() : !predicate)
  ) {
    throw new Error(message);
  }
}

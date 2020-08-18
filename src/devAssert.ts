export function assert(predicate: any, message: string): asserts predicate {
  if (process.env.NODE_ENV !== 'production' && !predicate) {
    throw new Error(message);
  }
}

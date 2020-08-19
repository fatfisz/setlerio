const imageCache = new Map<string, HTMLCanvasElement>();

type Hash = string | number | Hash[];

export function useImageCache(hash: Hash, getImage: () => HTMLCanvasElement): HTMLCanvasElement {
  const stringHash = String(hash);
  if (!imageCache.has(stringHash)) {
    imageCache.set(stringHash, getImage());
  }
  return imageCache.get(stringHash)!;
}

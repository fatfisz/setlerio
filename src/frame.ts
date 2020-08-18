export const fps = 20;

export let globalFrame = 0;

export function goToNextFrame(): void {
  globalFrame = getNextFrame();
}

export function getNextFrame(offsetInMs = 0): number {
  return globalFrame + 1 + Math.round(offsetInMs * (fps / 1000));
}

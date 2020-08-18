export const fps = 20;

export let globalFrame = 0;

export function goToNextFrame(): void {
  globalFrame = getNextFrame();
}

export function getNextFrame(offset = 0): number {
  return globalFrame + 1 + getNumberOfFrames(offset);
}

export function getNumberOfFrames(duration: number): number {
  return Math.round(duration * (fps / 1000));
}

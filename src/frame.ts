const fps = 60;

// Leave a margin of error of 1ms so that frames aren't skipped overzealously
export const frameDuration = 1000 / fps - 1;

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

export const fps = 20;

export let frame = 0;

export function goToNextFrame(): void {
  frame = getNextFrame();
}

export function getNextFrame(offsetInMs = 0): number {
  return frame + 1 + Math.round(offsetInMs * (fps / 1000));
}

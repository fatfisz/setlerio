export function getCanvas(
  width: number,
  height: number,
): [canvas: HTMLCanvasElement, context: CanvasRenderingContext2D] {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d')!;
  context.imageSmoothingEnabled = false;
  return [canvas, context];
}

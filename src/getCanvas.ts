export function getCanvas(
  width: number,
  height: number,
): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d') as CanvasRenderingContext2D;
  context.imageSmoothingEnabled = false;
  return [canvas, context];
}

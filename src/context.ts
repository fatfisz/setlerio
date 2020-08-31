import { Point } from 'hex';

export function drawPathFromPoints(context: CanvasRenderingContext2D, points: Point[]): void {
  context.beginPath();
  const [firstPoint, ...restPoints] = points;
  context.moveTo(...firstPoint.toArray());
  for (const point of restPoints) {
    context.lineTo(...point.toArray());
  }
  context.closePath();
}

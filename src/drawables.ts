import { Point } from 'hex';

type Drawable = (
  context: CanvasRenderingContext2D,
  camera: Point<false>,
  mouse: Point<false>,
  hoveredHex: Point<true>,
  hover: boolean,
) => void;

let lastHandle = 0;

const drawables = new Map<number, Drawable>();

export function getDrawables(): IterableIterator<Drawable> {
  return drawables.values();
}

export function drawablePush(drawable: Drawable): number {
  lastHandle += 1;
  drawables.set(lastHandle, drawable);
  return lastHandle;
}

export function drawableRemove(handle: number): void {
  drawables.delete(handle);
}

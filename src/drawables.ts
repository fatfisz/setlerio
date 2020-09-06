import { Point } from 'hex';

export const drawablePriorityId = {
  terrain: 0,
  buildings: 1,
  border: 2,
  toasts: 3,
  hud: 4,
  menu: 5,
  last: 6,
} as const;

type PriorityId = typeof drawablePriorityId[keyof typeof drawablePriorityId];

type Drawable = [
  priority: PriorityId,
  draw: (context: CanvasRenderingContext2D) => void,
  hex?: Point,
];

export const drawableNoopHandle = -1;

let lastHandle = 0;

const drawables = new Map<number, Drawable>();

export function getDrawables(): IterableIterator<Drawable> {
  return drawables.values();
}

export function drawablePush(...drawable: Drawable): number {
  lastHandle += 1;
  drawables.set(lastHandle, drawable);
  return lastHandle;
}

export function drawableRemove(handle: number): void {
  drawables.delete(handle);
}

import { Point } from 'hex';

export const drawablePriority = {
  terrain: 0,
  buildings: 1,
  border: 2,
  toasts: 3,
  menu: 4,
} as const;

export const drawableMaxPriority = 5;

type Priority = typeof drawablePriority[keyof typeof drawablePriority];

type Drawable = [
  priority: Priority,
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

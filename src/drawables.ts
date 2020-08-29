import { Point } from 'hex';

export const drawablePriorityTerrain = 0;
export const drawablePriorityBuildings = 1;
export const drawablePriorityBorder = 2;
export const drawablePriorityToasts = 3;
export const drawablePriorityMenu = 4;
export const drawableMaxPriority = 5;

type Drawable = [
  priority:
    | typeof drawablePriorityTerrain
    | typeof drawablePriorityBuildings
    | typeof drawablePriorityBorder
    | typeof drawablePriorityToasts
    | typeof drawablePriorityMenu,
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

import { hexBaseWidth, hexHeight, hexWidth, Point } from 'hex';
import { getTextImage } from 'text';

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

export function drawablePush<Name extends keyof typeof drawableGetters>(
  name: Name,
  state: DrawableState<typeof drawableGetters[Name]>,
): number {
  lastHandle += 1;
  drawables.set(lastHandle, drawableGetters[name](state));
  return lastHandle;
}

export function drawableRemove(handle: number): void {
  drawables.delete(handle);
}

const hexVertices = [
  new Point<false>(-hexBaseWidth / 2, -hexHeight / 2),
  new Point<false>(hexBaseWidth / 2, -hexHeight / 2),
  new Point<false>(hexWidth / 2, 0),
  new Point<false>(hexBaseWidth / 2, hexHeight / 2),
  new Point<false>(-hexBaseWidth / 2, hexHeight / 2),
  new Point<false>(-hexWidth / 2, 0),
];

type DrawableState<DrawableGetter> = DrawableGetter extends (state: infer State) => Drawable
  ? State
  : never;

const drawableGetters = {
  drawHex: ({ name, hex }: { name: string; hex: Point<true> }) => (
    context: CanvasRenderingContext2D,
    camera: Point<false>,
    mouse: Point<false>,
    hoveredHex: Point<true>,
    hover: boolean,
  ): void => {
    context.lineJoin = 'round';
    context.lineWidth = 3;
    context.strokeStyle = 'black';
    context.fillStyle = 'hotpink';

    const relativeMid = hex.toCanvas().add(camera);

    context.beginPath();
    const [firstHex, ...restHexes] = hexVertices;
    context.moveTo(...relativeMid.add(firstHex).round().toArray());
    for (const restHex of restHexes) {
      context.lineTo(...relativeMid.add(restHex).round().toArray());
    }
    context.closePath();
    if (hover && hex.equal(hoveredHex)) {
      context.fill();
    }
    context.stroke();

    const text = getTextImage(`[${hex.x}, ${hex.y}]\n${name}`, [0, 0, 0]);
    context.drawImage(
      text,
      ...relativeMid
        .addCoords(-text.width * 1.5, -text.height * 1.5)
        .round()
        .toArray(),
      text.width * 3,
      text.height * 3,
    );
  },
};

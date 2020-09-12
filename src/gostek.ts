import { assert, assertRanOnce } from 'devAssert';
import { drawablePriorityId, drawablePush } from 'drawables';
import { Point } from 'hex';
import { pathFind } from 'pathFinder';
import { ResourceCount } from 'resources';

export type GostekState = [destination: Point, progress: number, resourcesCarried: ResourceCount];

const freeGosteks = new Set<Point>();
const busyGosteks = new Map<Point, GostekState>();

export function gostekInit(): void {
  assertRanOnce('gostekInit');

  drawablePush(drawablePriorityId.buildings, drawGosteks);
}

export function gostekReset(): void {
  freeGosteks.clear();
  busyGosteks.clear();
  for (let index = 0; index < 10; index += 1) {
    freeGosteks.add(new Point(2, 0));
  }
}

export function gostekHasFree(): boolean {
  return freeGosteks.size > 0;
}

export function gostekUseNClosest(
  hex: Point,
  n: number,
  getGostekState: (hex: Point) => GostekState,
): void {
  assert(() => gostekHasFree(), 'There are no free gosteks');
  let left = Math.min(n, freeGosteks.size);
  if (left === 0) {
    return;
  }
  const freeGostekHashMap = new Map([...freeGosteks.values()].map((hex) => [hex.toHash(), hex]));
  pathFind(hex, (hex) => {
    // add from to the pathFind predicate
    const hash = hex.toHash();
    if (freeGostekHashMap.has(hash)) {
      const gostek = freeGostekHashMap.get(hash)!;
      freeGosteks.delete(gostek);
      busyGosteks.set(gostek, getGostekState(gostek.add(new Point(1, 1))));
      left -= 1;
      return left === 0;
    }
  });
}

function drawGosteks(context: CanvasRenderingContext2D): void {
  console.log('drawGosteks');
  for (const [source, [destination, progress]] of busyGosteks) {
    console.log(source, destination, progress);
    context.beginPath();
    context.moveTo(
      ...destination
        .mul(progress)
        .add(source.mul(1 - progress))
        .toCanvas()
        .toArray(),
    );
    context.lineTo(...destination.toCanvas().toArray());
    context.lineWidth = 3;
    context.strokeStyle = 'black';
    context.stroke();
  }
}

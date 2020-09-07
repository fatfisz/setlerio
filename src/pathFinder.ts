import { buildings } from 'buildings';
import { colors } from 'colors';
import { drawPathFromPoints } from 'context';
import { assertRanOnce } from 'devAssert';
import { drawableNoopHandle, drawablePriorityId, drawablePush, drawableRemove } from 'drawables';
import { useGui } from 'gui';
import { hexVertices, neighborHexes, Point } from 'hex';
import { drawText } from 'text';

export function pathFinderInit(): void {
  assertRanOnce('pathFinderInit');

  useGui((gui) => {
    let handle = drawableNoopHandle;

    const pathFinder = {
      toggle(): void {
        if (handle === drawableNoopHandle) {
          handle = drawablePush(drawablePriorityId.border, drawPathFinder);
        } else {
          drawableRemove(handle);
          handle = drawableNoopHandle;
        }
      },
    };

    const folder = gui.addFolder('path finder');
    folder.add(pathFinder, 'toggle');
  });
}

let debugQueue: Set<[Point, ...any[]]> = new Set();

const fromMap: Record<number, number[]> = {
  0: [5, 0, 1],
  1: [0, 1, 2],
  2: [1, 2, 3],
  3: [2, 3, 4],
  4: [3, 4, 5],
  5: [4, 5, 0],
  6: [0, 1, 2, 3, 4, 5],
};

export function pathFind(start: Point, predicate: (hex: Point) => boolean | void): void {
  const visited = new Set<string>([start.toHash()]);
  const queue = new Set<[Point, number]>([[start, 6]]);
  for (const [hex, from] of queue) {
    for (const nextFrom of fromMap[from]) {
      const absoluteNeighborHex = neighborHexes[nextFrom].add(hex);
      const absoluteNeighborHash = absoluteNeighborHex.toHash();
      if (predicate(absoluteNeighborHex)) {
        return;
      }
      if (buildings.has(absoluteNeighborHash) && !visited.has(absoluteNeighborHash)) {
        visited.add(absoluteNeighborHash);
        queue.add([absoluteNeighborHex, nextFrom]);
      }
    }
  }

  debugQueue = queue;
}

function drawPathFinder(context: CanvasRenderingContext2D): void {
  const distances = new Map<string, number>();

  for (const [hex, from] of debugQueue.values()) {
    const prevHex = hex.sub(neighborHexes[from]);
    const distance = (distances.get(prevHex.toHash()) ?? -1) + 1;
    distances.set(hex.toHash(), distance);
    const relativeMid = hex.toCanvas();

    drawPathFromPoints(
      context,
      hexVertices.map((vertex) => vertex.add(relativeMid)),
    );
    context.fillStyle = `hsla(${distance * 60}, 80%, 60%, 0.75)`;
    context.fill();

    context.beginPath();
    context.moveTo(...relativeMid.toArray());
    context.lineTo(...prevHex.toCanvas().toArray());
    context.lineWidth = 1.5;
    context.strokeStyle = 'white';
    context.stroke();

    drawText(
      context,
      String(distance),
      colors.black,
      ...relativeMid.add(new Point(0.1, -0.1)).toArray(),
      0.5,
    );
  }
}

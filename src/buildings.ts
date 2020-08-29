import { assert } from 'devAssert';
import { getHighlightedHex } from 'display';
import { drawablePush, drawableRemove } from 'drawables';
import { eventQueuePush } from 'eventQueue';
import { fps } from 'frame';
import { fromHash, hexRange, hexVertices, neighborHexes, Point } from 'hex';
import { Requirements } from 'resources';
import { drawText } from 'text';

type BuildingName = 'blank' | 'townCenter' | 'lumberjackHut' | 'tower';
type AreaExpandingBuilding = 'townCenter' | 'tower';

interface BuildingInfo {
  name: BuildingName;
  hex: Point;
  drawableHandle: number;
}

const buildingDefs: Readonly<Record<
  BuildingName,
  {
    name: string;
    requirements: Requirements;
  }
>> = {
  blank: {
    name: '-',
    requirements: [],
  },
  townCenter: {
    name: 'town center',
    requirements: [],
  },
  lumberjackHut: {
    name: "lumberjack's hut",
    requirements: [
      ['wood', 2],
      ['stone', 2],
    ],
  },
  tower: {
    name: 'tower',
    requirements: [
      ['wood', 2],
      ['stone', 3],
    ],
  },
};

const areaExpandRadius = 2;
const buildings = new Map<string, BuildingInfo>();
const buildingsToDestroy = new Set<string>();
const borderHashes = new Set<string>();
let borderEstabilished = false;

export function buildingsInit(): void {
  if (!borderEstabilished) {
    drawablePush(drawBorder);
    eventQueuePush({
      run: animateBorder,
      duration: Infinity,
    });
    borderEstabilished = true;
  }

  buildings.clear();
  addAreaExpandingBuilding(new Point(0, 0), 'townCenter');
  addAreaExpandingBuilding(new Point(2, -2), 'tower');
  addAreaExpandingBuilding(new Point(3, -1), 'tower');
  removeAreaExpandingBuilding(new Point(2, -2));
}

function addAreaExpandingBuilding(hex: Point, name: AreaExpandingBuilding): void {
  setBuilding(hex, name, true);
  recalculateBorder(hex);
}

function removeAreaExpandingBuilding(hex: Point): void {
  assert(() => buildings.has(hex.toHash()), 'The building does not exist on the map');
  assert(
    () => ['townCenter', 'tower'].includes(buildings.get(hex.toHash())!.name),
    'The building does not expand the area',
  );
  setBuilding(hex, 'blank', true);
  recalculateBorder(hex);
}

function setBuilding(hex: Point, name: BuildingName, overwrite: boolean): void {
  const hash = hex.toHash();
  if (buildings.has(hash)) {
    if (!overwrite) {
      return;
    }
    drawableRemove(buildings.get(hash)!.drawableHandle);
  }
  buildings.set(hash, {
    name,
    hex,
    drawableHandle: drawablePush(
      drawBuilding({
        name: buildingDefs[name].name,
        hex,
      }),
      hex,
    ),
  });
}

function recalculateBorder(hex: Point): void {
  const neighborBorderHashes = new Set<string>();
  const neighborInnerHashes = new Set<string>();
  const add = buildings.get(hex.toHash())!.name !== 'blank';

  if (add) {
    for (const farNeighborHex of hexRange(hex, areaExpandRadius * 2)) {
      const building = buildings.get(farNeighborHex.toHash());
      if (building && (building.name === 'townCenter' || building.name === 'tower')) {
        for (const neighborHex of hexRange(building.hex, areaExpandRadius - 1)) {
          neighborInnerHashes.add(neighborHex.toHash());
        }
      }
    }

    for (const neighborHex of hexRange(hex, areaExpandRadius)) {
      setBuilding(neighborHex, 'blank', false);
    }

    for (const borderNeighborHex of hexRange(hex, areaExpandRadius, areaExpandRadius)) {
      const hash = borderNeighborHex.toHash();
      if (!neighborInnerHashes.has(hash)) {
        borderHashes.add(hash);
      }
    }

    for (const innerNeighborHex of hexRange(hex, areaExpandRadius - 1)) {
      const hash = innerNeighborHex.toHash();
      borderHashes.delete(hash);
    }
  } else {
    for (const farNeighborHex of hexRange(hex, areaExpandRadius * 2)) {
      const building = buildings.get(farNeighborHex.toHash());
      if (building && (building.name === 'townCenter' || building.name === 'tower')) {
        for (const neighborHex of hexRange(building.hex, areaExpandRadius, areaExpandRadius)) {
          neighborBorderHashes.add(neighborHex.toHash());
        }
        for (const neighborHex of hexRange(building.hex, areaExpandRadius - 1)) {
          neighborInnerHashes.add(neighborHex.toHash());
        }
      }
    }

    for (const neighborHash of neighborInnerHashes) {
      neighborBorderHashes.delete(neighborHash);
    }

    for (const neighborHex of hexRange(hex, areaExpandRadius)) {
      const hash = neighborHex.toHash();
      if (neighborBorderHashes.has(hash)) {
        borderHashes.add(hash);
      } else if (!neighborInnerHashes.has(hash)) {
        assert(
          () => buildings.has(hash),
          "The building has to exist since it's a neighbor of a deleted hex",
        );
        drawableRemove(buildings.get(hash)!.drawableHandle);
        buildings.delete(hash);
        buildingsToDestroy.add(hash);
        borderHashes.delete(hash);
      }
    }
  }
}

function drawBuilding({ name, hex }: { name: string; hex: Point }) {
  return (context: CanvasRenderingContext2D): void => {
    const relativeMid = hex.toCanvas();

    if (hex.equal(getHighlightedHex())) {
      context.beginPath();
      const [firstHex, ...restHexes] = hexVertices;
      context.moveTo(...relativeMid.add(firstHex).toArray());
      for (const restHex of restHexes) {
        context.lineTo(...relativeMid.add(restHex).toArray());
      }
      context.closePath();

      context.fillStyle = '#fffa';

      context.fill();
    }

    drawText(context, name, [0, 0, 0], ...relativeMid.toArray(), 0.5, 0.5);
  };
}

const dashLength = 6;
const dashSpace = 4;
const dashSpeed = (dashLength + dashSpace) / fps / 0.8;
let borderLineDashOffset = 0;

function drawBorder(context: CanvasRenderingContext2D): void {
  context.beginPath();

  for (const hash of borderHashes) {
    const hex = fromHash(hash);
    const relativeMid = hex.toCanvas();
    for (let index = 0; index < 6; index += 1) {
      if (!buildings.has(hex.add(neighborHexes[index]).toHash())) {
        context.moveTo(...relativeMid.add(hexVertices[index]).toArray());
        context.lineTo(...relativeMid.add(hexVertices[(index + 1) % 6]).toArray());
      }
    }
  }

  context.lineJoin = 'round';
  context.lineWidth = 4;
  context.strokeStyle = 'white';
  context.lineDashOffset = borderLineDashOffset;
  context.setLineDash([dashLength, dashSpace]);

  context.stroke();

  context.lineDashOffset = 0;
  context.setLineDash([]);
}

function animateBorder(currentFrame: number): void {
  borderLineDashOffset = (currentFrame * dashSpeed) % (dashLength + dashSpace);
}

import { assert, assertRanOnce } from 'devAssert';
import { getHighlightedHex } from 'display';
import { drawablePriority, drawablePush, drawableRemove } from 'drawables';
import { eventQueuePush } from 'eventQueue';
import { fps } from 'frame';
import { fromHash, hexRange, hexVertices, neighborHexes, Point } from 'hex';
import { MenuOption } from 'menu';
import { deduceResources, getMissingResourceInfo, Requirements } from 'resources';
import { drawText } from 'text';
import { toastAdd } from 'toast';

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

export function buildingsInit(): void {
  assertRanOnce('buildingsInit');

  drawablePush(drawablePriority.border, drawBorder);
  eventQueuePush({
    run: animateBorder,
    duration: Infinity,
  });

  addBuilding(new Point(0, 0), 'townCenter');
  addBuilding(new Point(2, -2), 'tower');
  addBuilding(new Point(3, -1), 'tower');
  removeBuilding(new Point(2, -2));
}

function addBuilding(hex: Point, name: BuildingName): void {
  setBuilding(hex, name, true);
  if (isAreaExpandingBuilding(name)) {
    recalculateBorder(hex);
  }
}

function removeBuilding(hex: Point): void {
  assert(() => buildings.has(hex.toHash()), 'The building does not exist on the map');
  const { name } = buildings.get(hex.toHash())!;
  setBuilding(hex, 'blank', true);
  if (isAreaExpandingBuilding(name)) {
    recalculateBorder(hex);
  }
}

function isAreaExpandingBuilding(name: BuildingName): name is AreaExpandingBuilding {
  return name === 'townCenter' || name === 'tower';
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
      drawablePriority.buildings,
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
      if (building && isAreaExpandingBuilding(building.name)) {
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
      if (building && isAreaExpandingBuilding(building.name)) {
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

export function getBuildingOptions(hex: Point): MenuOption[] | undefined {
  const hash = hex.toHash();
  if (!buildings.has(hash)) {
    return;
  }
  return [
    [
      'build',
      [
        [buildingDefs.lumberjackHut.name, (): void => build(hex, 'lumberjackHut')],
        [buildingDefs.tower.name, (): void => build(hex, 'tower')],
      ],
    ],
  ];
}

function build(hex: Point, name: BuildingName): void {
  const building = buildingDefs[name];
  const missingResourceInfo = getMissingResourceInfo(building.requirements);
  if (missingResourceInfo) {
    toastAdd(missingResourceInfo);
  } else {
    addBuilding(hex, name);
    deduceResources(building.requirements);
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

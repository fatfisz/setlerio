import { drawPathFromPoints } from 'context';
import { assert, assertRanOnce } from 'devAssert';
import { getHighlightedHex } from 'display';
import { drawablePriorityId, drawablePush, drawableRemove } from 'drawables';
import { eventQueuePush, eventQueueRemove } from 'eventQueue';
import { fps } from 'frame';
import { fromHash, hexRange, hexVertices, neighborHexes, Point } from 'hex';
import { MenuOption } from 'menu';
import { progressAdd } from 'progressBar';
import { deduceResources, getMissingResourceInfo, TimedResources } from 'resources';
import { drawText } from 'text';
import { toastAdd } from 'toast';

const buildingId = {
  blank: 0,
  townCenter: 1,
  tower: 2,
  lumberjackHut: 3,
} as const;

type BuildingId = typeof buildingId[keyof typeof buildingId];

type AreaExpandingBuilding = typeof buildingId.townCenter | typeof buildingId.tower;

interface BuildingInfo {
  id: BuildingId;
  hex: Point;
  drawableHandle: number;
  cancel?: () => void;
}

const buildingDefs: {
  name: string;
  requirements?: TimedResources;
  production?: TimedResources;
  indestructible?: boolean;
}[] = [
  { name: '', indestructible: true },
  { name: 'town center', indestructible: true },
  {
    name: 'tower',
    requirements: [
      [
        ['wood', 2],
        ['stone', 3],
      ],
      5000,
    ],
  },
  {
    name: "lumberjack's hut",
    requirements: [
      [
        ['wood', 2],
        ['stone', 2],
      ],
      5000,
    ],
    production: [[['wood', 1]], 5000],
  },
];

const areaExpandRadius = 2;
const buildings = new Map<string, BuildingInfo>();
const buildingsToDestroy = new Set<string>();
const borderHashes = new Set<string>();

export function buildingsInit(): void {
  assertRanOnce('buildingsInit');

  drawablePush(drawablePriorityId.border, drawBorder);
  eventQueuePush({
    run: animateBorder,
    duration: Infinity,
  });

  addBuilding(new Point(0, 0), buildingId.townCenter);
  addBuilding(new Point(2, -2), buildingId.tower);
  addBuilding(new Point(3, -1), buildingId.tower);
  removeBuilding(new Point(2, -2));
}

function addBuilding(hex: Point, id: BuildingId): void {
  setBuilding(hex, id, true);
  if (isAreaExpandingBuilding(id)) {
    recalculateBorder(hex);
  }
}

function removeBuilding(hex: Point): void {
  assert(
    () => buildings.has(hex.toHash()),
    () => `There is no building at ${hex.toHash()}`,
  );
  const { id } = buildings.get(hex.toHash())!;
  assert(!buildingDefs[id].indestructible, () => `Building "${idToName(id)}" is indestructible`);
  setBuilding(hex, buildingId.blank, true);
  if (isAreaExpandingBuilding(id)) {
    recalculateBorder(hex);
  }
}

function isAreaExpandingBuilding(id: BuildingId): id is AreaExpandingBuilding {
  return id === buildingId.townCenter || id === buildingId.tower;
}

function setBuilding(hex: Point, id: BuildingId, overwrite: boolean): void {
  const hash = hex.toHash();
  if (buildings.has(hash)) {
    if (!overwrite) {
      return;
    }
    cleanUpBuilding(buildings.get(hash)!);
  }
  buildings.set(hash, {
    id,
    hex,
    drawableHandle: drawablePush(
      drawablePriorityId.buildings,
      drawBuilding({
        name: idToName(id),
        hex,
      }),
      hex,
    ),
  });
}

function recalculateBorder(hex: Point): void {
  const neighborBorderHashes = new Set<string>();
  const neighborInnerHashes = new Set<string>();
  const add = buildings.get(hex.toHash())!.id !== buildingId.blank;

  for (const farNeighborHex of hexRange(hex, areaExpandRadius * 2)) {
    const building = buildings.get(farNeighborHex.toHash());
    if (building && isAreaExpandingBuilding(building.id)) {
      for (const neighborHex of hexRange(building.hex, areaExpandRadius, areaExpandRadius)) {
        neighborBorderHashes.add(neighborHex.toHash());
      }
      for (const neighborHex of hexRange(building.hex, areaExpandRadius - 1)) {
        neighborInnerHashes.add(neighborHex.toHash());
      }
    }
  }

  if (add) {
    for (const neighborHex of hexRange(hex, areaExpandRadius)) {
      setBuilding(neighborHex, buildingId.blank, false);
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
        cleanUpBuilding(buildings.get(hash)!);
        buildings.delete(hash);
        buildingsToDestroy.add(hash);
        borderHashes.delete(hash);
      }
    }
  }
}

function cleanUpBuilding(building: BuildingInfo): void {
  drawableRemove(building.drawableHandle);
  if (building.cancel) {
    building.cancel();
  }
}

export function getBuildingOptions(hex: Point): MenuOption[] | undefined {
  const hash = hex.toHash();
  if (!buildings.has(hash)) {
    return;
  }
  const building = buildings.get(hash)!;
  if (building.cancel) {
    return [['cancel', (): void => actionCancel(hex)]];
  } else if (building.id === buildingId.blank) {
    return [
      [
        'build',
        [
          [
            idToName(buildingId.lumberjackHut),
            (): void => actionBuild(hex, buildingId.lumberjackHut),
          ],
          [idToName(buildingId.tower), (): void => actionBuild(hex, buildingId.tower)],
        ],
      ],
    ];
  } else if (!buildingDefs[building.id].indestructible) {
    return [['destroy', (): void => actionDestroy(hex)]];
  }
}

function actionBuild(hex: Point, id: BuildingId): void {
  const { requirements } = buildingDefs[id];
  assert(requirements, () => `Building "${idToName(id)}" cannot be built`);
  const missingResourceInfo = getMissingResourceInfo(requirements);
  if (missingResourceInfo) {
    toastAdd(missingResourceInfo);
    return;
  }

  assert(
    () => buildings.has(hex.toHash()),
    () => `There is no building at ${hex.toHash()}`,
  );
  const building = buildings.get(hex.toHash())!;
  assert(building.id === buildingId.blank, 'New buildings can only be built on blank hexes');
  assert(!building.cancel, 'Cannot build on the same hex as another building in progress');

  const [updateProgress, destroyProgress] = progressAdd(hex);
  const eventHandle = eventQueuePush({
    run: (currentFrame, totalFrames) => {
      if (currentFrame === totalFrames) {
        destroyProgress();
        addBuilding(hex, id);
      } else {
        updateProgress(currentFrame / totalFrames);
      }
    },
    duration: requirements[1],
  });

  building.cancel = (): void => {
    // TODO: Restore resources
    destroyProgress();
    eventQueueRemove(eventHandle);
    building.cancel = undefined;
  };

  deduceResources(requirements);
}

function actionDestroy(hex: Point): void {
  // TODO: restore some resources
  removeBuilding(hex);
}

function actionCancel(hex: Point): void {
  assert(
    () => buildings.has(hex.toHash()),
    () => `There is no building at ${hex.toHash()}`,
  );
  const building = buildings.get(hex.toHash())!;
  // The !! "operator" is used because it allows TS to understand that
  // building.cancel is a function without calling it
  assert(!!building.cancel, 'The cancel function should be present');
  building.cancel();
}

function drawBuilding({ name, hex }: { name: string; hex: Point }) {
  return (context: CanvasRenderingContext2D): void => {
    const relativeMid = hex.toCanvas();

    if (hex.equal(getHighlightedHex())) {
      drawPathFromPoints(
        context,
        hexVertices.map((vertex) => vertex.add(relativeMid)),
      );
      context.fillStyle = '#fff9';
      context.fill();
    }

    if (name) {
      drawText(context, name, [0, 0, 0], ...relativeMid.toArray(), 0.5, 0.5);
    }
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
  // Clean up unique properties
  context.lineDashOffset = 0;
  context.setLineDash([]);
}

function animateBorder(currentFrame: number): void {
  borderLineDashOffset = (currentFrame * dashSpeed) % (dashLength + dashSpace);
}

function idToName(id: BuildingId): string {
  return buildingDefs[id].name;
}

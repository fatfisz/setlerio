import { colors } from 'colors';
import { drawPathFromPoints } from 'context';
import { assert, assertRanOnce } from 'devAssert';
import { closeMenuIfOpenAt, getHighlightedHex } from 'display';
import { drawablePriorityId, drawablePush, drawableRemove } from 'drawables';
import { eventQueuePush, eventQueueRemove } from 'eventQueue';
import { fps } from 'frame';
import { fromHash, hexRange, hexVertices, neighborHexes, Point } from 'hex';
import { MenuOption } from 'menu';
import { progressAdd } from 'progressBar';
import {
  ResourceCount,
  resourcesDeduce,
  resourcesGetMissingMessage,
  resourcesRestore,
  TimedResourceCount,
  timedResourceCountTupleTime,
} from 'resources';
import { drawText } from 'text';
import { toastAdd } from 'toast';

const buildingId = {
  blank: 0,
  townCenter: 1,
  tower: 2,
  lumberjackHut: 3,
} as const;

type BuildingId = typeof buildingId[keyof typeof buildingId];

type AreaExpandingBuildingId = typeof buildingId.townCenter | typeof buildingId.tower;

type Building = [id: BuildingId, hex: Point, drawableHandle: number, cancel?: () => void];

const buildingTupleId = 0;
const buildingTupleHex = 1;
const buildingTupleCancel = 3;

const buildingDefs: [
  name: string,
  requirements?: ResourceCount,
  production?: TimedResourceCount,
  indestructible?: boolean,
][] = [
  ['', , , true],
  ['town center', , , true],
  ['tower', [0, 2, 3, 0, 0]],
  ["lumberjack's hut", [0, 2, 2, 0, 0], [5000, 0, 1, 0, 0, 0]],
];

const buildingDefTupleName = 0;
const buildingDefTupleIndestructible = 3;

const areaExpandRadius = 2;
export const buildings = new Map<string, Building>();
const buildingsToDestroy = new Set<string>();
const borderHashes = new Set<string>();

export function buildingsInit(): void {
  assertRanOnce('buildingsInit');

  eventQueuePush(animateFocus, Infinity);
  drawablePush(drawablePriorityId.border, drawBorder);
  eventQueuePush(animateBorder, Infinity);
}

export function buildingsReset(): void {
  buildings.clear();
  buildingsToDestroy.clear();
  borderHashes.clear();
  addBuilding(new Point(0, 0), buildingId.townCenter);
  addBuilding(new Point(3, -1), buildingId.tower);
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
  const [id] = buildings.get(hex.toHash())!;
  assert(
    !buildingDefs[id][buildingDefTupleIndestructible],
    () => `Building "${buildingDefs[id][buildingDefTupleName]}" is indestructible`,
  );
  setBuilding(hex, buildingId.blank, true);
  if (isAreaExpandingBuilding(id)) {
    recalculateBorder(hex);
  }
}

function isAreaExpandingBuilding(id: BuildingId): id is AreaExpandingBuildingId {
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
  buildings.set(hash, [
    id,
    hex,
    drawablePush(
      drawablePriorityId.buildings,
      drawBuilding(hex, buildingDefs[id][buildingDefTupleName]),
      hex,
    ),
  ]);
}

function recalculateBorder(hex: Point): void {
  const neighborBorderHashes = new Set<string>();
  const neighborInnerHashes = new Set<string>();
  const add = buildings.get(hex.toHash())![buildingTupleId] !== buildingId.blank;

  for (const farNeighborHex of hexRange(hex, areaExpandRadius * 2)) {
    const building = buildings.get(farNeighborHex.toHash());
    if (building && isAreaExpandingBuilding(building[buildingTupleId])) {
      for (const neighborHex of hexRange(
        building[buildingTupleHex],
        areaExpandRadius,
        areaExpandRadius,
      )) {
        neighborBorderHashes.add(neighborHex.toHash());
      }
      for (const neighborHex of hexRange(building[buildingTupleHex], areaExpandRadius - 1)) {
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

function cleanUpBuilding([, , drawableHandle, cancel]: Building): void {
  drawableRemove(drawableHandle);
  if (cancel) {
    cancel();
  }
}

export function getBuildingOptions(hex: Point): MenuOption[] | undefined {
  const hash = hex.toHash();
  if (!buildings.has(hash)) {
    return;
  }
  const [id, , , cancel] = buildings.get(hash)!;
  if (cancel) {
    return [['cancel', (): void => actionCancel(hex)]];
  } else if (id === buildingId.blank) {
    return [
      [
        'build',
        [
          [
            buildingDefs[buildingId.lumberjackHut][buildingDefTupleName],
            (): void => actionBuild(hex, buildingId.lumberjackHut),
          ],
          [
            buildingDefs[buildingId.tower][buildingDefTupleName],
            (): void => actionBuild(hex, buildingId.tower),
          ],
        ],
      ],
    ];
  } else if (!buildingDefs[id][buildingDefTupleIndestructible]) {
    return [['destroy', (): void => actionDestroy(hex)]];
  }
}

export function hasBuildingOptions(hex: Point): boolean {
  assert(
    () => buildings.has(hex.toHash()),
    'Building options check can only be performed on existing buildings',
  );
  const [id] = buildings.get(hex.toHash())!;
  return id === buildingId.blank || !buildingDefs[id][buildingDefTupleIndestructible];
}

function actionBuild(hex: Point, id: BuildingId): void {
  const [, requirements] = buildingDefs[id];
  assert(
    requirements,
    () => `Building "${buildingDefs[id][buildingDefTupleName]}" cannot be built`,
  );
  const missingResourceInfo = resourcesGetMissingMessage(requirements);
  if (missingResourceInfo) {
    toastAdd(missingResourceInfo);
    return;
  }

  assert(
    () => buildings.has(hex.toHash()),
    () => `There is no building at ${hex.toHash()}`,
  );
  const building = buildings.get(hex.toHash())!;
  assert(
    building[buildingTupleId] === buildingId.blank,
    'New buildings can only be built on blank hexes',
  );
  assert(
    !building[buildingTupleCancel],
    'Cannot build on the same hex as another building in progress',
  );

  const [updateProgress, destroyProgress] = progressAdd(hex);
  const eventHandle = eventQueuePush((currentFrame, totalFrames) => {
    if (currentFrame === totalFrames) {
      closeMenuIfOpenAt(hex);
      destroyProgress();
      building[buildingTupleCancel] = undefined;
      addBuilding(hex, id);
    } else {
      updateProgress(currentFrame / totalFrames);
    }
  }, requirements[timedResourceCountTupleTime]);

  building[buildingTupleCancel] = (): void => {
    resourcesRestore(requirements);
    destroyProgress();
    eventQueueRemove(eventHandle);
    building[buildingTupleCancel] = undefined;
  };

  resourcesDeduce(requirements);
}

function actionDestroy(hex: Point): void {
  assert(
    () => buildings.has(hex.toHash()),
    () => `There is no building at ${hex.toHash()}`,
  );
  const [id] = buildings.get(hex.toHash())!;
  const [, requirements] = buildingDefs[id];
  assert(
    requirements,
    () => `Building "${buildingDefs[id][buildingDefTupleName]}" could not have been built`,
  );
  resourcesRestore(requirements, 0.5);
  removeBuilding(hex);
}

function actionCancel(hex: Point): void {
  assert(
    () => buildings.has(hex.toHash()),
    () => `There is no building at ${hex.toHash()}`,
  );
  const [, , , cancel] = buildings.get(hex.toHash())!;
  assert(() => cancel, 'The cancel function should be present');
  cancel!();
}

const focusMinZoom = 1;
const focusMaxZoom = 1.03;
const focusPeriod = 5;
const focusSpeed = focusPeriod / fps / 0.8;
let focusOffset = 0;

function drawBuilding(hex: Point, name: string) {
  return (context: CanvasRenderingContext2D): void => {
    const relativeMid = hex.toCanvas();

    if (hex.equal(getHighlightedHex()) && hasBuildingOptions(hex)) {
      const zoomAlpha = Math.abs(1 - (2 * focusOffset) / focusPeriod) ** 2;
      const zoomFactor = focusMinZoom * zoomAlpha + focusMaxZoom * (1 - zoomAlpha);
      drawPathFromPoints(
        context,
        hexVertices.map((vertex) => vertex.mul(zoomFactor).add(relativeMid)),
      );
      context.lineWidth = 5;
      context.strokeStyle = colors.white;
      context.stroke();
    }

    if (name) {
      drawText(context, name, colors.black, ...relativeMid.toArray(), 0.5, 0.5);
    }
  };
}

function animateFocus(currentFrame: number): void {
  focusOffset = (currentFrame * focusSpeed) % focusPeriod;
}

const dashLength = 6;
const dashSpace = 4;
const dashPeriod = dashLength + dashSpace;
const dashSpeed = dashPeriod / fps / 0.8;
let borderLineDashOffset = 0;

function drawBorder(context: CanvasRenderingContext2D): void {
  context.beginPath();
  for (const hash of borderHashes) {
    const hex = fromHash(hash);
    if (!hex.equal(getHighlightedHex())) {
      const relativeMid = hex.toCanvas();
      for (let index = 0; index < 6; index += 1) {
        if (!buildings.has(hex.add(neighborHexes[index]).toHash())) {
          context.moveTo(...relativeMid.add(hexVertices[index]).toArray());
          context.lineTo(...relativeMid.add(hexVertices[(index + 1) % 6]).toArray());
        }
      }
    }
  }
  context.lineJoin = 'round';
  context.lineWidth = 4.5;
  context.strokeStyle = colors.white;
  context.lineDashOffset = borderLineDashOffset;
  context.setLineDash([dashLength, dashSpace]);
  context.stroke();
  // Clean up unique properties
  context.lineDashOffset = 0;
  context.setLineDash([]);
}

function animateBorder(currentFrame: number): void {
  borderLineDashOffset = (currentFrame * dashSpeed) % dashPeriod;
}

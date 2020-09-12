import { colors } from 'colors';
import { displayWidth } from 'config';
import { assert, assertRanOnce } from 'devAssert';
import { useResetTransform } from 'display';
import { drawableNoopHandle, drawablePriorityId, drawablePush } from 'drawables';
import { useGui } from 'gui';
import { Point } from 'hex';
import { pathFind } from 'pathFinder';
import { drawText } from 'text';

export type ResourceCount = [food: number, wood: number, stone: number, iron: number, gold: number];

const resourceLength: ResourceCount['length'] = 5;

type ResourceInfo = [
  resourceCount: ResourceCount,
  reservedResourceCount: ResourceCount,
  drawableHandle: number,
];

export type TimedResourceCount = [time: number, ...resourceCount: ResourceCount];

export const timedResourceCountTupleTime = 0;

const resourceNames = ['food', 'wood', 'stone', 'iron', 'gold'];
const totalResourceCount: ResourceCount = [0, 0, 0, 0, 0];
const resourceInfos = new Map<string, ResourceInfo>();

export function resourcesInit(): void {
  assertRanOnce('resourcesInit');

  useGui((gui) => {
    const townCenterResources = Object.create(
      Object.prototype,
      Object.fromEntries(
        resourceNames.map<[string, PropertyDescriptor]>((name, index) => [
          name,
          {
            get(): number {
              return totalResourceCount[index];
            },
            set(value: number): void {
              totalResourceCount[index] = value;
            },
          },
        ]),
      ),
    );

    const folder = gui.addFolder('town center resources');
    folder.open();
    folder.add(townCenterResources, 'food', 0, undefined, 1);
    folder.add(townCenterResources, 'wood', 0, undefined, 1);
    folder.add(townCenterResources, 'stone', 0, undefined, 1);
    folder.add(townCenterResources, 'iron', 0, undefined, 1);
    folder.add(townCenterResources, 'gold', 0, undefined, 1);
  });

  drawablePush(drawablePriorityId.hud, drawResources);
}

export function resourcesReset(): void {
  totalResourceCount.fill(0);
  resourceInfos.clear();
  addResources(new Point(0, 0), [0, 8, 6, 0, 0]);
}

function addResources(hex: Point, resourceCount: ResourceCount): void {
  const [currentResourceCount] = ensureResourceInfo(hex);
  addResourceCounts(currentResourceCount, resourceCount);
  addResourceCounts(totalResourceCount, resourceCount);
}

function ensureResourceInfo(hex: Point): ResourceInfo {
  const hash = hex.toHash();
  if (!resourceInfos.has(hash)) {
    resourceInfos.set(hash, [[0, 0, 0, 0, 0], [0, 0, 0, 0, 0], drawableNoopHandle]);
  }
  return resourceInfos.get(hash)!;
}

export function resourcesReserveMax(hex: Point, resourceCount: ResourceCount): ResourceCount[] {
  const [targetResourceCount, targetReservedResourceCount] = ensureResourceInfo(hex);
  const maxCommonResourceCount = getMaxCommonResourceCount(resourceCount, targetResourceCount);
  console.log(resourceCount, targetResourceCount, maxCommonResourceCount);
  subResourceCounts(resourceCount, maxCommonResourceCount);
  subResourceCounts(targetResourceCount, maxCommonResourceCount);
  addResourceCounts(targetReservedResourceCount, maxCommonResourceCount);
  return splitIntoSingles(maxCommonResourceCount);
}

export function resourcesGetMissingMessage(resourceCount: ResourceCount): string | undefined {
  const missing = resourceCount
    .map((count, index) => [count - totalResourceCount[index], resourceNames[index]])
    .filter(([diff]) => diff > 0)
    .map(([diff, name]) => `${diff} ${name}`);
  if (missing.length > 0) {
    return `missing: ${missing.join(', ')}`;
  }
}

/** @deprecated */
export function resourcesDeduce(resourceCount: ResourceCount): void {
  for (const [index, count] of resourceCount.entries()) {
    assert(count <= totalResourceCount[index], `Not enough ${resourceNames[index]}`);
    totalResourceCount[index] -= count;
  }
}

/** @deprecated */
export function resourcesRestore(resourceCount: ResourceCount, mod = 1): void {
  for (const [index, count] of resourceCount.entries()) {
    totalResourceCount[index] += Math.ceil(count * mod);
  }
}

const resourceBarHeight = 48;
const resourceBarPadding = 24;

function drawResources(context: CanvasRenderingContext2D): void {
  useResetTransform(() => {
    context.fillStyle = colors.white;
    context.fillRect(0, 0, displayWidth, resourceBarHeight);
    drawText(
      context,
      getResourcesText(),
      colors.black,
      resourceBarPadding,
      resourceBarHeight / 2,
      0,
      0.5,
    );
  });
}

function getResourcesText(): string {
  return totalResourceCount
    .map((count, index) => `${resourceNames[index]}: ${String(count).padStart(4, ' ')}`)
    .join('   ');
}

function addResourceCounts(target: ResourceCount, source: ResourceCount): void {
  for (let index = 0; index < target.length; index += 1) {
    target[index] += source[index];
  }
}

function subResourceCounts(target: ResourceCount, source: ResourceCount): void {
  for (let index = 0; index < target.length; index += 1) {
    target[index] -= source[index];
  }
}

function getMaxCommonResourceCount(first: ResourceCount, second: ResourceCount): ResourceCount {
  return first.map((count, index) => Math.min(count, second[index])) as ResourceCount;
}

function splitIntoSingles(source: ResourceCount): ResourceCount[] {
  return source
    .reduce(
      (singles, singleResourceCount, index) => [
        ...singles,
        Array(singleResourceCount).fill(getSingle(index)),
      ],
      [] as ResourceCount[][],
    )
    .flat();
}

function getSingle(index: number): ResourceCount {
  const single: ResourceCount = [0, 0, 0, 0, 0];
  single[index] = 1;
  return single;
}

// setTimeout(() => {
//   pathFind(new Point(3, -1), (hex) => {
//     const resourceInfo = ensureResourceInfo(hex);
//     console.log(JSON.stringify({ hex, resourceInfo }));
//   });
// }, 1000);

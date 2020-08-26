import { drawablePush, drawableRemove } from 'drawables';
import { eventQueuePush } from 'eventQueue';
import { fps, getNextFrame } from 'frame';
import { fromHash, hexVertices, neighborHexes, Point } from 'hex';
import { deduceResources, getMissingResourceInfo, Requirements } from 'resources';
import { getTextImage } from 'text';

type BuildingName = 'blank' | 'townCenter' | 'lumberjackHut' | 'tower';
type AreaExpandingBuilding = 'townCenter' | 'tower';

interface BuildingInfo {
  name: BuildingName;
  hex: Point<true>;
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

const buildings = new Map<string, BuildingInfo>();
const buildingsToDestroy = new Set<string>();
const borderHexes = new Set<Point<true>>();
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
  addAreaExpandingBuilding('townCenter', new Point(0, 0));
  addAreaExpandingBuilding('tower', new Point(2, -2));
  addAreaExpandingBuilding('tower', new Point(3, -1));
}

function addAreaExpandingBuilding(name: AreaExpandingBuilding, hex: Point<true>): void {
  setBuilding(hex, name, true);
  recalculateBorder();
}

function setBuilding(hex: Point<true>, name: BuildingName, overwrite: boolean): void {
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
      drawHex({
        name: buildingDefs[name].name,
        hex,
      }),
      hex,
    ),
  });
}

function recalculateBorder(): void {
  const buildingHashes = new Set<string>();
  borderHexes.clear();

  for (const building of buildings.values()) {
    if (building.name === 'townCenter' || building.name === 'tower') {
      for (const neighborHexFirstLayer of neighborHexes) {
        for (const neighborHexSecondLayer of neighborHexes) {
          buildingHashes.add(
            building.hex.add(neighborHexFirstLayer).add(neighborHexSecondLayer).toHash(),
          );
        }
      }
    }
  }

  for (const hash of buildingHashes) {
    const hex = fromHash(hash);
    setBuilding(hex, 'blank', false);
    for (const neighborHex of neighborHexes) {
      if (!buildingHashes.has(hex.add(neighborHex).toHash())) {
        borderHexes.add(hex);
        break;
      }
    }
  }

  for (const [hash, building] of buildings) {
    if (!buildingHashes.has(hash)) {
      drawableRemove(building.drawableHandle);
      buildings.delete(hash);
      buildingsToDestroy.add(hash);
    }
  }
}

export function addBuildingButton(name: BuildingName): void {
  const button = document.createElement('button');
  button.textContent = `Build ${buildingDefs[name].name}`;
  button.addEventListener('click', () => {
    build(name);
  });
  document.body.append(button);
}

function build(name: BuildingName): void {
  const building = buildingDefs[name];
  const missingResourceInfo = getMissingResourceInfo(building.requirements);

  if (missingResourceInfo.length > 0) {
    const pre = document.createElement('pre');
    pre.textContent = missingResourceInfo.join('\n');
    document.body.append(pre);
    eventQueuePush({
      frame: getNextFrame(5000),
      run: () => {
        document.body.removeChild(pre);
      },
    });
  } else {
    deduceResources(building.requirements);
  }
}

function drawHex({ name, hex }: { name: string; hex: Point<true> }) {
  return (context: CanvasRenderingContext2D, hoveredHex: Point<true> | undefined): void => {
    context.lineJoin = 'round';
    context.lineWidth = 3;
    context.strokeStyle = 'black';
    context.fillStyle = '#fffa';

    const relativeMid = hex.toCanvas();

    context.beginPath();
    const [firstHex, ...restHexes] = hexVertices;
    context.moveTo(...relativeMid.add(firstHex).toArray());
    for (const restHex of restHexes) {
      context.lineTo(...relativeMid.add(restHex).toArray());
    }
    context.closePath();
    if (hoveredHex && hex.equal(hoveredHex)) {
      context.fill();
    }

    const text = getTextImage(name, [0, 0, 0]);
    context.drawImage(
      text,
      ...relativeMid.add(new Point<false>(text.width, text.height).mul(-1.5)).round().toArray(),
      text.width * 3,
      text.height * 3,
    );
  };
}

const dashLength = 6;
const dashSpace = 4;
const dashSpeed = (dashLength + dashSpace) / fps / 0.8;
let borderLineDashOffset = 0;

function drawBorder(context: CanvasRenderingContext2D): void {
  context.beginPath();

  for (const hex of borderHexes) {
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

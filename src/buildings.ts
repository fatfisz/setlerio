import { drawablePush, drawableRemove } from 'drawables';
import { eventQueuePush } from 'eventQueue';
import { getNextFrame } from 'frame';
import { neighborOffsets, Point } from 'hex';
import { deduceResources, getMissingResourceInfo, Requirements } from 'resources';

type BuildingName = 'blank' | 'townCenter' | 'lumberjackHut' | 'tower';

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

export function buildingsInit(): void {
  buildings.clear();
  addAreaExpandingBuilding('townCenter', new Point(0, 0));
}

function addAreaExpandingBuilding(name: 'townCenter' | 'tower', hex: Point<true>): void {
  setBuilding(hex, name, true);
  neighborOffsets.forEach((neighborHex) => {
    setBuilding(hex.add(neighborHex), 'blank', false);
  });
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
    drawableHandle: drawablePush('drawHex', {
      name: buildingDefs[name].name,
      hex,
    }),
  });
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

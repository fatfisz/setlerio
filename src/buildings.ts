import { Requirements, getMissingResourceInfo, deduceResources } from 'resources';
import { eventQueuePush } from 'eventQueue';
import { getNextFrame } from 'frame';

type BuildingName = 'townCenter' | 'lumberjackHut' | 'tower';

const buildings: Record<
  BuildingName,
  {
    name: string;
    count: number;
    requirements: Requirements;
  }
> = {
  townCenter: {
    name: 'town center',
    count: 1,
    requirements: [],
  },
  lumberjackHut: {
    name: "lumberjack's hut",
    count: 0,
    requirements: [
      ['wood', 2],
      ['stone', 2],
    ],
  },
  tower: {
    name: 'tower',
    count: 0,
    requirements: [
      ['wood', 2],
      ['stone', 3],
    ],
  },
};

export function addBuildingButton(name: BuildingName): void {
  const button = document.createElement('button');
  button.textContent = `Build ${buildings[name].name}`;
  button.addEventListener('click', () => {
    build(name);
  });
  document.body.append(button);
}

function build(name: BuildingName): void {
  const building = buildings[name];
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
    building.count += 1;
  }
}

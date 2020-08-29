import { assert, assertRanOnce } from 'devAssert';
import { useGui } from 'gui';

type ResourceName = 'food' | 'wood' | 'stone' | 'iron' | 'gold';

export type Requirements = [ResourceName, number][];

const resources: Record<ResourceName, number> = {
  food: Infinity,
  wood: Infinity,
  stone: Infinity,
  iron: Infinity,
  gold: Infinity,
};

export function resourcesInit(): void {
  assertRanOnce('resourcesInit');

  useGui((gui) => {
    gui.open();
    const folder = gui.addFolder('resources');
    folder.open();
    folder.add(resources, 'food', 0, undefined, 1);
    folder.add(resources, 'wood', 0, undefined, 1);
    folder.add(resources, 'stone', 0, undefined, 1);
    folder.add(resources, 'iron', 0, undefined, 1);
    folder.add(resources, 'gold', 0, undefined, 1);
  });
}

export function getMissingResourceInfo(requirements: Requirements): string[] {
  return requirements
    .filter(([name, count]) => count > resources[name])
    .map(([name]) => `Not enough ${name}`);
}

export function deduceResources(requirements: Requirements): void {
  for (const [name, count] of requirements) {
    assert(count <= resources[name], `Not enough ${name}`);
    resources[name] -= count;
  }
}

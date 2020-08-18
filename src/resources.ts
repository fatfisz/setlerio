import { assert } from 'devAssert';
import { useGui } from 'gui';

type ResourceName = 'food' | 'wood' | 'stone' | 'iron' | 'gold';

export type Requirements = [ResourceName, number][];

const resources: Record<ResourceName, number> = {
  food: 0,
  wood: 2,
  stone: 10,
  iron: 0,
  gold: 0,
};

export function resourcesInit(): void {
  useGui((gui) => {
    gui.open();
    gui.add(resources, 'food');
    gui.add(resources, 'wood');
    gui.add(resources, 'stone');
    gui.add(resources, 'iron');
    gui.add(resources, 'gold');
  });
}

export function getMissingResourceInfo(requirements: Requirements): string[] {
  return requirements
    .filter(([name, count]) => count > resources[name])
    .map(([name]) => `Not enough ${name}`);
}

export function deduceResources(requirements: Requirements): void {
  requirements.forEach(([name, count]) => {
    assert(count <= resources[name], `Not enough ${name}`);
    resources[name] -= count;
  });
}

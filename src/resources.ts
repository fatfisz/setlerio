import { displayWidth } from 'config';
import { assert, assertRanOnce } from 'devAssert';
import { useResetTransform } from 'display';
import { drawablePriorityId, drawablePush } from 'drawables';
import { useGui } from 'gui';
import { drawText } from 'text';

type ResourceName = 'food' | 'wood' | 'stone' | 'iron' | 'gold';

export type TimedResources = [items: [name: ResourceName, quantity: number][], time: number];

const resources: Record<ResourceName, number> = {
  food: 100,
  wood: 100,
  stone: 100,
  iron: 100,
  gold: 100,
};

export function resourcesInit(): void {
  assertRanOnce('resourcesInit');

  useGui((gui) => {
    const folder = gui.addFolder('resources');
    folder.open();
    folder.add(resources, 'food', 0, undefined, 1);
    folder.add(resources, 'wood', 0, undefined, 1);
    folder.add(resources, 'stone', 0, undefined, 1);
    folder.add(resources, 'iron', 0, undefined, 1);
    folder.add(resources, 'gold', 0, undefined, 1);
  });

  drawablePush(drawablePriorityId.toasts, drawResources);
}

export function getMissingResourceInfo([items]: TimedResources): string | undefined {
  const missing = items
    .filter(([name, count]) => count > resources[name])
    .map(([name, count]) => `${count - resources[name]} ${name}`);

  if (missing.length > 0) {
    return `missing: ${missing.join(', ')}`;
  }
}

export function deduceResources([items]: TimedResources): void {
  for (const [name, count] of items) {
    assert(count <= resources[name], `Not enough ${name}`);
    resources[name] -= count;
  }
}

function drawResources(context: CanvasRenderingContext2D): void {
  useResetTransform(() => {
    context.fillStyle = 'white';

    context.fillRect(0, 0, displayWidth, 48);
    drawText(context, getResourcesText(), [0, 0, 0], 24, 24, 0, 0.5);
  });
}

function getResourcesText(): string {
  return Object.entries(resources)
    .map(([key, value]) => `${key}: ${String(value).padStart(4, ' ')}`)
    .join('   ');
}

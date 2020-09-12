import { eventQueuePush } from 'eventQueue';
import { gostekHasFree, GostekState, gostekUseNClosest } from 'gostek';
import { Point } from 'hex';
import { pathFind } from 'pathFinder';
import { ResourceCount, resourcesReserveMax } from 'resources';

type Need = [destination: Point, resourceCount: ResourceCount];

const needs = new Set<Need>();

export function needReset(): void {
  needs.clear();
  needs.add([new Point(2, -2), [0, 2, 1, 0, 0]]);
}

export function needUpdate(): void {
  if (!gostekHasFree()) {
    return;
  }
  for (const [destination, resourceCount] of needs) {
    if (resourceCount.some((singleCount) => singleCount > 0) && gostekHasFree()) {
      pathFind(destination, (hex) => {
        const maxResources = resourcesReserveMax(hex, resourceCount);
        gostekUseNClosest(hex, maxResources.length, (fromHex) => {
          const state: GostekState = [fromHex, 0, [0, 0, 0, 0, 0]];
          console.log('here', maxResources.length);
          eventQueuePush((currentFrame, totalFrames) => {
            state[1] = currentFrame / totalFrames;
          }, 1000);
          return state;
        });
        return !resourceCount.some((singleCount) => singleCount > 0);
      });
    }
  }
}

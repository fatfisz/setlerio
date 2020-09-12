import { buildingsInit, buildingsReset } from 'buildings';
import { displayInit, displayUpdate } from 'display';
import { eventQueueRun } from 'eventQueue';
import { gostekInit, gostekReset } from 'gostek';
import { updateGui, useGui } from 'gui';
import { needReset, needUpdate } from 'need';
import { pathFinderInit } from 'pathFinder';
import { resourcesInit, resourcesReset } from 'resources';
import { terrainInit } from 'terrain';
import { toastInit } from 'toast';

export function engineInit(): void {
  if (process.env.NODE_ENV !== 'production') {
    const style = document.createElement('style');
    style.textContent = `
      canvas {
        outline: 3px solid black;
      }

      .dg.ac {
        z-index: 1 !important;
      }
    `;
    document.head.append(style);
  }

  useGui((gui) => {
    gui.open();
  });

  toastInit();
  resourcesInit();
  terrainInit();
  displayInit();
  buildingsInit();
  gostekInit();
  pathFinderInit();

  buildingsReset();
  gostekReset();
  needReset();
  resourcesReset();
}

export function engineTick(): void {
  eventQueueRun();
  needUpdate();
  displayUpdate();
  updateGui();
}

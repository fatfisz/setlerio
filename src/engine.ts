import { buildingsInit } from 'buildings';
import { displayInit, displayUpdate } from 'display';
import { eventQueueRun } from 'eventQueue';
import { updateGui, useGui } from 'gui';
import { pathFinderInit } from 'pathFinder';
import { resourcesInit } from 'resources';
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
  pathFinderInit();
}

export function engineTick(): void {
  eventQueueRun();
  displayUpdate();
  updateGui();
}

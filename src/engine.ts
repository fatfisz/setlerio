import { buildingsInit } from 'buildings';
import { displayInit, displayUpdate } from 'display';
import { eventQueueRun } from 'eventQueue';
import { updateGui, useGui } from 'gui';
import { resourcesInit } from 'resources';
import { terrainInit } from 'terrain';
import { toastInit } from 'toast';

export function engineInit(): void {
  if (process.env.NODE_ENV !== 'production') {
    const style = document.createElement('style');
    style.textContent = `
      pre {
        background: #fafafa;
        border: 1px solid #ccc;
        border-radius: 4px;
        padding: 16px;
      }

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
}

export function engineTick(): void {
  eventQueueRun();
  displayUpdate();
  updateGui();
}

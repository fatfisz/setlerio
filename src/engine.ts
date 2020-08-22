import { addBuildingButton, buildingsInit } from 'buildings';
import { displayInit, displayDraw } from 'display';
import { eventQueueRun } from 'eventQueue';
import { updateGui } from 'gui';
import { resourcesInit } from 'resources';

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

  resourcesInit();
  displayInit();
  buildingsInit();
  addBuildingButton('lumberjackHut');
  addBuildingButton('tower');
}

export function engineTick(): void {
  eventQueueRun();
  displayDraw();
  updateGui();
}

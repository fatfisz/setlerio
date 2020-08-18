import { addBuildingButton } from 'buildings';
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
    `;
    document.head.append(style);
  }

  resourcesInit();
  addBuildingButton('lumberjackHut');
  addBuildingButton('tower');
}

export function engineTick(): void {
  eventQueueRun();
  updateGui();
}
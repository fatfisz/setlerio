import { addBlinker } from 'blinker';
import { eventQueueRun } from 'eventQueue';
import { globalFrame } from 'frame';
import { updateGui, useGui } from 'gui';

const state = {
  frame: 0,
};

export function engineInit(): void {
  useGui((gui) => {
    gui.open();
    gui.add(state, 'frame');
  });

  addBlinker(1000, 'salmon');
  addBlinker(2000, 'moccasin');
  addBlinker(3000, 'lightgreen');
  addBlinker(4000, 'lightblue');
}

export function engineTick(): void {
  state.frame = globalFrame;
  eventQueueRun();
  updateGui();
}

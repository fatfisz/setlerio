import { updateGui, useGui } from 'gui';

const state = {
  frame: 0,
};

export function initEngine(): void {
  useGui((gui) => {
    gui.open();
    gui.add(state, 'frame');
  });
}

export function tick(frame: number): void {
  state.frame = frame;
  updateGui();
}

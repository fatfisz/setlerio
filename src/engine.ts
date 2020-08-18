import { eventQueueIsEmpty, eventQueuePeek, eventQueuePop, eventQueuePush } from 'eventQueue';
import { frame, getNextFrame } from 'frame';
import { updateGui, useGui } from 'gui';

const state = {
  frame: 0,
};

export function engineInit(): void {
  useGui((gui) => {
    gui.open();
    gui.add(state, 'frame');
  });

  addButton();
}

export function engineTick(): void {
  state.frame = frame;

  while (!eventQueueIsEmpty() && eventQueuePeek().frame <= frame) {
    eventQueuePop().run();
  }

  updateGui();
}

function addButton(): void {
  const button = document.createElement('button');
  button.textContent = 'Hello';
  button.addEventListener('click', () => {
    eventQueuePush({
      frame: getNextFrame(500),
      run: () => {
        document.body.append(document.createElement('br'), 'Hello');
      },
    });
  });
  document.body.append(button);
}

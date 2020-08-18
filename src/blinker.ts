import { eventQueuePush } from 'eventQueue';
import { getNextFrame } from 'frame';

export function addBlinker(duration: number, color: string): void {
  const button = document.createElement('button');
  button.textContent = `Blink for ${duration}`;
  button.addEventListener('click', () => {
    eventQueuePush({
      frame: getNextFrame(),
      lastFrame: getNextFrame(duration),
      run: (currentFrame) => {
        if (currentFrame % 4 > 2) {
          button.style.backgroundColor = '';
        } else {
          button.style.backgroundColor = color;
        }
      },
      cleanup: () => {
        button.style.backgroundColor = '';
      },
    });
  });
  document.body.append(button);
}

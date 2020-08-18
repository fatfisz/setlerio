import { eventQueuePush } from 'eventQueue';
import { getNextFrame } from 'frame';

export function addBlinker(duration: number, color: string): void {
  const button = document.createElement('button');
  button.textContent = `Blink for ${duration}`;
  button.addEventListener('click', () => {
    eventQueuePush({
      frame: getNextFrame(),
      duration,
      run: (currentFrame, totalFrames) => {
        if (currentFrame === totalFrames || currentFrame % 4 > 2) {
          button.style.backgroundColor = '';
        } else {
          button.style.backgroundColor = color;
        }
      },
    });
  });
  document.body.append(button);
}

import { engineInit, engineTick } from 'engine';
import { frameDuration, goToNextFrame } from 'frame';

let lastFrameTime = 0;

document.title = 'setlerio';
engineInit();
runAnimationFrame(0);

function runAnimationFrame(time: number): void {
  requestAnimationFrame(runAnimationFrame);

  if (time >= lastFrameTime + frameDuration) {
    lastFrameTime = time;
    goToNextFrame();
    engineTick();
  }
}

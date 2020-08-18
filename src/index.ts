import { engineInit, engineTick } from 'engine';
import { fps, goToNextFrame } from 'frame';

// Leave a margin of error of 1ms so that frames aren't skipped overzealously
const frameDuration = 1000 / fps - 1;
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

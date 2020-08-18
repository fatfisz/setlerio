import { initEngine, tick } from 'engine';

// Leave a margin of error of 1ms so that frames aren't skipped overzealously
const frameDuration = 1000 / 20 - 1;
let frame = 0;
let lastFrameTime = 0;

document.title = 'setlerio';
initEngine();
draw(0);

function draw(time: number): void {
  requestAnimationFrame(draw);

  if (time >= lastFrameTime + frameDuration) {
    lastFrameTime = time;
    frame += 1;
    tick(frame);
  }
}

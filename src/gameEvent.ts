import { assert } from 'devAssert';
import { globalFrame } from 'frame';
import { noop } from 'noop';

type Run = (currentFrame: number, totalFrames: number) => void;

export interface GameEventOptions {
  frame: number;
  lastFrame?: number;
  run: Run;
  cleanup?: Run;
}

export class GameEvent {
  frame: number;
  lastFrame: number;
  run: Run;
  cleanup: Run;

  constructor({ frame, lastFrame = frame, run, cleanup = noop }: GameEventOptions) {
    assert(frame > globalFrame, "Don't push an event into the past");
    assert(lastFrame >= frame, 'The event has to last at least for one frame');

    this.frame = frame;
    this.lastFrame = lastFrame;
    this.run = run;
    this.cleanup = cleanup;
  }

  duration(): number {
    return this.lastFrame - this.frame + 1;
  }
}

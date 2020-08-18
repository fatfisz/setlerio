import { assert } from 'devAssert';
import { globalFrame } from 'frame';

type Run = (currentFrame: number, totalFrames: number) => void;

export interface GameEventOptions {
  frame: number;
  lastFrame?: number;
  run: Run;
}

export class GameEvent {
  frame: number;
  lastFrame: number;
  run: Run;

  constructor({ frame, lastFrame = frame, run }: GameEventOptions) {
    assert(frame > globalFrame, "Don't push an event into the past");
    assert(lastFrame >= frame, 'The event has to last at least for one frame');

    this.frame = frame;
    this.lastFrame = lastFrame;
    this.run = run;
  }

  duration(): number {
    return this.lastFrame - this.frame;
  }
}

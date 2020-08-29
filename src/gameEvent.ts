import { assert } from 'devAssert';
import { getNumberOfFrames, globalFrame } from 'frame';

export type Run = (currentFrame: number, totalFrames: number) => void;

export interface GameEventOptions {
  when?: number;
  duration?: number;
  run: Run;
}

export class GameEvent {
  frame: number;
  totalFrames: number;
  run: Run;

  constructor({ when = 0, duration = 0, run }: GameEventOptions) {
    assert(when >= 0, "Don't push an event into the past");
    assert(duration >= 0, 'The event has to last at least for one frame');
    this.frame = globalFrame + 1 + getNumberOfFrames(when);
    this.totalFrames = getNumberOfFrames(duration);
    this.run = run;
  }
}

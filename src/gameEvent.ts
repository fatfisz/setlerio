import { assert } from 'devAssert';
import { getNumberOfFrames, globalFrame } from 'frame';

type Run = (currentFrame: number, totalFrames: number) => void;

export interface GameEventOptions {
  frame?: number;
  duration?: number;
  run: Run;
}

export class GameEvent {
  frame: number;
  totalFrames: number;
  run: Run;

  constructor({ frame = globalFrame + 1, duration = 0, run }: GameEventOptions) {
    assert(frame > globalFrame, "Don't push an event into the past");
    assert(duration >= 0, 'The event has to last at least for one frame');
    this.frame = frame;
    this.totalFrames = getNumberOfFrames(duration);
    this.run = run;
  }
}

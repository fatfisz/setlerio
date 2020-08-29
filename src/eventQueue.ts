import { assert } from 'devAssert';
import { getNumberOfFrames, globalFrame } from 'frame';

export type Run = (currentFrame: number, totalFrames: number) => void;

interface GameEventOptions {
  when?: number;
  duration?: number;
  run: Run;
}

class GameEvent {
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

const events: GameEvent[] = [];

export function eventQueuePush(eventOptions: GameEventOptions): void {
  events.push(new GameEvent(eventOptions));
}

export function eventQueueRun(): void {
  const indicesToRemove: number[] = [];
  for (const [index, event] of events.entries()) {
    const currentFrame = globalFrame - event.frame;
    if (currentFrame > event.totalFrames) {
      indicesToRemove.push(index);
    } else if (currentFrame >= 0) {
      event.run(currentFrame, event.totalFrames);
    }
  }
  for (const index of indicesToRemove.reverse()) {
    events.splice(index, 1);
  }
}

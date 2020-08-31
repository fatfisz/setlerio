import { assert } from 'devAssert';
import { getNumberOfFrames, globalFrame } from 'frame';

export type Run = (currentFrame: number, totalFrames: number) => void;

interface GameEventOptions {
  run: Run;
  when?: number;
  duration?: number;
}

class GameEvent {
  frame: number;
  totalFrames: number;
  run: Run;

  constructor({ run, when = 0, duration = 0 }: GameEventOptions) {
    assert(when >= 0, "Don't push an event into the past");
    assert(duration >= 0, 'The event has to last at least for one frame');
    this.run = run;
    this.frame = globalFrame + 1 + getNumberOfFrames(when);
    this.totalFrames = getNumberOfFrames(duration);
  }
}

let lastHandle = 0;

const events = new Map<number, GameEvent>();

export function eventQueuePush(eventOptions: GameEventOptions): number {
  lastHandle += 1;
  events.set(lastHandle, new GameEvent(eventOptions));
  return lastHandle;
}

export function eventQueueRemove(handle: number): void {
  events.delete(handle);
}

export function eventQueueRun(): void {
  for (const [handle, event] of events.entries()) {
    const currentFrame = globalFrame - event.frame;
    if (currentFrame > event.totalFrames) {
      events.delete(handle);
    } else if (currentFrame >= 0) {
      event.run(currentFrame, event.totalFrames);
    }
  }
}

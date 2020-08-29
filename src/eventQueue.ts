import { globalFrame } from 'frame';
import { GameEvent, GameEventOptions } from 'gameEvent';

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

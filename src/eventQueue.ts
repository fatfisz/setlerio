import { globalFrame } from 'frame';
import { GameEvent, GameEventOptions } from 'gameEvent';

const events: GameEvent[] = [];

export function eventQueuePush(eventOptions: GameEventOptions): void {
  events.push(new GameEvent(eventOptions));
}

export function eventQueueRun(): void {
  const indicesToRemove: number[] = [];
  events.forEach((event, index) => {
    const currentFrame = globalFrame - event.frame;
    if (currentFrame > event.totalFrames) {
      indicesToRemove.push(index);
      return;
    }
    if (currentFrame < 0) {
      return;
    }
    event.run(currentFrame, event.totalFrames);
  });
  indicesToRemove.reverse().forEach((index) => {
    events.splice(index, 1);
  });
}

import { globalFrame } from 'frame';
import { GameEvent, GameEventOptions } from 'gameEvent';

const events: GameEvent[] = [];

export function eventQueueIsEmpty(): boolean {
  return events.length === 0;
}

export function eventQueuePush(eventOptions: GameEventOptions): void {
  events.push(new GameEvent(eventOptions));
}

export function eventQueueRun(): void {
  const indicesToRemove: number[] = [];
  events.forEach((event, index) => {
    if (event.lastFrame < globalFrame) {
      indicesToRemove.push(index);
      return;
    }
    if (event.frame > globalFrame) {
      return;
    }
    event.run(globalFrame - event.frame, event.duration());
  });
  indicesToRemove.reverse().forEach((index) => {
    events.splice(index, 1);
  });
}

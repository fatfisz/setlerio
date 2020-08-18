import { assert } from 'devAssert';
import { frame } from 'frame';

interface GameEvent {
  frame: number;
  run: () => void;
}

const events: GameEvent[] = [];

export function eventQueueIsEmpty(): boolean {
  return events.length === 0;
}

export function eventQueuePush(event: GameEvent): void {
  assert(event.frame > frame, "Don't push an event into the past");
  events.push(event);
  events.sort(compareByFrame);
}

export function eventQueuePeek(): GameEvent {
  assert(!eventQueueIsEmpty(), "Don't peek at an empty queue");
  return events[0];
}

export function eventQueuePop(): GameEvent {
  assert(!eventQueueIsEmpty(), "Don't pop from an empty queue");
  return events.shift()!;
}

function compareByFrame(eventA: GameEvent, eventB: GameEvent): number {
  return eventA.frame - eventB.frame;
}

import { displayHeight, displayWidth } from 'config';
import { assertRanOnce } from 'devAssert';
import { useResetTransform } from 'display';
import { drawablePriorityId, drawablePush } from 'drawables';
import { eventQueuePush, Run } from 'eventQueue';
import { drawText } from 'text';

type Toast = [text: string, offset: number, opacity: number];

const toastTupleOffset = 1;
const toastTupleOpacity = 2;

const toastWidth = 448;
const toastHeight = 64;
const padding = 24;
const animationTime = 200;
const visibleTime = 5000;

const toasts = new Set<Toast>();
const toastsToAdd = new Set<Toast>();
let isFadingIn = false;

export function toastInit(): void {
  assertRanOnce('toastInit');

  drawablePush(drawablePriorityId.toasts, drawToasts);
}

export function toastAdd(text: string): void {
  toastAddObject(text, -1, 0);
}

export function toastAddObject(...toast: Toast): void {
  if (isFadingIn) {
    toastsToAdd.add(toast);
    return;
  }

  toasts.add(toast);
  isFadingIn = true;

  eventQueuePush(fadeIn(toast), animationTime);
  eventQueuePush(fadeOut(toast), animationTime, animationTime + visibleTime);
}

function fadeIn(toast: Toast): Run {
  return (currentFrame, totalFrames): void => {
    toast[toastTupleOffset] = currentFrame / totalFrames - 1;
    toast[toastTupleOpacity] = currentFrame / totalFrames;
    if (currentFrame === totalFrames) {
      isFadingIn = false;
      if (toastsToAdd.size > 0) {
        const [firstToast] = toastsToAdd;
        toastsToAdd.delete(firstToast);
        toastAddObject(...firstToast);
      }
    }
  };
}

function fadeOut(toast: Toast): Run {
  return (currentFrame, totalFrames): void => {
    toast[toastTupleOffset] = currentFrame / totalFrames / 3;
    toast[toastTupleOpacity] = 1 - currentFrame / totalFrames;
    if (currentFrame === totalFrames) {
      toasts.delete(toast);
    }
  };
}

function drawToasts(context: CanvasRenderingContext2D): void {
  useResetTransform(() => {
    let totalOffset = 0;

    context.fillStyle = 'white';

    for (const toast of [...toasts].reverse()) {
      const [text, offset, opacity] = toast;
      totalOffset += 1 + offset;
      context.globalAlpha = opacity;

      const top = displayHeight - totalOffset * (padding + toastHeight);

      context.fillRect(displayWidth - padding - toastWidth, top, toastWidth, toastHeight);
      drawText(context, text, [0, 0, 0], displayWidth - toastWidth, top + toastHeight / 2, 0, 0.5);
    }
  });
}

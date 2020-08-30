import { displayHeight, displayWidth } from 'config';
import { assertRanOnce } from 'devAssert';
import { useResetTransform } from 'display';
import { drawablePriority, drawablePush } from 'drawables';
import { eventQueuePush, Run } from 'eventQueue';
import { drawText } from 'text';

interface Toast {
  text: string;
  offset: number;
  opacity: number;
}

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

  drawablePush(drawablePriority.toasts, drawToasts);
}

export function toastAdd(text: string): void {
  toastAddObject({
    text,
    offset: -1,
    opacity: 0,
  });
}

export function toastAddObject(toast: Toast): void {
  if (isFadingIn) {
    toastsToAdd.add(toast);
    return;
  }

  toasts.add(toast);
  isFadingIn = true;

  eventQueuePush({
    run: fadeIn(toast),
    duration: animationTime,
  });
  eventQueuePush({
    run: fadeOut(toast),
    when: animationTime + visibleTime,
    duration: animationTime,
  });
}

function fadeIn(toast: Toast): Run {
  return (currentFrame, totalFrames): void => {
    toast.offset = currentFrame / totalFrames - 1;
    toast.opacity = currentFrame / totalFrames;
    if (currentFrame === totalFrames) {
      isFadingIn = false;
      if (toastsToAdd.size > 0) {
        const [firstToast] = toastsToAdd;
        toastsToAdd.delete(firstToast);
        toastAddObject(firstToast);
      }
    }
  };
}

function fadeOut(toast: Toast): Run {
  return (currentFrame, totalFrames): void => {
    toast.offset = currentFrame / totalFrames / 3;
    toast.opacity = 1 - currentFrame / totalFrames;
    if (currentFrame === totalFrames) {
      toasts.delete(toast);
    }
  };
}

function drawToasts(context: CanvasRenderingContext2D): void {
  useResetTransform(() => {
    let offset = 0;

    context.fillStyle = 'white';

    for (const toast of [...toasts].reverse()) {
      offset += 1 + toast.offset;
      context.globalAlpha = toast.opacity;

      const top = displayHeight - offset * (padding + toastHeight);

      context.fillRect(displayWidth - padding - toastWidth, top, toastWidth, toastHeight);
      drawText(
        context,
        toast.text,
        [0, 0, 0],
        displayWidth - toastWidth,
        top + toastHeight / 2,
        0,
        0.5,
      );
    }
  });
}

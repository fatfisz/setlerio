import { displayHeight, displayWidth } from 'config';
import { useResetTransform } from 'display';
import { drawablePriorityToasts, drawablePush } from 'drawables';
import { eventQueuePush, Run } from 'eventQueue';
import { drawText } from 'text';

interface Toast {
  text: string;
  offset: number;
  opacity: number;
}

const toastWidth = 256;
const toastHeight = 64;
const padding = 24;
const animationTime = 100;
const visibleTime = 7500;

const toasts = new Set<Toast>();
let initialized = false;

export function toastInit(): void {
  if (!initialized) {
    drawablePush(drawablePriorityToasts, drawToasts);
    initialized = true;
  }
}

export function toastAdd(text: string): void {
  const toast = {
    text,
    offset: 0,
    opacity: 0,
  };

  toasts.add(toast);

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
    toast.offset = padding * (currentFrame / totalFrames - 1);
    toast.opacity = currentFrame / totalFrames;
  };
}

function fadeOut(toast: Toast): Run {
  return (currentFrame, totalFrames): void => {
    toast.offset = (toastHeight + padding) * (currentFrame / totalFrames);
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

    for (const toast of toasts) {
      offset += padding + toastHeight - toast.offset;
      context.globalAlpha = toast.opacity;

      const top = displayHeight - offset;

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

import { defaultPixelSize } from 'config';
import { drawablePriorityId, drawablePush, drawableRemove } from 'drawables';
import { Point } from 'hex';
import { drawText } from 'text';

interface ProgressState {
  progress: number;
}

type UpdateProgress = (progress: number) => void;

type DestroyProgress = () => void;

const barWidth = 120;
const barHeight = 24;

export function progressAdd(hex: Point): [UpdateProgress, DestroyProgress] {
  const state = {
    progress: 0,
  };
  const handle = drawablePush(drawablePriorityId.border, drawProgressBar(hex, state), hex);
  return [
    (progress: number): void => {
      state.progress = progress;
    },
    (): void => {
      drawableRemove(handle);
    },
  ];
}

function drawProgressBar(hex: Point, progressState: ProgressState) {
  return (context: CanvasRenderingContext2D): void => {
    const relativeMid = hex.toCanvas();
    const text = `${(progressState.progress * 100).toFixed(0)}%`;

    context.beginPath();
    context.moveTo(...relativeMid.add({ x: -barWidth / 2, y: -barHeight / 2 }).toArray());
    context.lineTo(...relativeMid.add({ x: barWidth / 2, y: -barHeight / 2 }).toArray());
    context.lineTo(...relativeMid.add({ x: barWidth / 2, y: barHeight / 2 }).toArray());
    context.lineTo(...relativeMid.add({ x: -barWidth / 2, y: barHeight / 2 }).toArray());
    context.closePath();

    context.fillStyle = '#fff3';
    context.lineWidth = defaultPixelSize;
    context.lineJoin = 'miter';
    context.strokeStyle = 'white';

    context.fill();
    context.stroke();

    context.fillStyle = 'white';

    context.fillRect(
      ...relativeMid.add({ x: -barWidth / 2, y: -barHeight / 2 }).toArray(),
      barWidth * progressState.progress,
      barHeight,
    );

    drawText(context, text, [0, 0, 0], ...relativeMid.toArray(), 0.5, 0.5);
  };
}

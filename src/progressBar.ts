import { defaultPixelSize } from 'config';
import { drawPathFromPoints } from 'context';
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
const barVertices = [
  new Point(-barWidth / 2, -barHeight / 2),
  new Point(barWidth / 2, -barHeight / 2),
  new Point(barWidth / 2, barHeight / 2),
  new Point(-barWidth / 2, barHeight / 2),
];

export function progressAdd(
  hex: Point,
): [updateProgress: UpdateProgress, destroyProgres: DestroyProgress] {
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

    drawPathFromPoints(
      context,
      barVertices.map((vertex) => vertex.add(relativeMid)),
    );
    context.fillStyle = '#fff3';
    context.lineWidth = defaultPixelSize;
    context.lineJoin = 'miter';
    context.strokeStyle = 'white';
    context.fill();
    context.stroke();

    context.fillStyle = 'white';
    context.fillRect(
      ...relativeMid.add(barVertices[0]).toArray(),
      barWidth * progressState.progress,
      barHeight,
    );

    drawText(context, text, [0, 0, 0], ...relativeMid.toArray(), 0.5, 0.5);
  };
}

import { getCanvas } from 'getCanvas';
import { getTextImage } from 'text';

const displayWidth = 1000;
const displayHeight = 1000;
const hexWidth = 160;
const hexHeight = hexWidth * 0.7;
const hexBaseWidth = hexWidth * 0.5;

const [canvas, context] = getCanvas(displayWidth, displayHeight);

const points = [
  [0, -1],
  [1, -1],
  [-1, 0],
  [0, 0],
  [1, 0],
  [-1, 1],
  [0, 1],
] as const;

export function displayInit(): void {
  document.body.append(canvas);
}

export function displayDraw(): void {
  clearCanvas();
  context.lineJoin = 'round';
  context.lineWidth = 3;
  context.strokeStyle = 'black';
  for (const point of points) {
    const [x, y] = point;
    drawHex(x, y);
  }
}

function clearCanvas(): void {
  context.clearRect(0, 0, displayWidth, displayHeight);
}

function drawHex(x: number, y: number): void {
  const midX = Math.round(displayWidth + (y + x) * (hexBaseWidth + hexWidth)) / 2;
  const midY = Math.round(displayHeight + (y - x) * hexHeight) / 2;
  const text = getTextImage(`[${x}, ${y}]`, [0, 0, 0]);
  context.drawImage(
    text,
    Math.round(midX - text.width * 1.5),
    Math.round(midY - text.height * 1.5),
    text.width * 3,
    text.height * 3,
  );
  context.beginPath();
  context.moveTo(midX - hexBaseWidth / 2, midY - hexHeight / 2);
  context.lineTo(midX + hexBaseWidth / 2, midY - hexHeight / 2);
  context.lineTo(midX + hexWidth / 2, midY);
  context.lineTo(midX + hexBaseWidth / 2, midY + hexHeight / 2);
  context.lineTo(midX - hexBaseWidth / 2, midY + hexHeight / 2);
  context.lineTo(midX - hexWidth / 2, midY);
  context.closePath();
  context.stroke();
}

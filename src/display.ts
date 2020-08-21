import { getCanvas } from 'getCanvas';
import { useGui } from 'gui';
import { hexBaseWidth, hexHeight, hexWidth } from 'hex';
import { Point } from 'point';
import { getTextImage } from 'text';

const displayWidth = 1000;
const displayHeight = 1000;

const [canvas, context] = getCanvas(displayWidth, displayHeight);

const hexVertices = [
  new Point<false>(-hexBaseWidth / 2, -hexHeight / 2),
  new Point<false>(hexBaseWidth / 2, -hexHeight / 2),
  new Point<false>(hexWidth / 2, 0),
  new Point<false>(hexBaseWidth / 2, hexHeight / 2),
  new Point<false>(-hexBaseWidth / 2, hexHeight / 2),
  new Point<false>(-hexWidth / 2, 0),
];

const neighborOffsets = [
  new Point<true>(0, -1),
  new Point<true>(1, -1),
  new Point<true>(-1, 0),
  new Point<true>(0, 0),
  new Point<true>(1, 0),
  new Point<true>(-1, 1),
  new Point<true>(0, 1),
];

const hexes = [...neighborOffsets];

const camera = new Point<false>(displayWidth / 2, displayHeight / 2);
let mouse = new Point<false>(0, 0);
let hoveredHex = new Point<true>(0, 0);
let hover = false;

export function displayInit(): void {
  useGui((gui) => {
    const displayState = {
      get cameraX(): number {
        return camera.x;
      },
      get cameraY(): number {
        return camera.y;
      },
      get mouseX(): number {
        return mouse.x;
      },
      get mouseY(): number {
        return mouse.y;
      },
      get hover(): boolean {
        return hover;
      },
      get hexX(): number {
        return hoveredHex.x;
      },
      get hexY(): number {
        return hoveredHex.y;
      },
    };

    const display = gui.addFolder('display');
    display.open();
    display.add(displayState, 'cameraX');
    display.add(displayState, 'cameraY');
    display.add(displayState, 'mouseX');
    display.add(displayState, 'mouseY');
    display.add(displayState, 'hover');
    display.add(displayState, 'hexX');
    display.add(displayState, 'hexY');
  });
  document.body.append(canvas);
  mouseInit();
}

function mouseInit(): void {
  canvas.addEventListener('mousemove', (event) => {
    const { left, top, width, height } = canvas.getBoundingClientRect();
    mouse = new Point(
      (event.clientX - left) * (displayWidth / width),
      (event.clientY - top) * (displayHeight / height),
    );
    hover = true;
  });
  canvas.addEventListener('mouseout', () => {
    hover = false;
  });
}

export function displayDraw(): void {
  clearCanvas();
  updateHex();
  context.lineJoin = 'round';
  context.lineWidth = 3;
  context.strokeStyle = 'black';
  context.fillStyle = 'hotpink';
  for (const hex of hexes) {
    drawHex(hex);
  }
}

function clearCanvas(): void {
  context.clearRect(0, 0, displayWidth, displayHeight);
}

function drawHex(hex: Point<true>): void {
  const relativeMid = hex.toCanvas().add(camera);

  context.beginPath();
  const [firstHex, ...restHexes] = hexVertices;
  context.moveTo(...relativeMid.add(firstHex).round().toArray());
  for (const restHex of restHexes) {
    context.lineTo(...relativeMid.add(restHex).round().toArray());
  }
  context.closePath();
  if (hover && hex.equal(hoveredHex)) {
    context.fill();
  }
  context.stroke();

  const text = getTextImage(`[${hex.x}, ${hex.y}]`, [0, 0, 0]);
  context.drawImage(
    text,
    ...relativeMid
      .addCoords(-text.width * 1.5, -text.height * 1.5)
      .round()
      .toArray(),
    text.width * 3,
    text.height * 3,
  );
}

function updateHex(): void {
  const absoluteMouse = mouse.sub(camera);
  const absoluteProbableMid = absoluteMouse.toHex().round().toCanvas();
  neighborOffsets.forEach((neighborHex) => {
    const absoluteNeighbor = absoluteProbableMid.add(neighborHex.toCanvas());
    if (isInHex(absoluteMouse.sub(absoluteNeighbor))) {
      hoveredHex = absoluteNeighbor.toHex().round();
    }
  });
}

function isInHex({ x, y }: Point<false>): boolean {
  const absX = Math.abs(x);
  const absY = Math.abs(y);
  if (absY > hexHeight / 2 || absX > hexWidth / 2) {
    return false;
  }
  if (absX <= hexBaseWidth / 2) {
    return true;
  }
  return (hexWidth / 2 - absX) / (hexWidth - hexBaseWidth) >= absY / hexHeight;
}

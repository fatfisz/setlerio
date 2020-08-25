import { getDrawables } from 'drawables';
import { getCanvas } from 'getCanvas';
import { useGui } from 'gui';
import { isInHex, neighborHexes, Point } from 'hex';

const displayWidth = 1000;
const displayHeight = 1000;

const [canvas, context] = getCanvas(displayWidth, displayHeight);

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
  for (const drawable of getDrawables()) {
    drawable(context, camera, mouse, hoveredHex, hover);
  }
}

function clearCanvas(): void {
  context.clearRect(0, 0, displayWidth, displayHeight);
}

function updateHex(): void {
  const absoluteMouse = mouse.sub(camera);
  const absoluteProbableMid = absoluteMouse.toHex().round().toCanvas();
  for (const neighborHex of neighborHexes) {
    const absoluteNeighbor = absoluteProbableMid.add(neighborHex.toCanvas());
    if (isInHex(absoluteMouse.sub(absoluteNeighbor))) {
      hoveredHex = absoluteNeighbor.toHex();
    }
  }
}

import { getDrawables } from 'drawables';
import { getCanvas } from 'getCanvas';
import { useGui } from 'gui';
import { isInHex, neighborHexes, Point } from 'hex';

const displayWidth = 1000;
const displayHeight = 1000;

const [canvas, context] = getCanvas(displayWidth, displayHeight);

const camera = new Point<false>(displayWidth / 2, displayHeight / 2);
let mouse: Point<false> | undefined = undefined;
let hoveredHex: Point<true> | undefined = undefined;

export function displayInit(): void {
  useGui((gui) => {
    const displayState = {
      get cameraX(): number {
        return camera.x;
      },
      get cameraY(): number {
        return camera.y;
      },
      get mouseX(): number | string {
        return mouse?.x ?? '';
      },
      get mouseY(): number | string {
        return mouse?.y ?? '';
      },
      get hexX(): number | string {
        return hoveredHex?.x ?? '';
      },
      get hexY(): number | string {
        return hoveredHex?.y ?? '';
      },
    };

    const display = gui.addFolder('display');
    display.open();
    display.add(displayState, 'cameraX');
    display.add(displayState, 'cameraY');
    display.add(displayState, 'mouseX');
    display.add(displayState, 'mouseY');
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
  });
  canvas.addEventListener('mouseout', () => {
    mouse = undefined;
  });
}

export function displayUpdate(): void {
  clearCanvas();
  updateHex();
  for (const drawable of getDrawables()) {
    drawable(context, camera, mouse, hoveredHex);
  }
}

function clearCanvas(): void {
  context.clearRect(0, 0, displayWidth, displayHeight);
}

function updateHex(): void {
  if (mouse) {
    const absoluteMouse = mouse.sub(camera);
    const absoluteProbableMid = absoluteMouse.toHex().round().toCanvas();
    for (const neighborHex of neighborHexes) {
      const absoluteNeighbor = absoluteProbableMid.add(neighborHex.toCanvas());
      if (isInHex(absoluteMouse.sub(absoluteNeighbor))) {
        hoveredHex = absoluteNeighbor.toHex();
      }
    }
  } else {
    hoveredHex = undefined;
  }
}

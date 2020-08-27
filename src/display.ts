import { assert } from 'devAssert';
import { getDrawables } from 'drawables';
import { getCanvas } from 'getCanvas';
import { useGui } from 'gui';
import { hexHeight, hexWidth, isInHex, neighborHexes, Point } from 'hex';

const displayWidth = 1000;
const displayHeight = 1000;

const [canvas, context] = getCanvas(displayWidth, displayHeight);
canvas.style.background = '#D6EAF8';

let camera = new Point<false>(0, 0);
let zoom = 1;

let mouseRelative: Point<false> | undefined;
let hoveredCanvas: Point<false> | undefined;
let hoveredHex: Point<true> | undefined;
let mouseDownRelative: Point<false> | undefined;
let mouseDownCanvas: Point<false> | undefined;
let mouseDownHex: Point<true> | undefined;
let dragging: boolean;

const dragThreshold = 5;
const maxZoom = 1;
const minZoom = 0.5;
const zoomStep = (maxZoom - minZoom) / 8;

const midCanvas: Point<false> = new Point(displayWidth / 2, displayHeight / 2);

export function displayInit(): void {
  useGui((gui) => {
    const displayState = {
      get cameraX(): number {
        return camera.x;
      },
      get cameraY(): number {
        return camera.y;
      },
      get zoom(): number {
        return zoom;
      },
      get canvasX(): number | string {
        return hoveredCanvas?.x ?? '';
      },
      get canvasY(): number | string {
        return hoveredCanvas?.y ?? '';
      },
      get hexX(): number | string {
        return hoveredHex?.x ?? '';
      },
      get hexY(): number | string {
        return hoveredHex?.y ?? '';
      },
      reset(): void {
        camera = new Point(0, 0);
        zoom = 1;
      },
    };

    const display = gui.addFolder('display');
    display.add(displayState, 'cameraX');
    display.add(displayState, 'cameraY');
    display.add(displayState, 'zoom');
    display.add(displayState, 'canvasX');
    display.add(displayState, 'canvasY');
    display.add(displayState, 'hexX');
    display.add(displayState, 'hexY');
    display.add(displayState, 'reset');
  });
  document.body.append(canvas);
  mouseInit();
}

function mouseInit(): void {
  canvas.addEventListener('mousemove', (event) => {
    mouseRelative = normalizeClientPosition(event);
    calculateDerivatives();
  });

  document.addEventListener('mousemove', (event) => {
    if (mouseDownCanvas) {
      mouseRelative = normalizeClientPosition(event);
      assert(
        mouseDownRelative,
        'mouseDownRelative should be defined if mouseDownCanvas is defined',
      );
      if (!dragging && mouseDownRelative.distance(mouseRelative) > dragThreshold) {
        dragging = true;
      }
      if (dragging) {
        camera = cameraFromCanvas(mouseDownCanvas);
      }
      calculateDerivatives();
    }
  });

  canvas.addEventListener('contextmenu', (event) => {
    event.preventDefault();
  });

  canvas.addEventListener('wheel', ({ deltaY }) => {
    if (!hoveredCanvas) {
      // There's no relative point for the zoom
      return;
    }
    zoom = Math.max(minZoom, Math.min(maxZoom, zoom - Math.sign(deltaY) * zoomStep));
    camera = cameraFromCanvas(hoveredCanvas);
  });

  canvas.addEventListener('mouseout', () => {
    if (!dragging) {
      mouseRelative = undefined;
      hoveredCanvas = undefined;
      hoveredHex = undefined;
    }
  });

  canvas.addEventListener('mousedown', (event) => {
    event.preventDefault();
    mouseDownRelative = mouseRelative;
    mouseDownCanvas = hoveredCanvas;
    mouseDownHex = hoveredHex;
  });

  canvas.addEventListener('mouseup', () => {
    if (!dragging && mouseDownHex && hoveredHex && mouseDownHex.equal(hoveredHex)) {
      console.log('clicked!');
    }
  });

  document.addEventListener('mouseup', () => {
    if (
      mouseRelative &&
      (mouseRelative.x < 0 ||
        mouseRelative.y < 0 ||
        mouseRelative.x > displayWidth ||
        mouseRelative.y > displayHeight)
    ) {
      mouseRelative = undefined;
      hoveredCanvas = undefined;
      hoveredHex = undefined;
    }

    mouseDownRelative = undefined;
    mouseDownCanvas = undefined;
    mouseDownHex = undefined;
    dragging = false;
  });

  document.addEventListener('visibilitychange', () => {
    mouseRelative = undefined;
    hoveredCanvas = undefined;
    hoveredHex = undefined;
    mouseDownRelative = undefined;
    mouseDownCanvas = undefined;
    mouseDownHex = undefined;
    dragging = false;
  });
}

function normalizeClientPosition({
  clientX,
  clientY,
}: {
  clientX: number;
  clientY: number;
}): Point<false> {
  const { left, top, width, height } = canvas.getBoundingClientRect();
  return new Point(
    (clientX - left) * (displayWidth / width),
    (clientY - top) * (displayHeight / height),
  );
}

function calculateDerivatives(): void {
  assert(mouseRelative, 'mouseRelative should be defined when calculating the derivatives');

  hoveredCanvas = mouseRelative
    .sub(midCanvas)
    .mul(1 / zoom)
    .add(camera);

  const absoluteProbableMid = hoveredCanvas.toHex().round().toCanvas();
  for (const neighborHex of neighborHexes) {
    const absoluteNeighbor = absoluteProbableMid.add(neighborHex.toCanvas());
    if (isInHex(hoveredCanvas.sub(absoluteNeighbor))) {
      hoveredHex = absoluteNeighbor.toHex();
    }
  }
}

function cameraFromCanvas(canvasPosition: Point<false>): Point<false> {
  assert(mouseRelative, 'mouseRelative should be defined when calculating camera from canvas');

  return mouseRelative
    .sub(midCanvas)
    .mul(1 / zoom)
    .sub(canvasPosition)
    .mul(-1);
}

export function displayUpdate(): void {
  clearCanvas();

  const midHex = camera.toHex();
  for (const [draw, hex] of getDrawables()) {
    if (!hex || isHexWithinRange(hex, midHex)) {
      draw(context, hoveredHex);
    }
  }
}

function clearCanvas(): void {
  context.resetTransform();
  context.clearRect(0, 0, displayWidth, displayHeight);
  context.translate(displayWidth / 2, displayHeight / 2);
  context.scale(zoom, zoom);
  context.translate(-camera.x, -camera.y);
}

function isHexWithinRange(hex1: Point<true>, hex2: Point<true>): boolean {
  const { x, y } = hex1.sub(hex2).toCanvas();
  return (
    Math.abs(x) <= (displayWidth + hexWidth) / (2 * minZoom) &&
    Math.abs(y) <= (displayHeight + hexHeight) / (2 * minZoom)
  );
}

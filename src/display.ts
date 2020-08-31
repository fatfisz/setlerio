import { getBuildingOptions } from 'buildings';
import {
  displayHeight,
  displayWidth,
  dragThreshold,
  hexHeight,
  hexWidth,
  maxZoom,
  minZoom,
  zoomStep,
} from 'config';
import { assert, assertRanOnce } from 'devAssert';
import { drawableMaxPriority, getDrawables } from 'drawables';
import { getCanvas } from 'getCanvas';
import { useGui } from 'gui';
import { isInHex, neighborHexes, Point } from 'hex';
import { menuClose, menuIsOpen, menuOpen, menuTryClickOption } from 'menu';

interface Mouse {
  relative: Point;
  canvas: Point;
  hex: Point;
}

const [canvas, context] = getCanvas(displayWidth, displayHeight, true);
canvas.style.background = '#D6EAF8';

let camera = new Point(0, 0);
let zoom = 1;

let mouse: Mouse | undefined;
let mouseDown: Mouse | undefined;
let menuHex: Point | undefined;
let dragging = false;
let preventMenuOpen = false;

const midCanvas = new Point(displayWidth / 2, displayHeight / 2);

export function displayInit(): void {
  assertRanOnce('displayInit');

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
        return mouse?.canvas.x ?? '';
      },
      get canvasY(): number | string {
        return mouse?.canvas.y ?? '';
      },
      get hexX(): number | string {
        return mouse?.hex.x ?? '';
      },
      get hexY(): number | string {
        return mouse?.hex.y ?? '';
      },
      reset(): void {
        camera = new Point(0, 0);
        zoom = 1;
      },
    };
    const folder = gui.addFolder('display');
    folder.add(displayState, 'cameraX');
    folder.add(displayState, 'cameraY');
    folder.add(displayState, 'zoom');
    folder.add(displayState, 'canvasX');
    folder.add(displayState, 'canvasY');
    folder.add(displayState, 'hexX');
    folder.add(displayState, 'hexY');
    folder.add(displayState, 'reset');
  });
  document.body.append(canvas);
  mouseInit();
}

function mouseInit(): void {
  canvas.addEventListener('mousemove', (event) => {
    mouse = getMouse(fromEvent(event));
  });

  document.addEventListener('mousemove', (event) => {
    if (mouseDown) {
      mouse = getMouse(fromEvent(event));
      if (!dragging && mouseDown.relative.distance(mouse.relative) > dragThreshold) {
        dragging = true;
      }
      if (dragging) {
        camera = cameraFromCanvas(mouse.relative, mouseDown.canvas);
        mouse = getMouse(fromEvent(event));
      }
    }
  });

  canvas.addEventListener('contextmenu', (event) => {
    event.preventDefault();
  });

  canvas.addEventListener('wheel', ({ deltaY }) => {
    if (menuHex) {
      menuClose();
      menuHex = undefined;
    }
    if (mouse) {
      zoom = Math.max(minZoom, Math.min(maxZoom, zoom - Math.sign(deltaY) * zoomStep));
      camera = cameraFromCanvas(mouse.relative, mouse.canvas);
    }
  });

  canvas.addEventListener('mouseout', () => {
    if (!dragging) {
      mouse = undefined;
    }
  });

  canvas.addEventListener('mousedown', (event) => {
    event.preventDefault();
    mouse = getMouse(fromEvent(event));
    if (menuHex) {
      if (menuTryClickOption(mouse.relative)) {
        preventMenuOpen = true;
        if (!menuIsOpen()) {
          menuHex = undefined;
        }
        return;
      }
      if (menuHex.equal(mouse.hex)) {
        preventMenuOpen = true;
      }
      menuHex = undefined;
    }
    mouseDown = mouse;
  });

  canvas.addEventListener('mouseup', (event) => {
    mouse = getMouse(fromEvent(event));
    if (!dragging && !preventMenuOpen && mouseDown && mouseDown.hex.equal(mouse.hex)) {
      const options = getBuildingOptions(mouseDown.hex);
      if (options) {
        menuHex = mouseDown.hex;
        menuOpen(options, mouseDown.relative);
      }
    }
  });

  document.addEventListener('mouseup', () => {
    if (
      mouse &&
      (mouse.relative.x < 0 ||
        mouse.relative.y < 0 ||
        mouse.relative.x > displayWidth ||
        mouse.relative.y > displayHeight)
    ) {
      mouse = undefined;
    }
    mouseDown = undefined;
    dragging = false;
    preventMenuOpen = false;
  });

  document.addEventListener('visibilitychange', () => {
    mouse = undefined;
    mouseDown = undefined;
    dragging = false;
    preventMenuOpen = false;
  });
}

function fromEvent({ clientX, clientY }: { clientX: number; clientY: number }): Point {
  const { left, top, width, height } = canvas.getBoundingClientRect();
  return new Point(
    (clientX - left) * (displayWidth / width),
    (clientY - top) * (displayHeight / height),
  );
}

function getMouse(relative: Point): Mouse {
  const canvas = relative
    .sub(midCanvas)
    .mul(1 / zoom)
    .add(camera);

  const mouse: Mouse = {
    relative,
    canvas,
    hex: new Point(0, 0),
  };

  const absoluteProbableMid = canvas.toHex().round().toCanvas();
  for (const neighborHex of neighborHexes) {
    const absoluteNeighbor = absoluteProbableMid.add(neighborHex.toCanvas());
    if (isInHex(canvas.sub(absoluteNeighbor))) {
      mouse.hex = absoluteNeighbor.toHex();
    }
  }

  return mouse;
}

function cameraFromCanvas(mouseRelative: Point, canvasPosition: Point): Point {
  return mouseRelative
    .sub(midCanvas)
    .mul(1 / zoom)
    .sub(canvasPosition)
    .mul(-1);
}

export function displayUpdate(): void {
  clearCanvas();

  const drawGroupedByPriority: ((context: CanvasRenderingContext2D) => void)[][] = [
    [],
    [],
    [],
    [],
    [],
  ];
  assert(
    drawGroupedByPriority.length === drawableMaxPriority,
    `The number of groups should be ${drawableMaxPriority} and not ${drawGroupedByPriority.length}`,
  );
  const midHex = camera.toHex();
  for (const [priority, draw, hex] of getDrawables()) {
    if (!hex || isHexWithinRange(hex, midHex)) {
      drawGroupedByPriority[priority].push(draw);
    }
  }
  for (const drawGroup of drawGroupedByPriority) {
    for (const draw of drawGroup) {
      draw(context);
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

function isHexWithinRange(hex1: Point, hex2: Point): boolean {
  const { x, y } = hex1.sub(hex2).toCanvas();
  return (
    Math.abs(x) <= (displayWidth + hexWidth) / (2 * minZoom) &&
    Math.abs(y) <= (displayHeight + hexHeight) / (2 * minZoom)
  );
}

export function getHighlightedHex(): Point | undefined {
  return menuHex ?? mouse?.hex;
}

export function useResetTransform(draw: () => void): void {
  context.save();
  context.resetTransform();
  draw();
  context.restore();
}

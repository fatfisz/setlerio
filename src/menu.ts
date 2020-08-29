import { displayHeight, displayWidth } from 'config';
import { useResetTransform } from 'display';
import { drawableNoopHandle, drawablePush, drawableRemove } from 'drawables';
import { Point } from 'hex';
import { drawText } from 'text';

export type MenuOption = [text: string, actionOrOptions: (() => void) | MenuOption[]];

const optionWidth = 192;
const optionHeight = 48;
const padding = 16;
const maxOptions = 5;
const maxOptionsHeightWithPadding = padding * 2 + maxOptions * optionHeight;
let isOpen = false;
let menuBoundingRect = {
  left: 0,
  top: 0,
  height: 0,
};
let menuHandle = drawableNoopHandle;
let lastOptions: MenuOption[] = [];
let lastMouseRelative = new Point(0, 0);

export function menuIsOpen(): boolean {
  return isOpen;
}

export function menuClose(): void {
  isOpen = false;
  drawableRemove(menuHandle);
}

export function menuOpen(options: MenuOption[], mouseRelative = lastMouseRelative): void {
  menuClose();

  isOpen = true;
  menuHandle = drawablePush(drawMenu);

  const widthWithPadding = padding * 2 + optionWidth;
  const height = options.length * optionHeight;
  const heightWithPadding = padding * 2 + height;
  menuBoundingRect = {
    left:
      padding +
      Math.max(
        0,
        Math.min(displayWidth - widthWithPadding, mouseRelative.x - widthWithPadding / 2),
      ),
    top:
      mouseRelative.y +
      padding -
      (mouseRelative.y > displayHeight - maxOptionsHeightWithPadding ? heightWithPadding : 0),
    height,
  };

  lastOptions = options;
  lastMouseRelative = mouseRelative;
}

function drawMenu(context: CanvasRenderingContext2D): void {
  useResetTransform(() => {
    context.fillStyle = 'white';

    context.fillRect(
      menuBoundingRect.left,
      menuBoundingRect.top,
      optionWidth,
      menuBoundingRect.height,
    );

    for (const [index, [text, actionOrOptions]] of lastOptions.entries()) {
      drawText(
        context,
        text,
        [0, 0, 0],
        menuBoundingRect.left + padding,
        menuBoundingRect.top + (index + 0.5) * optionHeight,
        0,
        0.5,
      );
      if (Array.isArray(actionOrOptions)) {
        drawText(
          context,
          '>',
          [0, 0, 0],
          menuBoundingRect.left + optionWidth - padding,
          menuBoundingRect.top + (index + 0.5) * optionHeight,
          1,
          0.5,
        );
      }
    }
  });
}

export function menuTryClickOption(mouseRelative: Point): boolean {
  for (const [index, [, actionOrOptions]] of lastOptions.entries()) {
    if (isInOption(mouseRelative, index)) {
      if (Array.isArray(actionOrOptions)) {
        menuOpen(actionOrOptions);
      } else {
        menuClose();
        actionOrOptions();
      }
      return true;
    }
  }
  menuClose();
  return false;
}

function isInOption({ x, y }: Point, index: number): boolean {
  return (
    x >= menuBoundingRect.left &&
    x < menuBoundingRect.left + optionWidth &&
    y >= menuBoundingRect.top + index * optionHeight &&
    y < menuBoundingRect.top + (index + 1) * optionHeight
  );
}

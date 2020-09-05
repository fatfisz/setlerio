import { ChanneledColor, putColor } from 'colors';
import { defaultPixelSize } from 'config';
import { assert } from 'devAssert';
import { getCanvas } from 'getCanvas';
import { useImageCache } from 'imageCache';

const letters = preval.require<Record<string, number>>('./letters.js');

const letterHeight = 6;
const letterSpacing = 1;
const lineSpacing = 3;

export function drawText(
  context: CanvasRenderingContext2D,
  text: string,
  color: ChanneledColor,
  x: number,
  y: number,
  horizontalMod = 0,
  verticalMod = 0,
  scale = defaultPixelSize,
): void {
  const scaledImage = useImageCache([text, color, scale], () => {
    const textImage = getTextImage(text, color);
    const [canvas, context] = getCanvas(textImage.width * scale, textImage.height * scale);
    context.drawImage(textImage, 0, 0, textImage.width * scale, textImage.height * scale);
    return canvas;
  });
  context.drawImage(
    scaledImage,
    x - scaledImage.width * horizontalMod,
    y - scaledImage.height * verticalMod,
  );
}

function getTextImage(text: string, color: ChanneledColor): HTMLCanvasElement {
  return useImageCache(['text', text, color], () => {
    if (process.env.NODE_ENV !== 'production') {
      for (const letter of text) {
        assert(
          letter === '\n' || letter === ' ' || letters[letter],
          `Letter "${letter}" is missing`,
        );
      }
    }
    const [width, height] = getTextSize(text);
    const [canvas, context] = getCanvas(width, height);
    const imageData = context.createImageData(width, height);
    let y = 0;
    let offset = 0;

    for (const char of text) {
      if (char === '\n') {
        y += letterHeight + lineSpacing;
        offset = 0;
      } else {
        drawLetter(imageData, color, offset, y, char);
        offset += letterSpacing + getLetterWidth(letters[char]);
      }
    }
    context.putImageData(imageData, 0, 0);
    return canvas;
  });
}

function drawLetter(
  imageData: ImageData,
  color: ChanneledColor,
  letterX: number,
  letterY: number,
  char: string,
): void {
  const pixels = letters[char];
  const letterWidth = getLetterWidth(pixels);

  for (let index = 0; index < letterWidth * letterHeight; index += 1) {
    if (pixels & (1 << index)) {
      const x = letterX + (index % letterWidth);
      const y = letterY + Math.floor(index / letterWidth);
      putColor(imageData.data, (y * imageData.width + x) * 4, color);
    }
  }
}

function getTextSize(text: string): [number, number] {
  const lines = text.split('\n');
  return [
    Math.max(...lines.map(getLineWidth)),
    lines.length * (letterHeight + lineSpacing) - lineSpacing,
  ];
}

function getLineWidth(line: string): number {
  return [...line].reduce(
    (width, char) => width + getLetterWidth(letters[char]),
    Math.max(line.length - 1, 0) * letterSpacing,
  );
}

function getLetterWidth(pixels: number): number {
  return (pixels.toString(2).length - 1) / letterHeight;
}

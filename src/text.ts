import { ColorChannels, putColor } from 'colors';
import { assert } from 'devAssert';
import { getCanvas } from 'getCanvas';
import { useImageCache } from 'imageCache';

const letterHeight = 6;
const letterSpacing = 1;
const lineSpacing = 4;

// const letters: Record<string, string> = {
//   a: '.... ..... .. .   ',
//   b: '.. . ... . ...    ',
//   c: '....  .  .  ...   ',
//   d: '.. . .. .. ...    ',
//   e: '....  .. .  ...   ',
//   f: '....  .. .  .     ',
//   g: '....  . .. ....   ',
//   h: '. .. ..... .. .   ',
//   i: '..... ',
//   j: '...  .  .. . ..   ',
//   k: '. .. ... . .. .   ',
//   l: '.  .  .  .  ...   ',
//   m: '.   ... ... . ..   ..   .     ',
//   n: '.  ... .. ...  ..  .    ',
//   o: '.... .. .. ....   ',
//   p: '.... .....  .     ',
//   q: '.... .. .. ....  .',
//   r: '.... ...... . .   ',
//   s: '....  ...  ....   ',
//   t: '... .  .  .  .    ',
//   u: '. .. .. .. ....   ',
//   v: '. .. .. .. . .    ',
//   w: '.   ..   .. . .. . ......     ',
//   x: '. .. . . . .. .   ',
//   y: '. .. .... .  .    ',
//   z: '...  . . .  ...   ',
//   1: ' . ..  .  .  .    ',
//   2: '..   . . .  ...   ',
//   3: '..   . .   ...    ',
//   4: '.  .  . ....  .   ',
//   5: '....  ..   ...    ',
//   6: ' . .  .. . . .    ',
//   7: '...  .  . .  .    ',
//   8: ' . . . . . . .    ',
//   9: ' . . . ..  . .    ',
//   0: ' . . .. .. . .    ',
//   ' ': '            ',
//   '.': '    . ',
//   ',': '    ..',
//   "'": '..    ',
//   '!': '... . ',
//   ':': ' . .  ',
//   '?': '...  . .     .    ',
//   '%': '. .  . . .  . .   ',
//   '[': '... . . ..  ',
//   ']': '.. . . ...  ',
//   '-': '    ..      ',
// };

const letters: Record<string, number> = {
  a: 285679,
  b: 277227,
  c: 291407,
  d: 277355,
  e: 291535,
  f: 266959,
  g: 293711,
  h: 285677,
  i: 95,
  j: 289575,
  k: 285421,
  l: 291401,
  m: 1092147057,
  n: 17407417,
  o: 293743,
  p: 267247,
  q: 424815,
  r: 284655,
  s: 293327,
  t: 271511,
  u: 293741,
  v: 273261,
  w: 1106957873,
  x: 285357,
  y: 271853,
  z: 291495,
  1: 271514,
  2: 291491,
  3: 276643,
  4: 282441,
  5: 276687,
  6: 273098,
  7: 271655,
  8: 273066,
  9: 272810,
  0: 273258,
  ' ': 4096,
  '.': 80,
  ',': 112,
  "'": 67,
  '!': 87,
  ':': 74,
  '?': 270503,
  '%': 283301,
  '[': 4951,
  ']': 5035,
  '-': 4144,
};

export function getTextImage(
  text: string,
  color: ColorChannels,
  maxWidth = Infinity,
): HTMLCanvasElement {
  return useImageCache(['text', text, color, maxWidth], () => {
    if (process.env.NODE_ENV !== 'production') {
      for (const letter of text) {
        assert(
          letter === '\n' || letter === ' ' || letters[letter],
          `Letter "${letter}" is missing`,
        );
      }
    }
    const [fittingText, width, height] = getFittingText(text, maxWidth);
    const [canvas, context] = getCanvas(width, height);
    const imageData = context.createImageData(width, height);
    let y = 0;
    let offset = 0;

    for (const char of fittingText) {
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

function getFittingText(text: string, width: number): [string, number, number] {
  const lines = text.split('\n');
  const fittingLines = [];

  for (const line of lines) {
    const [first, ...rest] = line.split(' ');
    let currentLine = first;
    for (const word of rest) {
      const newCurrentLine = `${currentLine} ${word}`;
      if (getWidth(newCurrentLine) <= width) {
        currentLine = newCurrentLine;
      } else {
        fittingLines.push(currentLine);
        currentLine = word;
      }
    }
    fittingLines.push(currentLine);
  }

  return [
    fittingLines.join('\n'),
    Math.max(...fittingLines.map(getWidth)),
    fittingLines.length * (letterHeight + lineSpacing) - lineSpacing,
  ];
}

function drawLetter(
  imageData: ImageData,
  color: ColorChannels,
  letterX: number,
  letterY: number,
  char: string,
): void {
  const pixels = letters[char];
  const letterWidth = getLetterWidth(pixels);

  for (let index = 0, y = 0; y < letterHeight; y += 1) {
    for (let x = 0; x < letterWidth; x += 1, index += 1) {
      if (pixels & (1 << index)) {
        putColor(imageData.data, ((letterY + y) * imageData.width + letterX + x) * 4, color);
      }
    }
  }
}

function getWidth(text: string): number {
  if (text === '') {
    return 0;
  }
  return [...text].reduce(
    (width, char) => width + getLetterWidth(letters[char]),
    (text.length - 1) * letterSpacing,
  );
}

function getLetterWidth(pixels: number): number {
  return (pixels.toString(2).length - 1) / letterHeight;
}

import { assert } from 'devAssert';

export const hexWidth = 160;
export const hexHeight = hexWidth * 0.75;
export const hexBaseWidth = hexWidth * 0.5;

export class Point {
  readonly x;
  readonly y;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  add({ x, y }: { x: number; y: number }): Point {
    return new Point(this.x + x, this.y + y);
  }

  mul(factor: number): Point {
    return new Point(this.x * factor, this.y * factor);
  }

  sub({ x, y }: { x: number; y: number }): Point {
    return new Point(this.x - x, this.y - y);
  }

  toHex(): Point {
    return new Point(
      this.x / (hexBaseWidth + hexWidth) + this.y / hexHeight,
      this.x / (hexBaseWidth + hexWidth) - this.y / hexHeight,
    );
  }

  toCanvas(): Point {
    return new Point(
      ((this.x + this.y) * (hexBaseWidth + hexWidth)) / 2,
      ((this.x - this.y) * hexHeight) / 2,
    );
  }

  round(): Point {
    return new Point(Math.round(this.x), Math.round(this.y));
  }

  equal({ x, y }: { x: number; y: number }): boolean {
    return this.x === x && this.y === y;
  }

  distance({ x, y }: { x: number; y: number }): number {
    return ((this.x - x) ** 2 + (this.y - y) ** 2) ** 0.5;
  }

  toArray(): [x: number, y: number] {
    return [this.x, this.y];
  }

  toHash(): string {
    return `${this.x},${this.y}`;
  }
}

export function fromHash(hash: string): Point {
  const commaPosition = hash.indexOf(',');
  assert(commaPosition >= 0, 'Hash should contain at least one comma');
  assert(
    () => !isNaN(Number(hash.slice(0, commaPosition))),
    'The first item in the hash is not a number',
  );
  assert(
    () => !isNaN(Number(hash.slice(commaPosition + 1))),
    'The second item in the hash is not a number',
  );
  return new Point(Number(hash.slice(0, commaPosition)), Number(hash.slice(commaPosition + 1)));
}

export const hexVertices = [
  new Point(-hexBaseWidth / 2, -hexHeight / 2),
  new Point(hexBaseWidth / 2, -hexHeight / 2),
  new Point(hexWidth / 2, 0),
  new Point(hexBaseWidth / 2, hexHeight / 2),
  new Point(-hexBaseWidth / 2, hexHeight / 2),
  new Point(-hexWidth / 2, 0),
];

export function hexRange(hex: Point, radius: number, minRadius = 0): Point[] {
  if (radius === 0) {
    return [hex];
  } else {
    return [
      ...hexSequenceIterator(radius).map(
        (element, index, hexSequence) =>
          new Point(
            hex.x + element,
            hex.y + hexSequence[(index + radius * 2) % hexSequence.length],
          ),
      ),
      ...(radius > minRadius ? hexRange(hex, radius - 1, minRadius) : []),
    ];
  }
}

function hexSequenceIterator(radius: number): number[] {
  return [
    ...hexHalfSequenceIterator(radius),
    ...hexHalfSequenceIterator(radius).map((number) => -number),
  ];
}

function hexHalfSequenceIterator(radius: number): number[] {
  if (radius === 0) {
    return [];
  }
  return [
    -radius,
    -radius + 1,
    ...hexHalfSequenceIterator(radius - 1).map((number) => number + 1),
    radius,
  ];
}

export const neighborHexes = hexRange(new Point(0, 0), 1);

export function isInHex({ x, y }: { x: number; y: number }): boolean {
  const absX = Math.abs(x);
  const absY = Math.abs(y);
  return (
    absY <= hexHeight / 2 &&
    (absX <= hexBaseWidth / 2 ||
      hexWidth / 2 - absX >= absY * ((hexWidth - hexBaseWidth) / hexHeight))
  );
}

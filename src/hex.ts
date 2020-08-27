import { assert } from 'devAssert';

export const hexWidth = 160;

export const hexHeight = hexWidth * 0.75;

export const hexBaseWidth = hexWidth * 0.5;

export class Point<Hex extends boolean> {
  readonly x;
  readonly y;
  // An unused flag to trick TS into checking the kind of points
  private readonly hex!: Hex;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  add({ x, y }: Point<Hex>): Point<Hex> {
    return new Point(this.x + x, this.y + y);
  }

  mul(factor: number): Point<Hex> {
    return new Point(this.x * factor, this.y * factor);
  }

  sub({ x, y }: Point<Hex>): Point<Hex> {
    return new Point(this.x - x, this.y - y);
  }

  toHex(): Point<true> {
    return new Point<true>(
      this.x / (hexBaseWidth + hexWidth) + this.y / hexHeight,
      this.x / (hexBaseWidth + hexWidth) - this.y / hexHeight,
    );
  }

  toCanvas(): Point<false> {
    return new Point<false>(
      ((this.x + this.y) * (hexBaseWidth + hexWidth)) / 2,
      ((this.x - this.y) * hexHeight) / 2,
    );
  }

  round(): Point<Hex> {
    return new Point<Hex>(Math.round(this.x), Math.round(this.y));
  }

  equal({ x, y }: Point<Hex>): boolean {
    return this.x === x && this.y === y;
  }

  distance({ x, y }: Point<false>): number {
    return ((this.x - x) ** 2 + (this.y - y) ** 2) ** 0.5;
  }

  toArray(): [number, number] {
    return [this.x, this.y];
  }

  toHash(): string {
    return `${this.x},${this.y}`;
  }
}

export function fromHash(hash: string): Point<true> {
  const commaPosition = hash.indexOf(',');
  assert(commaPosition >= 0, 'Hash should contain at least one comma');
  const x = Number(hash.slice(0, commaPosition));
  const y = Number(hash.slice(commaPosition + 1));
  assert(!isNaN(x), 'The first item in the hash is not a number');
  assert(!isNaN(y), 'The second item in the hash is not a number');
  return new Point(x, y);
}

export const hexVertices = [
  new Point<false>(-hexBaseWidth / 2, -hexHeight / 2),
  new Point<false>(hexBaseWidth / 2, -hexHeight / 2),
  new Point<false>(hexWidth / 2, 0),
  new Point<false>(hexBaseWidth / 2, hexHeight / 2),
  new Point<false>(-hexBaseWidth / 2, hexHeight / 2),
  new Point<false>(-hexWidth / 2, 0),
];

export function hexRange(radius: number, minRadius = 0): Point<true>[] {
  if (radius === 0) {
    return [new Point(0, 0)];
  } else {
    return [
      ...hexSequenceIterator(radius).map(
        (element, index, hexSequence) =>
          new Point<true>(element, hexSequence[(index + radius * 2) % hexSequence.length]),
      ),
      ...(radius > minRadius ? hexRange(radius - 1, minRadius) : []),
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

export const neighborHexes = hexRange(1);

export function isInHex({ x, y }: Point<false>): boolean {
  const absX = Math.abs(x);
  const absY = Math.abs(y);
  return (
    absY <= hexHeight / 2 &&
    (absX <= hexBaseWidth / 2 ||
      hexWidth / 2 - absX >= absY * ((hexWidth - hexBaseWidth) / hexHeight))
  );
}

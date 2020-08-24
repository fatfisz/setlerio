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

  add(point: Point<Hex>): Point<Hex> {
    return new Point(this.x + point.x, this.y + point.y);
  }

  addCoords(x: number, y: number): Point<Hex> {
    return new Point(this.x + x, this.y + y);
  }

  sub(point: Point<Hex>): Point<Hex> {
    return new Point(this.x - point.x, this.y - point.y);
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

  toArray(): [number, number] {
    return [this.x, this.y];
  }

  toHash(): string {
    return String(this.toArray());
  }
}

export function fromHash(hash: string): Point<true> {
  assert(hash.split(',').length === 2, 'The hex hash should consist of two numbers');
  assert(!isNaN(Number(hash.split(',')[0])), 'The first item in the hash is not a number');
  assert(!isNaN(Number(hash.split(',')[1])), 'The second item in the hash is not a number');
  const [x, y] = hash.split(',');
  return new Point(Number(x), Number(y));
}

export const hexVertices = [
  new Point<false>(-hexBaseWidth / 2, -hexHeight / 2),
  new Point<false>(hexBaseWidth / 2, -hexHeight / 2),
  new Point<false>(hexWidth / 2, 0),
  new Point<false>(hexBaseWidth / 2, hexHeight / 2),
  new Point<false>(-hexBaseWidth / 2, hexHeight / 2),
  new Point<false>(-hexWidth / 2, 0),
];

export const neighborOffsets = [
  new Point<true>(0, -1),
  new Point<true>(1, -1),
  new Point<true>(-1, 0),
  new Point<true>(0, 0),
  new Point<true>(1, 0),
  new Point<true>(-1, 1),
  new Point<true>(0, 1),
];

export function isInHex({ x, y }: Point<false>): boolean {
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

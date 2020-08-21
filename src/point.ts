import { hexBaseWidth, hexHeight, hexWidth } from 'hex';

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
}

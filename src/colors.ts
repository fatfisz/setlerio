export type ColorChannels = [number, number, number];

export function putColor(data: Uint8ClampedArray, index: number, [r, g, b]: ColorChannels): void {
  data[index] = r;
  data[index + 1] = g;
  data[index + 2] = b;
  data[index + 3] = 255;
}

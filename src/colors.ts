export const colors = {
  black: '#000',
  white: '#fff',
  meadow: '#0f7',
  forest: '#282',
  mountains: '#853',
  desert: '#ed0',
  sea: '#d6eaf8',
} as const;

type DarkerColor =
  | typeof colors['meadow']
  | typeof colors['forest']
  | typeof colors['mountains']
  | typeof colors['desert'];

export const darker: Record<DarkerColor, string> = {
  [colors.meadow]: preval.require<string, ['darken', typeof colors.meadow]>(
    './colorUtils',
    'darken',
    '#0f7',
  ),
  [colors.forest]: preval.require<string, ['darken', typeof colors.forest]>(
    './colorUtils',
    'darken',
    '#282',
  ),
  [colors.mountains]: preval.require<string, ['darken', typeof colors.mountains]>(
    './colorUtils',
    'darken',
    '#853',
  ),
  [colors.desert]: preval.require<string, ['darken', typeof colors.desert]>(
    './colorUtils',
    'darken',
    '#ed0',
  ),
};

export type ChanneledColor = typeof colors['black'];

const channels: Record<ChanneledColor, [number, number, number]> = {
  [colors.black]: preval.require('./colorUtils', 'mapToChannels', '#000'),
};

export function putColor(data: Uint8ClampedArray, index: number, color: ChanneledColor): void {
  const [r, g, b] = channels[color];
  data[index] = r;
  data[index + 1] = g;
  data[index + 2] = b;
  data[index + 3] = 255;
}

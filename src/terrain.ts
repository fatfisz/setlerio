import { assertRanOnce } from 'devAssert';
import { drawablePriorityTerrain, drawablePush } from 'drawables';
import { fromHash, hexVertices, neighborHexes, Point } from 'hex';

type Terrain = 'meadow' | 'forest' | 'mountains' | 'desert';

const size = 28;
const meadowThreshold = 0.4;
const forestThreshold = 0.85;
const mountainsThreshold = 0.95;
const desertRange = [1, 2] as const;
const mountainRange = [3, 5] as const;

export function terrainInit(): void {
  assertRanOnce('terrainInit');

  const hashToTerrain = new Map<string, Terrain>();
  const specialForbidden = new Set<string>(
    neighborHexes.map((neighborHex) => neighborHex.toHash()),
  );

  function addSpecial(
    terrain: Terrain,
    hex: Point,
    [rangeLower, rangeUpper]: readonly [number, number],
    ignoreForbiddenCheck = false,
    left = rangeLower + Math.random() * (rangeUpper - rangeLower),
  ): void {
    if (!ignoreForbiddenCheck && specialForbidden.has(hex.toHash())) {
      return;
    }

    if (left <= 0) {
      return;
    }

    hashToTerrain.set(hex.toHash(), terrain);

    const nextHex = hex.add(neighborHexes[Math.floor(Math.random() * neighborHexes.length)]);
    addSpecial(terrain, nextHex, [0, 0], ignoreForbiddenCheck, left - 1);

    for (const neighborHex of neighborHexes) {
      specialForbidden.add(hex.add(neighborHex).toHash());
    }
  }

  for (let y = -size; y <= size; y += 1) {
    for (let x = -size; x <= size; x += 1) {
      const distance = (x ** 2 + y ** 2) ** 0.5;
      if (distance < size && distance > size - 1.5) {
        addSpecial('desert', new Point(x, y), desertRange, true);
      }
    }
  }

  for (let y = -size; y <= size; y += 1) {
    for (let x = -size; x <= size; x += 1) {
      if ((x ** 2 + y ** 2) ** 0.5 < size) {
        const hex = new Point(x, y);
        if (hashToTerrain.has(hex.toHash())) {
          continue;
        }

        const random = Math.random();
        if (random < meadowThreshold) {
          hashToTerrain.set(hex.toHash(), 'meadow');
        } else if (random < forestThreshold) {
          hashToTerrain.set(hex.toHash(), 'forest');
        } else if (random < mountainsThreshold) {
          addSpecial('mountains', hex, mountainRange);
        } else {
          addSpecial('desert', hex, desertRange);
        }

        if (!hashToTerrain.has(hex.toHash())) {
          hashToTerrain.set(hex.toHash(), 'meadow');
        }
      }
    }
  }

  hashToTerrain.set(new Point(0, 0).toHash(), 'meadow');

  for (const [hash, terrain] of hashToTerrain.entries()) {
    const hex = fromHash(hash);
    drawablePush(
      drawablePriorityTerrain,
      drawTerrain({
        terrain,
        hex,
      }),
      hex,
    );
  }
}

const terrainColor: Record<Terrain, string> = {
  meadow: 'springgreen',
  forest: 'forestgreen',
  mountains: 'sienna',
  desert: 'gold',
};

function drawTerrain({ terrain, hex }: { terrain: Terrain; hex: Point }) {
  return (context: CanvasRenderingContext2D): void => {
    context.lineJoin = 'round';
    context.lineWidth = 0.5;
    context.strokeStyle = 'black';
    context.fillStyle = terrainColor[terrain];

    const relativeMid = hex.toCanvas();

    context.beginPath();
    const [firstHex, ...restHexes] = hexVertices;
    context.moveTo(...relativeMid.add(firstHex).toArray());
    for (const restHex of restHexes) {
      context.lineTo(...relativeMid.add(restHex).toArray());
    }
    context.closePath();
    context.fill();
    context.stroke();
  };
}

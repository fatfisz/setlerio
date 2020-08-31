import { assertRanOnce } from 'devAssert';
import { drawablePriorityId, drawablePush } from 'drawables';
import { fromHash, hexVertices, neighborHexes, Point } from 'hex';

const terrainId = {
  meadow: 0,
  forest: 1,
  mountains: 2,
  desert: 3,
} as const;

type TerrainId = typeof terrainId[keyof typeof terrainId];

const terrainColor = ['springgreen', 'forestgreen', 'sienna', 'gold'] as const;

const size = 28;
const meadowThreshold = 0.4;
const forestThreshold = 0.85;
const mountainsThreshold = 0.95;
const desertRange = [1, 2] as const;
const mountainRange = [3, 5] as const;

export function terrainInit(): void {
  assertRanOnce('terrainInit');

  const hashToTerrain = new Map<string, TerrainId>();
  const specialForbidden = new Set<string>(
    neighborHexes.map((neighborHex) => neighborHex.toHash()),
  );

  function addSpecial(
    terrain: TerrainId,
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
        addSpecial(terrainId.desert, new Point(x, y), desertRange, true);
      }
    }
  }

  for (let y = -size; y <= size; y += 1) {
    for (let x = -size; x <= size; x += 1) {
      if ((x ** 2 + y ** 2) ** 0.5 < size) {
        const hex = new Point(x, y);
        if (!hashToTerrain.has(hex.toHash())) {
          const random = Math.random();
          if (random < meadowThreshold) {
            hashToTerrain.set(hex.toHash(), terrainId.meadow);
          } else if (random < forestThreshold) {
            hashToTerrain.set(hex.toHash(), terrainId.forest);
          } else if (random < mountainsThreshold) {
            addSpecial(terrainId.mountains, hex, mountainRange);
          } else {
            addSpecial(terrainId.desert, hex, desertRange);
          }
        }
        if (!hashToTerrain.has(hex.toHash())) {
          hashToTerrain.set(hex.toHash(), terrainId.meadow);
        }
      }
    }
  }

  hashToTerrain.set(new Point(0, 0).toHash(), terrainId.meadow);

  for (const [hash, terrain] of hashToTerrain.entries()) {
    const hex = fromHash(hash);
    drawablePush(
      drawablePriorityId.terrain,
      drawTerrain({
        terrain,
        hex,
      }),
      hex,
    );
  }
}

function drawTerrain({ terrain, hex }: { terrain: TerrainId; hex: Point }) {
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

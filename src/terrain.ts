import { drawablePush } from 'drawables';
import { fromHash, hexVertices, neighborOffsets, Point } from 'hex';

type Terrain = 'meadow' | 'forest' | 'mountains' | 'desert' | 'water';

const size = 28;
const waterSize = size + 10;
const meadowThreshold = 0.4;
const forestThreshold = 0.85;
const mountainsThreshold = 0.95;
const desertRange = [1, 2] as const;
const mountainRange = [3, 5] as const;

export function terrainInit(): void {
  const hashToTerrain = new Map<string, Terrain>();
  const specialForbidden = new Set<string>(
    neighborOffsets.map((neighborHex) => neighborHex.toHash()),
  );

  function addSpecial(
    terrain: Terrain,
    hex: Point<true>,
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

    const nextHex = hex.add(neighborOffsets[Math.floor(Math.random() * neighborOffsets.length)]);
    addSpecial(terrain, nextHex, [0, 0], ignoreForbiddenCheck, left - 1);

    for (const neighborHex of neighborOffsets) {
      specialForbidden.add(hex.add(neighborHex).toHash());
    }
  }

  for (let y = -waterSize; y <= waterSize; y += 1) {
    for (let x = -waterSize; x <= waterSize; x += 1) {
      hashToTerrain.set(new Point(x, y).toHash(), 'water');
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
        const hex = new Point<true>(x, y);
        if (hashToTerrain.get(hex.toHash()) !== 'water') {
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

        if (hashToTerrain.get(hex.toHash()) === 'water') {
          hashToTerrain.set(hex.toHash(), 'meadow');
        }
      }
    }
  }

  hashToTerrain.set(new Point(0, 0).toHash(), 'meadow');

  for (const [hash, terrain] of hashToTerrain.entries()) {
    drawablePush(
      drawTerrain({
        terrain,
        hex: fromHash(hash),
      }),
    );
  }
}

const terrainColor: Record<Terrain, string> = {
  meadow: 'springgreen',
  forest: 'forestgreen',
  mountains: 'sienna',
  desert: 'gold',
  water: '#D6EAF8',
};

function drawTerrain({ terrain, hex }: { terrain: Terrain; hex: Point<true> }) {
  return (context: CanvasRenderingContext2D, camera: Point<false>): void => {
    context.lineJoin = 'round';
    context.lineWidth = 0.5;
    context.strokeStyle = 'black';
    context.fillStyle = terrainColor[terrain];

    const relativeMid = hex.toCanvas().add(camera);

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

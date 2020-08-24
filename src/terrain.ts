import { drawablePush } from 'drawables';
import { fromHash, hexVertices, neighborOffsets, Point } from 'hex';

type Terrain = 'meadow' | 'forest' | 'mountains' | 'desert' | 'water';

const size = 28;
const waterSize = size + 10;
const meadowThreshold = 0.4;
const forestThreshold = 0.85;
const mountainsThreshold = 0.95;
const mountainHorizontalFactor = 1 / 2.5;

export function terrainInit(): void {
  const hashToTerrain = new Map<string, Terrain>();
  const specialForbidden = new Set<string>(
    neighborOffsets.map((neighborHex) => neighborHex.toHash()),
  );

  function addMountains(hex: Point<true>, left = 3 + Math.random() * 2): void {
    if (specialForbidden.has(hex.toHash())) {
      return;
    }

    if (left <= 0) {
      return;
    }

    hashToTerrain.set(hex.toHash(), 'mountains');

    const random = Math.random();
    if (random < mountainHorizontalFactor) {
      addMountains(hex.addCoords(1, 0), left - 1);
    } else if (random < 2 * mountainHorizontalFactor) {
      addMountains(hex.addCoords(0, 1), left - 1);
    } else {
      addMountains(hex.addCoords(-1, 1), left - 1);
    }

    for (const neighborHex of neighborOffsets) {
      specialForbidden.add(hex.add(neighborHex).toHash());
    }
  }

  function addDesert(hex: Point<true>): void {
    if (specialForbidden.has(hex.toHash())) {
      return;
    }

    const hexes = [
      hex,
      hex.add(neighborOffsets[Math.floor(Math.random() * neighborOffsets.length)]),
    ];
    for (const hex of hexes) {
      hashToTerrain.set(hex.toHash(), 'desert');
      for (const neighborHex of neighborOffsets) {
        specialForbidden.add(hex.add(neighborHex).toHash());
      }
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
        addDesert(new Point(x, y));
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
          addMountains(hex);
        } else {
          addDesert(hex);
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
    context.moveTo(...relativeMid.add(firstHex).round().toArray());
    for (const restHex of restHexes) {
      context.lineTo(...relativeMid.add(restHex).round().toArray());
    }
    context.closePath();
    context.fill();
    context.stroke();
  };
}

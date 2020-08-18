import { createFilter } from 'rollup-pluginutils';

export default function replace(options = {}) {
  const { include = '**/*.json' } = options;
  const filter = createFilter(include, options.exclude);

  return {
    name: 'strip SpriteStack',

    transform(code, id) {
      if (!filter(id)) {
        return null;
      }

      const parsed = JSON.parse(code);
      if (parsed.fileType !== 'SpriteStackModel' || parsed.formatVersion !== 2) {
        return null;
      }

      deleteUnusedProperties(parsed);
      trimPalette(parsed);
      trimParts(parsed);

      return JSON.stringify(parsed);
    },
  };
}

function deleteUnusedProperties(parsed) {
  delete parsed.formatVersion;
  delete parsed.fileType;
  delete parsed.size;
  delete parsed.bounds;

  for (const part of parsed.parts) {
    delete part.uuid;
    delete part.hidden;
  }
}

function trimPalette(parsed) {
  while (parsed.palette[parsed.palette.length - 1] === 0) {
    parsed.palette.length -= 1;
  }
}

function trimParts(parsed) {
  parsed.parts.forEach(trimPart);
}

const size = 128;

function trimPart(part) {
  const data = unfoldArray(part.data);
  const { bounds } = part;

  const newData = [];
  for (let z = bounds[4]; z <= bounds[5]; z += 1) {
    for (let y = bounds[2]; y <= bounds[3]; y += 1) {
      for (let x = bounds[0]; x <= bounds[1]; x += 1) {
        newData.push(getColorIndex(data, x, y, z));
      }
    }
  }

  part.size = [bounds[1] - bounds[0] + 1, bounds[3] - bounds[2] + 1];
  part.bounds[1] -= part.bounds[0];
  part.bounds[0] = 0;
  part.bounds[3] -= part.bounds[2];
  part.bounds[2] = 0;
  part.bounds[5] -= part.bounds[4];
  part.bounds[4] = 0;

  part.data = newData.map((color) => String.fromCharCode(color + 32)).join('');
}

function unfoldArray(data) {
  const unfoldedData = [];

  for (let index = 0; index < data.length; index += 1) {
    if (data[index] < 0) {
      for (let count = data[index]; count < 0; count += 1) {
        unfoldedData.push(data[index + 1]);
      }
      index += 1;
    } else {
      unfoldedData.push(data[index]);
    }
  }
  return unfoldedData;
}

function getColorIndex(data, x, y, z) {
  return data[x + y * size + z * size * size];
}

'use strict';

const transforms = {
  darken,
  mapToChannels,
};

module.exports = function transform(type, ...args) {
  if (!transforms.hasOwnProperty(type)) {
    throw new Error(`Unknown color transform: ${type}`);
  }
  return transforms[type](...args);
};

const darkenFactor = 0.5;

const slicesByLength = {
  4: [
    [1, 2],
    [2, 3],
    [3, 4],
  ],
  7: [
    [1, 3],
    [3, 5],
    [5, 7],
  ],
};

const clampByLength = {
  4: 0xf,
  7: 0xff,
};

const sliceLengthByLength = {
  4: 1,
  7: 2,
};

function darken(color) {
  return ''.concat('#', ...mapToChannels(color).map(darkenChannel).map(mapToHex(color)));
}

function mapToChannels(color) {
  return slicesByLength[color.length].map(([start, end]) => parseInt(color.slice(start, end), 16));
}

function mapToHex(color) {
  return (channel) =>
    Math.max(0, Math.min(clampByLength[color.length], Math.round(channel)))
      .toString(16)
      .padStart(sliceLengthByLength[color], '0');
}

function darkenChannel(channel) {
  return channel * darkenFactor;
}

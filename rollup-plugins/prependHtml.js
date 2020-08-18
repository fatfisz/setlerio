import { readFileSync } from 'fs';

const html = readFileSync('./src/index.html', 'utf8').trim();

export default function replace() {
  return {
    name: 'prepend HTML',

    renderChunk(code) {
      return html + `<script>${code}</script>`;
    },
  };
}

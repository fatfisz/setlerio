'use strict';

module.exports = {
  a: letter(3)`
...
. .
...
. .
. .

  `,
  b: letter(3)`
..
. .
..
. .
..

  `,
  c: letter(3)`
...
.
.
.
...

  `,
  d: letter(3)`
..
. .
. .
. .
..

  `,
  e: letter(3)`
...
.
..
.
...

  `,
  f: letter(3)`
...
.
..
.
.

  `,
  g: letter(3)`
...
.
. .
. .
...

  `,
  h: letter(3)`
. .
. .
...
. .
. .

  `,
  i: letter(1)`
.
.
.
.
.

  `,
  j: letter(3)`
...
  .
  .
. .
 ..

  `,
  k: letter(3)`
. .
. .
..
. .
. .

  `,
  l: letter(3)`
.
.
.
.
...

  `,
  m: letter(5)`
.   .
.. ..
. . .
.   .
.   .

  `,
  n: letter(4)`
.  .
.. .
. ..
.  .
.  .

  `,
  o: letter(3)`
...
. .
. .
. .
...

  `,
  p: letter(3)`
...
. .
...
.
.

  `,
  q: letter(3)`
...
. .
. .
. .
...
  .
  `,
  r: letter(3)`
...
. .
...
..
. .

  `,
  s: letter(3)`
...
.
...
  .
...

  `,
  t: letter(3)`
...
 .
 .
 .
 .

  `,
  u: letter(3)`
. .
. .
. .
. .
...

  `,
  v: letter(3)`
. .
. .
. .
. .
 .

  `,
  w: letter(5)`
.   .
.   .
. . .
. . .
.....

  `,
  x: letter(3)`
. .
. .
 .
. .
. .

  `,
  y: letter(3)`
. .
. .
...
 .
 .

  `,
  z: letter(3)`
...
  .
 .
.
...

  `,
  1: letter(3)`
 .
..
 .
 .
 .

  `,
  2: letter(3)`
..
  .
 .
.
...

  `,
  3: letter(3)`
..
  .
 .
  .
..

  `,
  4: letter(3)`
.
.
. .
...
  .

  `,
  5: letter(3)`
...
.
..
  .
..

  `,
  6: letter(3)`
 .
.
..
. .
 .

  `,
  7: letter(3)`
...
  .
  .
 .
 .

  `,
  8: letter(3)`
 .
. .
 .
. .
 .

  `,
  9: letter(3)`
 .
. .
 ..
  .
 .

  `,
  0: letter(3)`
 .
. .
. .
. .
 .

  `,
  ' ': letter(2)`






  `,
  '.': letter(1)`




.

  `,
  ',': letter(1)`




.
.
  `,
  "'": letter(1)`
.
.




  `,
  '!': letter(1)`
.
.
.

.

  `,
  ':': letter(1)`

.

.


  `,
  '?': letter(3)`
...
  .
 .

 .
   `,
  '%': letter(3)`
. .
  .
 .
.
. .
   `,
  '[': letter(2)`
..
.
.
.
..

  `,
  ']': letter(2)`
..
 .
 .
 .
..

  `,
  '-': letter(2)`


..



  `,
  '>': letter(3)`
.
 .
  .
 .
.

  `,
};

function letter(width) {
  return function getLetterNumber([text]) {
    const lines = text.split('\n').slice(1, 7);
    const oneLineForm = lines.map((line) => line.padEnd(width, ' ')).join('');
    const letterNumber = [...oneLineForm]
      .reverse()
      .reduce((letter, pixel) => letter * 2 + (pixel === ' ' ? 0 : 1), 1);
    return letterNumber;
  };
}

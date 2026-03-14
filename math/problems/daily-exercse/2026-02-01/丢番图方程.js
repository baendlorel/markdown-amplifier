// 5888a+4888b+2888c+648d+328e+198f+98g=10000

const rangea = [-2, 2];
const rangeb = [-2, 2];
const rangec = [-4, 4];
const ranged = [-16, 16];
const rangee = [-32, 32];
const rangef = [-64, 64];
const rangeg = [-128, 128];

globalThis.running = true;

function run({ a: sa, b: sb, c: sc, d: sd, e: se, f: sf, g: sg }) {
  for (a = sa; a <= rangea[1]; a++) {
    for (b = sb; b <= rangeb[1]; b++) {
      for (c = sc; c <= rangec[1]; c++) {
        for (d = sd; d <= ranged[1]; d++) {
          for (e = se; e <= rangee[1]; e++) {
            for (f = sf; f <= rangef[1]; f++) {
              for (g = sg; g <= rangeg[1]; g++) {
                if (!globalThis.running) {
                  console.log('终止', JSON.stringify({ a, b, c, d, e, f, g }));
                  return;
                }
                const sum = 5888 * a + 4888 * b + 2888 * c + 648 * d + 328 * e + 198 * f + 98 * g;
                if (sum === 10000) {
                  console.log('找到了!!!!', { a, b, c, d, e, f, g });
                }
              }
            }
          }
        }
      }
    }
  }
}

// run({
//   a: rangea[0],
//   b: rangeb[0],
//   c: rangec[0],
//   d: ranged[0],
//   e: rangee[0],
//   f: rangef[0],
//   g: rangeg[0],
// });

run({
  a: 0,
  b: 0,
  c: 0,
  d: 0,
  e: 0,
  f: 0,
  g: 0,
});

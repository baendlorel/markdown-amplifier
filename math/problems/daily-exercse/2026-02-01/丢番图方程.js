// 5888a+4888b+2888c+648d+328e+198f+98g=10000

const rangea = [-2, 2];
const rangeb = [-2, 2];
const rangec = [-4, 4];
const ranged = [-16, 16];
const rangee = [-32, 32];
const rangef = [-64, 64];
const rangeg = [-128, 128];

window.running = true;

function run({ a, b, c, d, e, f, g }) {
  for (a = rangea[0]; a <= rangea[1]; a++) {
    for (b = rangeb[0]; b <= rangeb[1]; b++) {
      for (c = rangec[0]; c <= rangec[1]; c++) {
        for (d = ranged[0]; d <= ranged[1]; d++) {
          for (e = rangee[0]; e <= rangee[1]; e++) {
            for (f = rangef[0]; f <= rangef[1]; f++) {
              for (g = rangeg[0]; g <= rangeg[1]; g++) {
                if (!window.running) {
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

run({
  a: rangea[0],
  b: rangeb[0],
  c: rangec[0],
  d: ranged[0],
  e: rangee[0],
  f: rangef[0],
  g: rangeg[0],
});

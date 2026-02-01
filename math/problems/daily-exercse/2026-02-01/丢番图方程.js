// 5888a+4888b+2888c+648d+328e+198f+98g=10000

const rangea = [-2, 2];
const rangeb = [-2, 2];
const rangec = [-4, 4];
const ranged = [-16, 16];
const rangee = [-32, 32];
const rangef = [-64, 64];
const rangeg = [-128, 128];

for (let a = rangea[0]; a <= rangea[1]; a++) {
  for (let b = rangeb[0]; b <= rangeb[1]; b++) {
    for (let c = rangec[0]; c <= rangec[1]; c++) {
      for (let d = ranged[0]; d <= ranged[1]; d++) {
        for (let e = rangee[0]; e <= rangee[1]; e++) {
          for (let f = rangef[0]; f <= rangef[1]; f++) {
            for (let g = rangeg[0]; g <= rangeg[1]; g++) {
              const sum = 5888 * a + 4888 * b + 2888 * c + 648 * d + 328 * e + 198 * f + 98 * g;
              if (sum === 10000) {
                console.log('找到了!!!!', { a, b, c, d, e, f, g });
              } else if (Math.abs(sum - 10000) < 10) {
                console.log('接近了', { a, b, c, d, e, f, g, sum });
              }
            }
          }
        }
      }
    }
  }
}

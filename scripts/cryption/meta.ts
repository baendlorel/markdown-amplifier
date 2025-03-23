import { ccmd, ccms } from '../misc';

/**
 * HELP对象写在里面是为了方便和其他HELP对象Assign在一起 \
 * The HELP object is written inside to facilitate assignment with other HELP objects
 */
export const HELP = {
  encrypt: {
    example: [
      {
        cmd: `${ccmd('$')} note encrypt 123456`,
        comment: ccms(`Encrypt with key 123456, log language is same as system`),
      },
      {
        cmd: `${ccmd('$')} note encrypt 123456 -z`,
        comment: ccms(`Encrypt with key 123456, log language is Chinese`),
      },
      {
        cmd: `${ccmd('$')} note encrypt 123456 --en`,
        comment: ccms(`Encrypt with key 123456, log language is English`),
      },
    ],
  },
  decrypt: {
    example: [
      {
        cmd: `${ccmd('$')} note decrypt 123456`,
        comment: ccms(`Decrypt with key 123456, log language is same as system`),
      },
      {
        cmd: `${ccmd('$')} note decrypt 123456 -z`,
        comment: ccms(`Decrypt with key 123456, log language is Chinese`),
      },
      {
        cmd: `${ccmd('$')} note decrypt 123456 --en`,
        comment: ccms(`Decrypt with key 123456, log language is English`),
      },
    ],
  },
};

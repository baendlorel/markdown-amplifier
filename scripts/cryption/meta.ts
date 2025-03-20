import { ccmd, ccms } from '../misc';

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

/**
 * @name Cryption
 * @version 1.0.0
 * @author KasukabeTsumugi/futami16237@gmail.com
 * @description
 */

import { encryption } from './encrypt';
import { decryption } from './decrypt';
import { configs } from './misc';
import { argv } from './misc';

const main = () => {
  configs.set(argv.key, argv.action);
  configs.display();

  console.log();

  argv.isEncrypt && encryption();
  argv.isDecrypt && decryption();
};

main();

/**
 * @name Cryption
 * @version 1.0.0
 * @author KasukabeTsumugi/futami16237@gmail.com
 * @description
 */

import { argv } from './misc';
import { configs } from './misc';
import { encryption } from './encrypt';
import { decryption } from './decrypt';

const main = () => {
  configs.display();

  console.log();

  argv.isEncrypt && encryption();
  argv.isDecrypt && decryption();

  configs.saveHistoryKey();
};

main();

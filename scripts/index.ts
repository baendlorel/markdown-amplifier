#!/usr/bin/env tsx
/**
 * @name Cryption
 * @version 1.0.0
 * @author KasukabeTsumugi/futami16237@gmail.com
 * @description
 */

import { br, configs, i, pdi } from './misc';
import { encryption } from './encrypt';
import { decryption } from './decrypt';
import chalk from 'chalk';

const main = () => {
  configs.display();
  br();
  configs.action.isEncrypt && encryption();
  configs.action.isDecrypt && decryption();
  br();
  configs.saveHistoryKey();
  br();
  console.log(
    chalk.bgGreenBright(pdi('Cryption')) +
      ' ' +
      chalk.green(i('操作完成，欢迎下次使用', 'Done, welcome to use next time'))
  );
  br();
};

main();

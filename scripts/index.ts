#!/usr/bin/env tsx
/**
 * @name Cryption
 * @version 1.0.0
 * @author KasukabeTsumugi/futami16237@gmail.com
 * @description
 */

import { br, configs, lflag } from './misc';
import { encryption } from './encrypt';
import { decryption } from './decrypt';

const main = () => {
  configs.display();
  br();
  configs.action.isEncrypt && encryption();
  configs.action.isDecrypt && decryption();
  br();
  configs.saveHistoryKey();
  br();
  lflag('操作完成，欢迎下次使用', 'Done, see you next time');
  br();
};

main();

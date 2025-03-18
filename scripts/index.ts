#!/usr/bin/env tsx
/**
 * @name Cryption
 * @version 1.0.0
 * @author KasukabeTsumugi/futami16237@gmail.com
 * @description
 */

import { configs } from './misc';
import { encryption } from './encrypt';
import { decryption } from './decrypt';
import { Command } from 'commander';

const program = new Command(); // 创建一个 Commander 实例

program.name('note').description('A markdown note tool.').version('1.0.0');

program
  .command('encrypt <key>')
  .description(`Encrypt files with <key> in 'encrypted' folder(set in package.json)`)
  .action((key: string) => {
    configs.init();
    configs.setKey(key);
    encryption();
  });

program
  .command('decrypt <key>')
  .description(`Decrypt files with <key> in 'encrypted' folder(set in package.json)`)
  .action((key: string) => {
    configs.init();
    configs.setKey(key);
    decryption();
  });

program.option('--zh', 'Set info language to Chinese').action(() => {
  configs.setLocale('zh');
});
program.option('--en', 'Set info language to English').action(() => {
  configs.setLocale('en');
});

program.parse();

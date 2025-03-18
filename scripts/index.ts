#!/usr/bin/env tsx
/**
 * @name Note
 * @version 1.0.0
 * @author KasukabeTsumugi/futami16237@gmail.com
 * @description
 */

import { configs, ccmd, ccms } from './misc';
import { encryption } from './encrypt';
import { decryption } from './decrypt';
import { Command, Option } from 'commander';
import { HELP } from './misc/consts';

const program = new Command(); // 创建一个 Commander 实例

program.name('note').description('A markdown note enhance tool.').version('1.0.0');

program.addCommand(
  new Command('encrypt')
    .argument('<key>')
    .description(`Encrypt files with <key> in 'decrypted' folder(set in package.json)`)
    .addOption(new Option('-z, --zh', 'Language set to Chinese').conflicts('en'))
    .addOption(new Option('-e, --en', 'Language set to English').conflicts('zh'))
    .action((key, options) => {
      configs.setLocale(options.zh ? 'zh' : 'en');
      configs.init(key);
      // encryption();
    })
    .on('--help', () => {
      console.log('Examples:');
      HELP.decrypt.example.forEach((o) => {
        console.log(`  ${ccmd('$')} ${o.cmd} ${ccms(o.comment)}`);
      });
    })
);

program.addCommand(
  new Command('decrypt')
    .argument('<key>')
    .description(`Decrypt files with <key> in 'encrypted' folder(set in package.json)`)
    .addOption(new Option('-z, --zh', 'Language set to Chinese').conflicts('en'))
    .addOption(new Option('-e, --en', 'Language set to English').conflicts('zh'))
    .action((key, options) => {
      configs.setLocale(options.zh ? 'zh' : 'en');
      configs.init(key);
      // decryption();
    })
    .on('--help', () => {
      console.log('Examples :');
      HELP.decrypt.example.forEach((o) => {
        console.log(`  ${ccmd('$')} ${o.cmd} ${ccms(o.comment)}`);
      });
    })
);

program.parse();

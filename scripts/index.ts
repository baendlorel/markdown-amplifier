#!/usr/bin/env tsx
/**
 * @name Note
 * @version 1.0.0
 * @author KasukabeTsumugi/futami16237@gmail.com
 * @description
 */

import { Command, Option } from 'commander';
import { configs, br, aligned } from './misc';
import { encryption, decryption } from './cryption';
import { HELP } from './misc';

const program = new Command(); // 创建一个 Commander 实例

program.name('note').description('A markdown note enhance tool.').version('1.0.0');

const COMMANDS = [] as Command[];

/**
 * 每个命令都可以设置中英文，故此处采用统一配置+hook的方式实现 \
 * Each command can be set to Chinese or English, so a unified configuration + hook method is more efficient
 * @param name 命令名称
 * @param argument 命令参数
 * @returns
 */
const addCommand = (name: string, argument: string) => {
  const newCommand = new Command(name)
    .argument(argument)
    .addOption(new Option('-z, --zh', 'Log language set to Chinese').conflicts('en'))
    .addOption(new Option('-e, --en', 'Log language set to English').conflicts('zh'))
    .on('--help', () => {
      console.log(`\nExample:`);
      aligned(HELP[name].example);
    })
    .hook('preAction', (thisCommand, actionCommand) => {
      configs.setLocale(actionCommand.opts().zh ? 'zh' : 'en');
      br();
      configs.init();
      br();
    });
  COMMANDS.push(newCommand);
  return newCommand;
};

addCommand('encrypt', '<key>')
  .aliases(['en', 'e'])
  .description(`Encrypt files with <key> in 'decrypted' folder(set in note.json)`)
  .action(encryption);

addCommand('decrypt', '<key>')
  .aliases(['de', 'd'])
  .description(`Decrypt files with <key> in 'encrypted' folder(set in note.json)`)
  .action(decryption);

addCommand('number', '<directory>')
  .aliases(['no', 'n'])
  .option('-a, --anchor', 'Create anchor to make h element directable')
  .option('-m, --math', `Also number the ${HELP.number.supportedWords.join(', ')}.`)
  .addOption(
    new Option(
      '-c, --clear-anchor',
      'Remove anchor of h element that created by this tool. Can only be used independently'
    ).conflicts(['anchor', 'math'])
  )
  .description(`Numbering all h element or other tags in the markdown files`)
  .action((directory, options) => {});

COMMANDS.forEach((cmd) => program.addCommand(cmd));
program.parse();

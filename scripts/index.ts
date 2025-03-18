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
import { Command } from 'commander';

const program = new Command(); // 创建一个 Commander 实例

program.name('note').description('A markdown note tool.').version('1.0.0');

// 定义命令
program
  .command('greet <name>') // `<name>` 表示必填参数
  .description('向指定用户打招呼')
  .action((name) => {
    console.log(`你好, ${name}！`);
  });

program
  .command('deploy')
  .description('部署项目')
  .option('-e, --env <env>', '指定环境', 'production') // 默认值为 'production'
  .option('-d, --debug', '开启调试模式')
  .action((options) => {
    console.log(`环境: ${options.env}`);
    if (options.debug) console.log('调试模式已开启');
  });

program.option('-e, --encrypt', 'Encrypt notes').action(encryption);
program.option('-d, --decrypt', 'Decrypt notes').action(decryption);
program.option('--zh', 'Set to Chinese');
program.option('--en', 'Set to English');

program.parse();
// const main = () => {
//   configs.display();
//   br();
//   configs.action.isEncrypt && encryption();
//   configs.action.isDecrypt && decryption();
//   // * 不再记录历史，而是采用akasha
//   // br();
//   // configs.saveHistoryKey();
//   br();
//   lflag('操作完成，欢迎下次使用', 'Done, see you next time');
//   br();
// };

// main();

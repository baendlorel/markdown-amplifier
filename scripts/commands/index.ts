/**
 * @name Command
 */

import { Command, Option } from 'commander';
import { configs, br, aligned, cb1, grey, table } from '../misc';
import { encryption, decryption } from '../cryption';
import { HELP } from './meta';

export const createCommander = () => {
  const COMMANDS = [] as Command[];

  const program = new Command();
  program.name('note').description('A markdown note enhance tool.').version('1.0.0');

  const showExample = (examples: { cmd: string; comment: string }[]) => {
    console.log(`\nExample:`);
    aligned(examples);
  };

  /**
   * 每个命令都可以设置中英文，故此处采用统一配置+hook的方式实现 \
   * Each command can be set to Chinese or English, so a unified configuration + hook method is more efficient
   * @param name 命令名称
   * @param argument 命令参数
   * @returns
   */
  const addCommand = (name: string, argument?: string) => {
    const newCommand = new Command(name);
    if (argument) {
      newCommand.argument(argument);
    }
    newCommand
      .addOption(new Option('-z, --zh', 'Log language set to Chinese').conflicts('en'))
      .addOption(new Option('-e, --en', 'Log language set to English').conflicts('zh'))
      .on('--help', () => showExample(HELP[name].example))
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
    .aliases(['en'])
    .description(`Encrypt files with <key> in 'decrypted' folder(set in note.json)`)
    .action(encryption);

  addCommand('decrypt', '<key>')
    .aliases(['de'])
    .description(`Decrypt files with <key> in 'encrypted' folder(set in note.json)`)
    .action(decryption);

  addCommand('number')
    .aliases(['no'])
    .description(`Numbering titles or other tags, only affect *.md files`)
    .option('-d, --dir <directory>', 'Numbering files in <directory>, only for *.md files.')
    .option('-a, --anchor', 'Create anchor to make h element directable')
    .option(
      '-m, --math [rule]',
      `Also number the ${HELP.number.supportedWords
        .slice(0, 2)
        .join(', ')}, etc. Use '--math rule' to see the detailed numbering rule`
    )
    .addOption(
      new Option(
        '-c, --clear-anchor',
        'Remove anchor of h element that created by this tool. Can only be used independently'
      ).conflicts(['anchor', 'math', 'math-rules'])
    )
    .action((options) => {
      // 展示math关键字编号规则的情形
      // 如果写了命令--math rule，就展示math选项编号的规则
      if (options.math === 'rule' || options.math === 'rules') {
        const ruleTable = HELP.number.mathRule.map((r) => ({
          noun: r.noun,
          description: r.rule + (r.detail === '' ? '' : '\n' + cb1(`Detail: ${grey(r.detail)}`)),
        }));
        table(ruleTable, [{ index: 'noun' }, { index: 'description', maxWidth: 50 }]);
        return;
      }
      // 如果写了--math但写了其他的参数，就报错
      else if (options.math !== true && options.math !== undefined) {
        console.log(
          `Error: --math can only be used as an option to number mathematical keywords or with argument 'rule'`
        );
        showExample([HELP.number.exampleMathRule]);
        return;
      }

      // 其他情形则必须拥有dir选项和目录
      if (typeof options.dir !== 'string') {
        console.log('Error: --dir <directory> is required.');
      }
      showExample(HELP.number.example);
      return;
    });

  COMMANDS.forEach((cmd) => program.addCommand(cmd));
  program.parse();
};

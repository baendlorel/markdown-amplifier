/**
 * @name Command
 */

import { Command, Option } from 'commander';
import chalk from 'chalk';
import { aligned, cb1, grey } from '../misc';
import { encryption, decryption } from '../cryption';
import { HELP as HELP_CRYPTION } from '../cryption/meta';
import { findMatch, HELP as HELP_NUMBERER } from '../numberer/rules';
import { numberFile } from '../numberer';
import { configs } from '../core';

export const createCommander = () => {
  const MAX_COL_WIDTH = 52;

  const HELP = Object.assign(HELP_CRYPTION, HELP_NUMBERER);

  const COMMANDS = [] as Command[];

  const program = new Command();
  program.name('ma').description('A markdown note enhance tool.').version('1.0.0');

  const showExample = (examples?: { cmd: string; comment: string }[]) => {
    if (!examples) {
      return;
    }
    console.log(`\nExample:`);
    aligned(examples, [{ index: 'cmd' }, { index: 'comment', maxWidth: MAX_COL_WIDTH }]);
  };

  /**
   * 每个命令都可以设置中英文，故此处采用统一配置+hook的方式实现 \
   * Each command can be set to Chinese or English, so a unified configuration + hook method is more efficient
   * @param name 命令名称
   * @param argument 命令参数
   * @returns
   */
  const add = (name: string, argument?: string) => {
    const newCommand = new Command(name);
    if (argument) {
      newCommand.argument(argument);
    }
    newCommand.on('--help', () => showExample(HELP[name]?.example));
    COMMANDS.push(newCommand);
    return newCommand;
  };

  add('config')
    .aliases(['con'])
    .description('Show the configuration of MA')
    .action(() => {
      console.log(configs.raw);
    });

  add('encrypt', '<key>')
    .aliases(['en'])
    .description(
      `Encrypt files with <key> in 'decrypted' folder(set in markdown-amplifier.json)`
    )
    .action(encryption);

  add('decrypt', '<key>')
    .aliases(['de'])
    .description(
      `Decrypt files with <key> in 'encrypted' folder(set in markdown-amplifier.json)`
    )
    .action(decryption);

  add('number')
    .aliases(['no'])
    .description(`Numbering titles or other tags, only affect *.md files`)
    .option(
      '-d, --dir <directory>',
      'Numbering files in <directory>, only for *.md files.'
    )
    .option('-a, --anchor', 'Create anchor to make h element directable')
    .option(
      '-m, --math [rule]',
      `Also number the theorems, axioms and other keywords. Use '--math rule' to see detailed numbering rules`
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
          description:
            r.rule + (r.detail === '' ? '' : '\n' + cb1(`Detail: ${grey(r.detail)}`)),
        }));

        aligned(ruleTable, [
          { index: 'noun' },
          { index: 'description', maxWidth: MAX_COL_WIDTH },
        ]);
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
        showExample(HELP.number.example);
      }

      // 正式工作
      numberFile(options.dir);
      return;
    });

  add('test')
    .description(`Some internal tests`)
    .action(() => {
      const LINES = [
        ` theorem`,
        ` Theorem   1.1.2`,
        ` lemma   1.1.2`,
        ` theorem 1.1.2.`,
        ` **theorem 1.1.2**`,
        ` **theorem 1.1.2.**`,
        ` <lemma id="lemma1.1.2">引理 1.1.2.</lemma>`,
        ` <theorem id="theorem1.1.2">theorem 1.1.2.</theorem>`,
        ` **<theorem id="theorem1.1.2">theorem 1.1.2.</theorem>**`,
        ` <theorem id="theorem1.1.2">**theorem 1.1.2.**</theorem>`,
        '定理 1.2.3', // 应匹配
        ' 定理 1.2.3', // 应匹配（前导空格）
        '**定理 1.2.3**', // 应匹配（加粗语法）
        '定理.', // 应匹配（仅有句号）
        '定理', // 不应匹配（没有编号或句号）
        ' 定理', // 不应匹配（没有编号或句号）
        '定理 1', // 应匹配（单个数字）
        '定理 1.2', // 应匹配（两级编号）
        '定理 1.2.3.', // 应匹配（编号后有句号）
        '**定理 1.2.3.**', // 应匹配（加粗语法包裹编号和句号）
        '**<theorem id="theorem1.1.2">theorem 1.1.2.</theorem>**', // 英文关键词
        '<theorem id="theorem1.1.2">theorem 1.1.2.</theorem>', // 英文关键词
        '**<theorem id="theorem1.1.2">定理 1.1.2.</theorem>**', // 中文关键词
        '<theorem id="theorem1.1.2">定理 1.1.2.</theorem>', // 中文关键词
        '<theorem id="theorem1.1.2">定理.</theorem>', // 中文关键词，仅句号
        '<theorem id="theorem1.1.2">theorem.</theorem>', // 英文关键词，仅句号
      ];
      LINES.forEach((l) => {
        const w = findMatch(l);
        if (!w) {
          console.log('No match', l);
          return;
        }

        const matchedId = w.str.match(w.rule.idRegex);
        console.log(
          l === w.str ? chalk.yellow(`[true] `) : chalk.magenta(`[false]`),
          chalk.red(`[${w.index}] ${w.rule.flag}`),
          l,
          chalk.green(matchedId?.[1] || matchedId?.[0] || '无')
        );
      });
    });

  COMMANDS.forEach((cmd) => program.addCommand(cmd));
  program.parse();
};

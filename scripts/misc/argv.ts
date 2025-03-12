/**
 * @name ArgV
 * @description
 * 依赖于locale、logger
 */
import chalk from 'chalk';
import { i } from './locale';
import { log, lred, table, lbgSucc, lbgBlue, br } from './logger';
//// console.log(global.idx === undefined ? (global.idx = 1) : ++global.idx, __filename);
// 由于选取语言文本和打日志的需要，只能在locale.ts里提前处理参数里的语言
const resolveArgV = () => {
  // * 定义私有变量和常量
  type CommandCategory = 'help' | 'locale' | 'action';

  const Command = {
    HELP: '--help',
    HELP_SHORT: '-h',
    LOCALE_ZH: '--zh',
    LOCALE_EN: '--en',
    ENCRYPT: '--encrypt',
    DECRYPT: '--decrypt',
  } as const;

  const COMMAND = [
    { arg: Command.HELP, category: 'help', property: '' },
    { arg: Command.HELP_SHORT, category: 'help', property: '' },
    { arg: Command.LOCALE_ZH, category: 'locale', property: 'zh' },
    { arg: Command.LOCALE_EN, category: 'locale', property: 'en' },
    { arg: Command.ENCRYPT, category: 'action', property: 'encrypt' },
    { arg: Command.DECRYPT, category: 'action', property: 'decrypt' },
  ] as { arg: string; category: CommandCategory; property: string }[];

  // 配置案例
  const showPackageJsonConfigExample = () => {
    const cm = chalk.rgb(122, 154, 96);
    const k = chalk.rgb(177, 220, 251);
    const v = chalk.rgb(193, 148, 125);
    const p = chalk.rgb(202, 123, 210);
    const b = chalk.rgb(93, 161, 248);
    const y = chalk.rgb(245, 214, 74);

    const _cryption = i('Cryption配置，以下为默认值', 'Cryption config, default values');
    const _encryptFileName = i('是否加密文件名', 'Whether to encrypt file names');
    const _encryptFolderName = i('是否加密文件夹名', 'Whether to encrypt folder names');
    const _exclude = i('排除的文件或文件夹', 'Excluded files or folders');
    const _directory = i('加解密文件夹', 'En/decrypt folder name');
    const _decrypted = i('包含秘密信息的文件夹', 'Folder that contains secret files');
    const _encrypted = i('放置加密后文件的文件夹', 'Encrypted file will be put into them');

    const packageJsonConfigExample = `${y(`{`)}
  ...other configs,
  ${k(`"cryption"`)}: ${p(`{`)}                   ${cm('// ' + _cryption)}
      ${k(`"encryptFileName"`)}: ${b(`true`)},    ${cm('// ' + _encryptFileName)}
      ${k(`"encryptFolderName"`)}: ${b(`true`)},  ${cm('// ' + _encryptFolderName)}
      ${k(`"exclude"`)}: ${b(`[]`)},              ${cm('// ' + _exclude)}
      ${k(`"directory"`)}: ${b(`{`)}              ${cm('// ' + _directory)}
        ${k(`"decrypted"`)}: ${v(`"decrypted"`)}, ${cm('// ' + _decrypted)}
        ${k(`"encrypted"`)}: ${v(`"encrypted"`)}  ${cm('// ' + _encrypted)}
    ${b(`}`)}
  ${p(`}`)}
${y(`}`)}`;
    console.log(packageJsonConfigExample);
  };

  const showHelp = () => {
    const dic = [
      {
        directive: [Command.HELP, Command.HELP_SHORT].join(', '),
        description: i('显示帮助', 'Show Help'),
      },
      {
        directive: Command.LOCALE_ZH,
        description: i('日志、报错设为使用中文', 'Display logs and errors in Chinese'),
      },
      {
        directive: Command.LOCALE_EN,
        description: i('日志、报错设为使用英文', 'Display logs and errors in English'),
      },
      {
        directive: Command.ENCRYPT + ' <key>',
        description: i(
          '以<key>为密钥执行加密，会清空加密文件夹',
          `Encrypt files with <key>. Will clear 'encrypted' the folder first.`
        ),
      },
      {
        directive: Command.DECRYPT + ' <key>',
        description: i(
          '以<key>为密钥执行解密，会清空解密文件夹',
          `Decrypt files with <key>. Will clear the 'decrypted' folder first.`
        ),
      },
    ];

    const cm = chalk.rgb(122, 154, 96);
    lbgBlue(i('介绍', 'Introduction'));
    log(
      `
  Cryption是为了让git管理的个人笔记、知识库能够更安全地记录秘密信息而编写加密解密工具
  - 程序会从脚本目录开始往上层逐级搜索package.json，并将找到的目录定为笔记的根目录
  - 您可以在package.json中设置要加密、解密的文件夹（其他配置见下方例子）
  - 解密文件夹就是在本地编写秘密信息的文件夹，Cryption会自动将其纳入.gitignore中
  - 每次使用的密钥key会自动记入.history-keys文件中，此文件也会自动纳入.gitignore
  - 加密、解密时，会清空对应的目标文件夹，请注意备份`,
      ``
    );
    br();

    lbgBlue(i('package.json配置例', 'package.json config example'));
    showPackageJsonConfigExample();
    br();

    lbgBlue(i('指令列表', 'Directive Table'));
    table(
      dic.map((d) => ({
        directive: chalk.gray(d.directive),
        description: cm(d.description),
      })),
      [
        { index: 'directive', alias: i('指令', 'Supported Directives') },
        { index: 'description', alias: i('指令用途', 'Description') },
      ]
    );
    br();

    lbgBlue(i('使用例', 'Example'));
    log(
      '  crypt --encrypt --zh <key>' +
        cm(
          ' // ' +
            i('以<key>为密钥加密，展示中文信息', 'Encrypt with <key> and display logs in Chinese')
        )
    );
    br();
  };

  const resolve = (commands: string[]) => {
    // 如果有key，先把密钥找出来
    // * 从左到右第一个不以减号开头的参数记为key
    const keyIndex = commands.findIndex((c) => !c.startsWith('-'));
    let key = '';
    if (keyIndex !== -1) {
      key = commands[keyIndex];
      commands[keyIndex] = commands[0];
      commands.shift();
    }

    const invalidCommands = [] as string[];

    const count = {
      help: 0,
      locale: 0,
      action: 0,
    } as { [key in CommandCategory]: number };

    for (const c of commands) {
      const command = COMMAND.find((cmd) => cmd.arg === c);
      if (command) {
        count[command.category]++;
      } else {
        invalidCommands.push(c);
      }
    }

    // 检测是否在没有HELP指令的情况下，没有ACTION指令
    if (count.help === 0 && count.action === 0) {
      lred(i('没有有效的指令', 'No valid command'));
      return undefined;
    }

    // 检测是否有同一种参数多重书写的
    for (const [k, v] of Object.entries(count)) {
      if (v > 1) {
        lred(
          i(
            '同一种参数不能重复: ' + k,
            'Commands in same category should not be used at the same time: ' + k
          )
        );
        return undefined;
      }
    }

    // 检测是否有不合法的参数
    if (invalidCommands.length > 0) {
      lred(i('这些参数不合法', 'Invalid command') + ': ' + invalidCommands.join(' '));
      return undefined;
    }

    // 如果没有密钥，但是有ACTION指令，那么就是不合法的
    if (count.action > 0 && key === '') {
      lred(i('没有提供密钥', 'No key provided'));
      return undefined;
    }

    const resolved = {
      key,
      action: '',
      isEncrypt: commands.includes(Command.ENCRYPT),
      isDecrypt: commands.includes(Command.DECRYPT),
      isHelp: commands.includes(Command.HELP) || commands.includes(Command.HELP_SHORT),
      showPackageJsonConfigExample, // 此处仅仅是为了configs模块可以使用它，避免argv和configs都写一遍
    };

    resolved.isEncrypt && (resolved.action = 'encrypt');
    resolved.isDecrypt && (resolved.action = 'decrypt');

    return resolved;
  };

  // * 开始处理参数

  // 第一第二个参数是 node 和 脚本路径，省略之
  // 去重
  const commands = Array.from(new Set(process.argv.slice(2)));

  const resolved = resolve(commands);

  // 如果参数不合法或包含了帮助指令，那么输出帮助并退出
  if (!resolved || resolved.isHelp) {
    showHelp();
    process.exit(1);
  }

  // 至此，commands一定包含ACTION，同命令不重复，没有不合法的命令
  return resolved;
};

export const argv = resolveArgV();

import { i } from './locale';
import { lred } from './logger';

// 由于选取语言文本和打日志的需要，只能在locale.ts里提前处理参数里的语言
const createArgVManager = () => {
  // # 定义私有变量和常量

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

  const help = `[Cryption] ${i('可选参数如下', 'Optional arguments')} 
  --help, -h : ${i('显示帮助', 'Show this help')}
  --zh       : ${i('日志、报错设为使用中文', 'Display logs and errors in Chinese')}
  --en       : ${i('日志、报错设为使用英文', 'Display logs and errors in English')}
  --encrypt  : ${i(
    '执行加密，会清空加密文件夹，并把加密后的文件放入',
    'Do the encryption, will clear the encrypted folder and put the encrypted files in'
  )}
  --decrypt  : ${i(
    '执行解密，会清空解密文件夹，并把解密后的文件放入',
    'Do the decryption, will clear the decrypted folder and put the decrypted files in'
  )}
  `;

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
          i('同一种参数不能重复', 'Commands in same category should not be used at the same time') +
            ': ' +
            k
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
    };

    resolved.isEncrypt && (resolved.action = 'encrypt');
    resolved.isDecrypt && (resolved.action = 'decrypt');

    return resolved;
  };

  // # 主逻辑

  // 第一第二个参数是 node 和 脚本路径，省略之
  // 去重
  const commands = Array.from(new Set(process.argv.slice(2)));

  const resolved = resolve(commands);

  // 如果参数不合法或包含了帮助指令，那么输出帮助并退出
  if (!resolved || resolved.isHelp) {
    console.log(help);
    process.exit(0);
  }

  // 至此，commands一定包含ACTION，同命令不重复，没有不合法的命令
  return resolved;
};

export const argv = createArgVManager();

import { i } from './locale';
import { lred } from './logger';

// TODO 把这些命令配置设置成一个对象，然后在校验的时候遍历这个对象，而不是硬编码
const Command = {
  HELP: ['--help', '-h'],
  LOCALE: ['--zh', '--en'],
  ACTION: ['--encrypt', '--decrypt'],
  assert: (commands: string[]) => {
    const invalidCommands = [] as string[];

    const count = {
      HELP: 0,
      LOCALE: 0,
      ACTION: 0,
    };

    for (const c of commands) {
      if (Command.HELP.includes(c)) {
        count.HELP++;
      } else if (Command.LOCALE.includes(c)) {
        count.LOCALE++;
      } else if (Command.ACTION.includes(c)) {
        count.ACTION++;
      } else {
        invalidCommands.push(c);
      }
    }

    // 检测是否在没有HELP指令的情况下，没有ACTION指令
    if (count.HELP === 0 && count.ACTION === 0) {
      lred(
        '没有提供有效的操作，操作只能是' + Command.ACTION.join('或'),
        'No valid action provided, action should be ' + Command.ACTION.join(' or ')
      );
      return false;
    }

    // 检测是否有同一种参数多重书写的
    for (const [key, value] of Object.entries(count)) {
      if (value > 1) {
        lred(i('同一种参数不能重复', 'The same command should not be repeated') + ': ' + key);
      }
      return false;
    }

    // 检测是否有不合法的参数
    if (invalidCommands.length > 0) {
      lred(i('这些参数不合法', 'Invalid command') + ': ' + invalidCommands.join(' '));
      return false;
    }

    return true;
  },
};

const help = '';

// 由于选取语言文本和打日志的需要，只能在locale.ts里提前处理参数里的语言
const createArgVManager = () => {
  let key = undefined as string | undefined;

  // 第一第二个参数是 node 和 脚本路径，省略之
  const commands = process.argv.slice(2);

  // 从左往右第一个不以减号的参数是密钥，将其提取
  const keyIndex = commands.findIndex((c) => !c.startsWith('--'));
  if (keyIndex !== -1) {
    key = commands[keyIndex];
    commands[keyIndex] = commands[0];
    commands.shift();
  }

  // * 经过校验后，commands一定包含ACTION，同命令不重复，没有不合法的命令
  if (!Command.assert(commands)) {
    console.log(help);
    process.exit(0);
  }

  const hasCommand = {
    help: commands.some((c) => Command.HELP.includes(c)),
    locale: false,
    action: false,
  }

  // 含有帮助指令那就直接打印帮助
  if () {
    console.log(help);
    process.exit(0);
  }


};

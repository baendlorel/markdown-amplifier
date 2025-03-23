import { ck, cv, cb1, cb2, cb3, ccms } from '../misc';

/**
 * 核心文件夹名称 \
 * Core folder name
 */
export const MA_DIR = '.ma';

/**
 * 配置文件名 \
 * config file name
 */
export const MA_RC = '.marc.json';
/**
 * 初始化用的配置文件名 \
 * Configuration file name for initialization
 */
export const MA_RC_DEFAULT = '.marc.default.json';

/**
 * 获取MA在markdown-amplifier.json配置示例，需要注入语言切换器  \
 * Get the example of Note configuration in markdown-amplifier.json, need to inject the language switcher
 * @param i 语言切换器 language switcher
 * @returns
 */
export const MARC_JSON_EXAMPLE = (i: any) => {
  const k = ck;
  const v = cv;
  const y = cb1;
  const p = cb2;
  const b = cb3;

  const _cryption = i(
    'Markdown Ampifier配置，以下为默认值',
    'Note config, default values'
  );
  const _encryptFileName = i('是否加密文件名', 'Whether to encrypt file names');
  const _encryptFolderName = i('是否加密文件夹名', 'Whether to encrypt folder names');
  const _exclude = i('排除的文件或文件夹', 'Excluded files or folders');
  const _directory = i('加解密文件夹', 'En/decrypt folder name');
  const _decrypted = i('包含秘密信息的文件夹', 'Folder that contains secret files');
  const _encrypted = i('放置加密后文件的文件夹', 'Encrypted file will be put into them');

  return `${y(`{`)}
    ...other configs,
    ${k(`"note"`)}: ${p(`{`)}                 ${ccms(_cryption)}
      ${k(`"encryptFileName"`)}: ${b(`true`)},    ${ccms(_encryptFileName)}
      ${k(`"encryptFolderName"`)}: ${b(`true`)},  ${ccms(_encryptFolderName)}
      ${k(`"exclude"`)}: ${b(`[]`)},              ${ccms(_exclude)}
      ${k(`"directory"`)}: ${b(`{`)}              ${ccms(_directory)}
        ${k(`"decrypted"`)}: ${v(`"decrypted"`)}, ${ccms(_decrypted)}
        ${k(`"encrypted"`)}: ${v(`"encrypted"`)}  ${ccms(_encrypted)}
      ${b(`}`)}
    ${p(`}`)}
  ${y(`}`)}`;
};

const INTRODUCTION = (i: any) =>
  i(
    `Cryption是为了让git管理的个人笔记、知识库能够更安全地记录秘密信息而编写加密解密工具
  - 程序会从脚本目录开始往上层逐级搜索markdown-amplifier.json，并将找到的目录定为笔记的根目录
  - 您可以在markdown-amplifier.json中设置要加密、解密的文件夹（其他配置见下方例子）
  - 解密文件夹就是在本地编写秘密信息的文件夹，Cryption会自动将其纳入.gitignore中
  - 加密、解密时，会清空对应的目标文件夹，请注意备份`,
    `Note is designed to enhance the security of personal notes and knowledge bases managed by Git by providing encryption and decryption capabilities.
  - The program will start from the script directory and search upward through parent directories for a markdown-amplifier.json file. Once found, that directory will be identified as the root of your notes project.
  - You can configure the folders to be encrypted and decrypted directly within the markdown-amplifier.json file (see example configuration below).
  - The decryption folder is where you write and manage your secret information locally. Note will automatically add this folder to .gitignore to prevent it from being committed to your repository.
  - Warning: When encrypting or decrypting, the corresponding target folder will be cleared. Please ensure you have backups before proceeding.
`
  );

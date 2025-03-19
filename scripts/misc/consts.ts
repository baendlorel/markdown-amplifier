import { ck, cv, cb1, cb2, cb3, ccms, ccmd } from './color';

/**
 * 获取Cryption在package.json配置示例，需要注入语言切换器  \
 * Get the example of Note configuration in package.json, need to inject the language switcher
 * @param i 语言切换器 language switcher
 * @returns
 */
export const PACKAGEJSON_CRYPTION_CONFIG_EXAMPLE = (i: any) => {
  const k = ck;
  const v = cv;
  const y = cb1;
  const p = cb2;
  const b = cb3;

  const _cryption = i('Cryption配置，以下为默认值', 'Note config, default values');
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

export const HELP = {
  number: {
    example: [
      {
        cmd: `${ccmd('$')} note number math`,
        comment: ccms(`Numbering all h element in the markdown files in 'math' folder`),
      },
      {
        cmd: `${ccmd('$')} note number myfolder --anchor`,
        comment: ccms(
          `Numbering all h element in the markdown files in 'myfolder' folder and add anchor`
        ),
      },
      {
        cmd: `${ccmd('$')} note number mathstudy --math`,
        comment: ccms(
          `Numbering all h elements, theorems, collaries and cases in the markdown files in 'mathstudy' folder`
        ),
      },
    ],
  },
  encrypt: {
    example: [
      {
        cmd: `${ccmd('$')} note encrypt 123456`,
        comment: ccms(`Encrypt with key 123456, log language is same as system`),
      },
      {
        cmd: `${ccmd('$')} note encrypt 123456 -z`,
        comment: ccms(`Encrypt with key 123456, log language is Chinese`),
      },
      {
        cmd: `${ccmd('$')} note encrypt 123456 --en`,
        comment: ccms(`Encrypt with key 123456, log language is English`),
      },
    ],
  },
  decrypt: {
    example: [
      {
        cmd: `${ccmd('$')} note decrypt 123456`,
        comment: ccms(`Decrypt with key 123456, log language is same as system`),
      },
      {
        cmd: `${ccmd('$')} note decrypt 123456 -z`,
        comment: ccms(`Decrypt with key 123456, log language is Chinese`),
      },
      {
        cmd: `${ccmd('$')} note decrypt 123456 --en`,
        comment: ccms(`Decrypt with key 123456, log language is English`),
      },
    ],
  },
};

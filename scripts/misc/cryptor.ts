/**
 * @name Cryptor
 * @description
 * 依赖于configs、memoize
 */
import crypto from 'crypto';
import { configs } from './configs';
import { memoize } from './utils';
//// console.log(global.idx === undefined ? (global.idx = 1) : ++global.idx, __filename);

const deriveKey = (): Buffer => {
  return crypto.createHash('sha256').update(configs.key).digest();
};

export const aes = {
  encrypt: (text: string): string => {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', deriveKey(), iv);
    const encryptedBuffer = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
    return iv.toString('hex') + ':' + encryptedBuffer.toString('hex');
  },
  decrypt: (encryptedText: string): string => {
    const parts = encryptedText.split(':');
    const iv = Buffer.from(parts[0], 'hex');
    const encryptedData = Buffer.from(parts[1], 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', deriveKey(), iv);
    const decryptedBuffer = Buffer.concat([decipher.update(encryptedData), decipher.final()]);
    return decryptedBuffer.toString('utf8');
  },
};

const ALPHABET = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

// **转换二进制数据为 A-Z 字母**
const toAlphaString = (buffer: Uint8Array<ArrayBuffer>): string => {
  let result = '';

  for (const byte of buffer) {
    result += ALPHABET[Math.floor(byte / ALPHABET.length)];
    result += ALPHABET[byte % ALPHABET.length];
  }

  return result;
};

// **将 A-Z 字符串转换回二进制**
const fromAlphaString = (text: string): Buffer => {
  if (text.length % 2 !== 0) throw new Error('Invalid encoded text length');

  const bytes = [] as number[];
  for (let i = 0; i < text.length; i += 2) {
    const high = ALPHABET.indexOf(text[i]);
    const low = ALPHABET.indexOf(text[i + 1]);
    if (high === -1 || low === -1) throw new Error('Invalid character in encoded text');

    bytes.push(high * ALPHABET.length + low);
  }

  return Buffer.from(bytes);
};

export const xor = {
  decrypt: memoize((encryptedText: string): string => {
    const keyBytes = Buffer.from(deriveKey());
    const encryptedBytes = fromAlphaString(encryptedText);
    const decrypted = encryptedBytes.map((byte, i) => byte ^ keyBytes[i % keyBytes.length]);
    return decrypted.toString();
  }),
  encrypt: memoize((text: string): string => {
    const keyBytes = Buffer.from(deriveKey());
    const textBytes = Buffer.from(text);
    const encrypted = textBytes.map((byte, i) => byte ^ keyBytes[i % keyBytes.length]);
    return toAlphaString(encrypted); // 转换成只包含 A-Z 的字符串
  }),
};

export const base64 = {
  encode: (str: string): string => Buffer.from(str).toString('base64'),
  decode: (str: string): string => Buffer.from(str, 'base64').toString('utf-8'),
};

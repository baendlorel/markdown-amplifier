import * as crypto from 'crypto';

/**
 * 通过 SHA-256 生成 32 字节密钥
 */
function deriveKey(key: string): Buffer {
  return crypto.createHash('sha256').update(key).digest();
}

/**
 * AES 加密（支持任意长度密钥）
 */
function encrypt(text: string, key: string): string {
  const algorithm = 'aes-256-cbc';
  const derivedKey = deriveKey(key); // 生成 32 字节密钥
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(algorithm, derivedKey, iv);

  const encryptedBuffer = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);

  return iv.toString('hex') + ':' + encryptedBuffer.toString('hex');
}

/**
 * AES 解密
 */
function decrypt(encryptedText: string, key: string): string {
  const algorithm = 'aes-256-cbc';
  const derivedKey = deriveKey(key); // 生成 32 字节密钥
  const parts = encryptedText.split(':');
  const iv = Buffer.from(parts[0], 'hex');
  const encryptedData = Buffer.from(parts[1], 'hex');

  const decipher = crypto.createDecipheriv(algorithm, derivedKey, iv);
  const decryptedBuffer = Buffer.concat([decipher.update(encryptedData), decipher.final()]);

  return decryptedBuffer.toString('utf8');
}

export const cryptor = { encrypt, decrypt };

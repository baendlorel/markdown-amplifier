import * as zlib from 'zlib';
import * as fs from 'fs';

// 压缩函数
export const compress = (input: string, outputFilePath: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const brotliCompress = zlib.createBrotliCompress({
      params: {
        [zlib.constants.BROTLI_PARAM_QUALITY]: 1, // 最高压缩级别
        [zlib.constants.BROTLI_PARAM_LGWIN]: 22, // 4 MB 窗口
        [zlib.constants.BROTLI_PARAM_MODE]: zlib.constants.BROTLI_MODE_TEXT, // 文本模式
        [zlib.constants.BROTLI_PARAM_SIZE_HINT]: Buffer.byteLength(input), // 输入数据大小提示
      },
    });
    const writeStream = fs.createWriteStream(outputFilePath);
    const buffer = Buffer.from(input);
    brotliCompress.pipe(writeStream).on('finish', resolve).on('error', reject);
    brotliCompress.end(buffer);
  });
};

// 解压函数
export const decompress = (inputFilePath: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const brotliDecompress = zlib.createBrotliDecompress();
    const chunks: Buffer[] = [];

    fs.createReadStream(inputFilePath)
      .pipe(brotliDecompress)
      .on('data', (chunk) => chunks.push(chunk))
      .on('end', () => {
        const d = Buffer.concat(chunks);
        resolve(d.toString());
      })
      .on('error', reject);
  });
};

// 压缩函数
export const compressSync = (input: string, outputFilePath: string) => {
  const brotliCompress = zlib.brotliCompressSync(input, {
    params: {
      [zlib.constants.BROTLI_PARAM_QUALITY]: 1, // 最高压缩级别
      [zlib.constants.BROTLI_PARAM_LGWIN]: 22, // 4 MB 窗口
      [zlib.constants.BROTLI_PARAM_MODE]: zlib.constants.BROTLI_MODE_TEXT, // 文本模式
      [zlib.constants.BROTLI_PARAM_SIZE_HINT]: Buffer.byteLength(input), // 输入数据大小提示
    },
  });
  fs.writeFileSync(outputFilePath, brotliCompress);
};

// 解压函数
export const decompressSync = (inputFilePath: string) => {
  const content = fs.readFileSync(inputFilePath);
  return zlib.brotliDecompressSync(content).toString();
};

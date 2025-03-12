export * from './argv';
export * from './logger';
export * from './configs';
export * from './locale';
export * from './utils';
export * from './cryptor';
console.log(global.idx === undefined ? (global.idx = 0) : global.idx++, __filename);

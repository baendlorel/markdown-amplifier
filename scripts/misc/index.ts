export * from './logger';
export * from './configs';
export * from './locale';
export * from './utils';

// 一些常用的单独导出的函数
export const ii = (i18nConfig: any) => i18nConfig[global.configs.locale];

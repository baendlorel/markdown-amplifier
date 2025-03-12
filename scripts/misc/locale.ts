/**
 * @name Locale
 * @description
 * 无依赖
 */
//// console.log(global.idx === undefined ? (global.idx = 1) : ++global.idx, __filename);

const createLocaleManager = () => {
  // 这里的定义和argv里一样
  const LOCALE_ZH = '--zh';
  const LOCALE_EN = '--en';

  let locale = 'zh' as 'zh' | 'en';

  // 先看参数里有没有
  if (process.argv.includes(LOCALE_ZH)) {
    locale = 'zh';
  } else if (process.argv.includes(LOCALE_EN)) {
    locale = 'en';
  } else {
    // 如果没有参数，再从系统中获取
    const systemLocale = Intl.DateTimeFormat().resolvedOptions().locale;
    if (systemLocale.slice(0, 2) === 'zh') {
      locale = 'zh';
    } else {
      locale = 'en';
    }
  }

  const i = <T>(zh: T, en: T): T => {
    switch (locale) {
      case 'zh':
        return zh;
      case 'en':
        return en;
      default:
        const a: never = locale;
        return '[LOCALE_ERROR]' as T;
    }
  };

  return { i };
};

export const { i } = createLocaleManager();

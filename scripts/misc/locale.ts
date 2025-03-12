/**
 * @name Locale
 * @description
 * 无依赖
 */
console.log(global.idx === undefined ? (global.idx = 0) : global.idx++, __filename);

const createLocaleManager = () => {
  let locale = 'zh' as 'zh' | 'en';
  // 先看参数里有没有
  if (process.argv.includes('--en')) {
    locale = 'en';
  } else if (process.argv.includes('--zh')) {
    locale = 'zh';
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

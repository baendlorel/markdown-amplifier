/**
 * @name Locale
 * @description
 * 无依赖
 */
//// console.log(global.idx === undefined ? (global.idx = 1) : ++global.idx, __filename);

export const { i, setLocale } = (() => {
  let _locale = 'zh' as 'zh' | 'en';

  // 初值从系统中获取
  const systemLocale = Intl.DateTimeFormat().resolvedOptions().locale;
  if (systemLocale.slice(0, 2) === 'zh') {
    _locale = 'zh';
  } else {
    _locale = 'en';
  }

  const i = <T>(zh: T, en: T): T => {
    switch (_locale) {
      case 'zh':
        return zh;
      case 'en':
        return en;
      default:
        const a: never = _locale;
        return '[LOCALE_ERROR]' as T;
    }
  };

  const setLocale = (locale: string) => {
    switch (locale) {
      case 'zh':
        _locale = 'zh';
        break;
      case 'en':
        _locale = 'en';
        break;
      default:
        _locale = 'en';
        break;
    }
  };

  return { i, setLocale };
})();

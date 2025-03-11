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

  const i = (zh: any, en: any) => {
    switch (locale) {
      case 'zh':
        return zh;
      case 'en':
        return en;
      default:
        const a: never = locale;
        return '[LOCALE_ERROR]';
    }
  };

  return { i };
};

export const { i } = createLocaleManager();

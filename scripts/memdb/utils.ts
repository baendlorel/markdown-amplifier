export const base64 =
  typeof Buffer !== 'undefined'
    ? {
        encode: (input: string) => Buffer.from(input, 'utf-8').toString('base64'),
        decode: (base64: string) => Buffer.from(base64, 'base64').toString('utf-8'),
      }
    : {
        encode: (input: string) => btoa(encodeURIComponent(input)),
        decode: (base64: string) => decodeURIComponent(atob(base64)),
      };

/**
 * 从toString后的函数字符串重建函数 \
 * Rebuild the function from the string after toString
 * @param funcStr
 * @returns
 */
export const recreateFunction = (funcStr: string): Function => {
  funcStr = funcStr.trim();
  // 一般函数都这么开头
  // General functions start like this
  if (funcStr.startsWith('(') || funcStr.startsWith('function')) {
    return new Function('return ' + funcStr)();
  }

  // class的静态方法和class实例的方法，需要手动添加function开头
  // The static methods of a class and the instance methods of a class need to be manually prefixed with the function keyword
  if (funcStr.replace(/^\w+/g, '').startsWith('(')) {
    return new Function('return function ' + funcStr)();
  }

  // 目前没有发现函数toString的其他情形，大概率构造不出来
  console.error(`[MemDB] Might be an invalid function string: ${funcStr}`);
  return new Function('return function ' + funcStr)();
};

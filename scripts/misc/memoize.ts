type Fn<T extends any[], R> = (...args: T) => R;
/**
 * 缓存函数结果
 * @param fn 要缓存的函数
 * @returns 带缓存功能的函数
 */
export const memoize = <T extends any[], R>(fn: Fn<T, R>): Fn<T, R> => {
  const cache = new Map<string, R>();

  return (...args: T): R => {
    // 将参数序列化以支持多个参数
    const key = args.reduce((prev, current) => prev + '_' + String(current), '');
    if (cache.has(key)) {
      return cache.get(key)!; // `!` 表示断言，告诉 TS 这里一定有值
    } else {
      const result = fn(...args);
      cache.set(key, result);
      return result;
    }
  };
};

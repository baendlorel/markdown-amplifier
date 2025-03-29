所有用到类型判定的地方

- types.ts
  - getType 返回[s,n,b,D,null]，不符合就<b style="color:red">报错</b>
- checkers.ts
  - sameDefaultGetter 判定[s,n,b,o(D),o(null),f]
  - isValue 判定[s,n,b,o(D),o(null)]
- index.ts
  - save 判断 defaultValue 是什么类型，转化为 base64 字符串[s,n,b,o(D),f]
  - save 判断 defaultGetter 是什么类型并记录[s,n,b,o(D),f]
  - load 重构 defaultGetter 判断[s,n,b,D,f]
  - load 加载 data，判定[s,n,b,D]，null 会自动被 JSON.parse 处理掉

那么如果默认值为 null 或返回 null 的函数，则 nullable 必须为 true，然后忽略 defaultGetter

export type RuleFlag =
  | 'h'
  | 'theorem'
  | 'lemma'
  | 'corollary'
  | 'proposition'
  | 'definition'
  | 'axiom'
  | 'case'
  | 'subcase'
  | 'subsubcase';

export type GroupName = 'h' | 'theorem' | 'definition' | 'axiom' | 'case';

export type MatchRule = {
  /**
   * 表示本规则匹配了什么 \
   * Indicates what this rule matches
   */
  flag: RuleFlag;

  /**
   * 关键字，可能是中文或英文 \
   * Keyword, may be Chinese or English
   */
  keyword: string;

  /**
   * 规则组，一般和tag相同，但theorem、lemma、corollary、proposition是都属于theorem \
   * Rule name. Usually the same as keyword, but theorem, lemma, corollary, proposition are all belong to 'theorem'
   */
  group: GroupName;

  /**
   * 用于匹配的关键字的正则表达式 \
   * Regular expression used for keyword matching
   */
  regex: RegExp;

  /**
   * 用于匹配HTML元素中id内容的正则表达式 \
   * Regular expression used to match the id content in HTML elements
   */
  idRegex: RegExp;

  /**
   * 将编号数组格式化为标准的字符串 \
   * @param no 编号数组
   * @returns 格式化后的字符串，将会替换原有的关键字
   */
  format: (no: number[]) => string;
};

export type MatchResult = {
  /**
   * 正则匹配得到的第一个匹配项 \
   * The first matched string obtained by regular matching
   */
  str: string;

  /**
   * 是匹配的项的下标 \
   * Index of the matched rule
   */
  index: number;

  /**
   * 使用的规则 \
   * Rule used
   */
  rule: MatchRule;
};

// --- 倒排索引实现 by claude sonnet 4.5 ---

/**
 * 倒排索引 —— 多对多版本
 * 
 * 多对多即: 多个input可输出一个output，一个input也可输出多个output
 */
export class ReverseIndexDB {
  // 倒排索引: 字符 -> 包含该字符的文档集合 Map<input, ...>
  private index: Map<string, Set<string>> = new Map();
  // 文档存储: Map<output, 所有input>
  private documents: Map<string, Set<string>> = new Map();
  // 存储 query -> {output, name} 的映射
  private queryMapping: Map<string, Array<{output: string, name: string}>> = new Map();

  /**
   * 添加文档
   * @param query input, 可去检索的（如拼音、模糊音等）
   * @param output output, id, 可重复
   * @param name 名称，不和output绑定，与query对应
   */
  add(query: string, output: string, name: string) {
    // 1. 将 query 添加到 output 的关联集合中
    if (!this.documents.has(output)) {
      this.documents.set(output, new Set());
    }
    this.documents.get(output)!.add(query);
    
    // 2. 存储 query -> {output, name} 的映射
    if (!this.queryMapping.has(query)) {
      this.queryMapping.set(query, []);
    }
    this.queryMapping.get(query)!.push({output, name});
    
    // 3. 为每个字符建立索引，指向 query（而不是output）
    for (const char of query) {
      if (!this.index.has(char)) {
        this.index.set(char, new Set());
      }
      this.index.get(char)!.add(query);
    }
  }

  /**
   * 模糊搜索: 支持子序列匹配
   * @param query 查询关键词（如 "认可"）
   * @returns 匹配的 output 列表（如 ["👍", "👏"]）
   */
  search(query: string): Array<{output: string, name: string}> {
    // 去除空格，提取关键字符
    const chars = query.replace(/\s+/g, '').split('');
  
    if (chars.length === 0) return [];

    // 1. 找出包含第一个字符的所有候选 query
    let candidates = this.index.get(chars[0]);
    if (!candidates || candidates.size === 0) return [];

    // 2. 对每个候选 query，检查是否匹配子序列
    const results: Array<{output: string, name: string}> = [];
    const seen = new Set<string>(); // 用于去重
    
    for (const candidateQuery of candidates) {
      if (this.isSubsequence(chars, candidateQuery)) {
        // 获取该 query 对应的所有 {output, name}
        const mappings = this.queryMapping.get(candidateQuery) || [];
        for (const mapping of mappings) {
          const key = `${mapping.output}|${mapping.name}`;
          if (!seen.has(key)) {
            seen.add(key);
            results.push(mapping);
          }
        }
      }
    }

    return results;
  }

  /**
   * 检查 chars 是否为 text 的子序列
   */
  private isSubsequence(chars: string[], text: string): boolean {
    let charIndex = 0;
    for (const char of text) {
      if (char === chars[charIndex]) {
        charIndex++;
        if (charIndex === chars.length) return true;
      }
    }
    return charIndex === chars.length;
  }

  /**
   * 获取某个 output 的所有关联信息
   */
  getDetailsByOutput(output: string): Array<{query: string, name: string}> {
    const results: Array<{query: string, name: string}> = [];
    for (const [query, mappings] of this.queryMapping.entries()) {
      for (const mapping of mappings) {
        if (mapping.output === output) {
          results.push({query, name: mapping.name});
        }
      }
    }
    return results;
  }

  /** 使用示例 */
  static demo() {
    const emojiEngine = new ReverseIndexDB();
    
    // query 和 output 和 name 都是多对多关系
    emojiEngine.add('renke', '👍', '认可');
    emojiEngine.add('rk', '👍', '认可');
    emojiEngine.add('diantou', '👍', '点头');
    emojiEngine.add('dt', '👍', '点头');
    emojiEngine.add('tongyi', '👍', '同意');
    
    // 一个 query 也可以关联多个 output
    emojiEngine.add('renke', '👏', '认可');
    emojiEngine.add('rk', '👏', '认可');
    emojiEngine.add('guzhang', '👏', '鼓掌');
    
    emojiEngine.add('kaixin', '😊', '开心');
    emojiEngine.add('weixiao', '😊', '微笑');

    console.log('demo: ReverseIndexDB, search "renke":', emojiEngine.search('renke')); 
    // [{output: '👍', name: '认可'}, {output: '👏', name: '认可'}]
    
    console.log('demo: ReverseIndexDB, search "rk":', emojiEngine.search('rk')); 
    // [{output: '👍', name: '认可'}, {output: '👏', name: '认可'}]
    
    console.log('demo: ReverseIndexDB, search "dt":', emojiEngine.search('dt'));     
    // [{output: '👍', name: '点头'}]
    
    console.log('demo: ReverseIndexDB, search "gu":', emojiEngine.search('gu'));     
    // [{output: '👏', name: '鼓掌'}]
    
    console.log('demo: ReverseIndexDB, search "k":', emojiEngine.search('k'));       
    // [{output: '😊', name: '开心'}, {output: '👍', name: '认可'}, {output: '👏', name: '认可'}]
    
    console.log('demo: ReverseIndexDB, value 👍 find details:', emojiEngine.getDetailsByOutput('👍')); 
    // [{query: 'renke', name: '认可'}, {query: 'rk', name: '认可'}, {query: 'diantou', name: '点头'}, {query: 'dt', name: '点头'}, {query: 'tongyi', name: '同意'}]
  }
}

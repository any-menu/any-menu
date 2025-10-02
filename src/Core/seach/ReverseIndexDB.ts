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

  /**
   * 添加文档
   * @param query input, 可去检索的
   * @param output output, id, 可重复
   */
  add(query: string, output: string) {
    // 1. 将 query 添加到 output 的关联集合中
    if (!this.documents.has(output)) {
      this.documents.set(output, new Set());
    }
    this.documents.get(output)!.add(query);
    
    // 2. 为每个字符建立索引，指向 output
    for (const char of query) {
      if (!this.index.has(char)) {
        this.index.set(char, new Set());
      }
      this.index.get(char)!.add(output);
    }
  }

  /**
   * 模糊搜索: 支持子序列匹配
   * @param query 查询关键词（如 "认可"）
   * @returns 匹配的 output 列表（如 ["👍", "👏"]）
   */
  search(query: string): string[] {
    // 去除空格，提取关键字符
    const chars = query.replace(/\s+/g, '').split('');
  
    if (chars.length === 0) return [];

    // 1. 找出包含第一个字符的所有候选 output
    let candidates = this.index.get(chars[0]);
    if (!candidates || candidates.size === 0) return [];

    // 2. 对每个候选 output，检查其所有关联的 query
    const results: string[] = [];
    for (const output of candidates) {
      const queries = this.documents.get(output)!;
      // 检查是否有任何一个 query 匹配子序列
      for (const docQuery of queries) {
        if (this.isSubsequence(chars, docQuery)) {
          results.push(output);
          break; // 找到一个匹配就够了
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
   * 获取某个 output 的所有关联 query
   */
  getQueries(output: string): string[] {
    return Array.from(this.documents.get(output) || []);
  }

  /** 使用示例 */
  static demo() {
    const emojiEngine = new ReverseIndexDB();
    
    // 多个 query 指向同一个 output
    emojiEngine.add('认可', '👍');
    emojiEngine.add('点头', '👍');
    emojiEngine.add('同意', '👍');
    
    // 一个 query 也可以关联多个 output
    emojiEngine.add('认可', '👏');
    emojiEngine.add('鼓掌', '👏');
    
    emojiEngine.add('开心', '😊');
    emojiEngine.add('微笑', '😊');

    console.log('demo: TrieDB, search "认可":', emojiEngine.search('认可')); // ['👍', '👏']
    console.log('demo: TrieDB, search "点头":', emojiEngine.search('点头')); // ['👍']
    console.log('demo: TrieDB, search "鼓":', emojiEngine.search('鼓'));     // ['👏']
    console.log('demo: TrieDB, search "开":', emojiEngine.search('开'));     // ['😊']
    
    console.log('demo: TrieDB, value 👍 find key:', emojiEngine.getQueries('👍')); // ['认可', '点头', '同意']
  }
}

// --- 倒排索引实现 by claude sonnet 4.5 ---

/**
 * 倒排索引
 * 
 * key是唯一的, value serach key
 */
export class ReverseIndexDB {
  // 倒排索引: 字符 -> 包含该字符的文档集合
  private index: Map<string, Set<string>> = new Map();
  // 文档存储
  private documents: Map<string, string> = new Map();

  /**
   * 添加文档
   * @param query input, 可去检索的
   * @param output output, id, 唯一的, 不可重复
   */
  add(query: string, output: string) {
    this.documents.set(output, query);
    
    // 为每个字符建立索引
    for (const char of query) {
      if (!this.index.has(char)) {
        this.index.set(char, new Set());
      }
      this.index.get(char)!.add(output);
    }
  }

  /**
   * 模糊搜索: 支持子序列匹配
   * @param query 查询关键词（如 "物 和 然"）
   * @returns 匹配的文档ID列表
   */
  search(query: string): string[] {
    // 去除空格，提取关键字符
    const chars = query.replace(/\s+/g, '').split('');
  
    if (chars.length === 0) return [];
    console.log(`Fuzzy search flag2`);

    // 1. 找出包含第一个字符的所有文档
    let candidates = this.index.get(chars[0]);
    if (!candidates || candidates.size === 0) return [];
    console.log(`Fuzzy search flag3`);

    // 2. 对每个候选文档，验证是否包含子序列
    const results: string[] = [];
    for (const docId of candidates) {
      const content = this.documents.get(docId)!;
      if (this.isSubsequence(chars, content)) {
        results.push(docId);
      }
    }

    console.log(`Fuzzy search for "${query}" found ${results.length} results.`);
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

  static test() {
    // 使用示例
    const fuzzyEngine = new ReverseIndexDB();
    fuzzyEngine.add('动物和自然', 'doc1');
    fuzzyEngine.add('植物与生态', 'doc2');

    console.log(fuzzyEngine.search('物 和 然')); // ['doc1']
    console.log(fuzzyEngine.search('物 生')); // ['doc2']
  }
}

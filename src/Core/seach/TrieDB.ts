// --- 前缀树实现 by gemini 2.5 pro ---

/** 前缀树节点
 */
export class TrieNode {
  // 子节点
  children: Map<string, TrieNode> = new Map();
  // 是否为某个key的结尾
  isEndOfWord: boolean = false;
  // 关联的value (因为key允许重复，所以用数组存储)
  values: string[] = [];
}

// 前缀树
export class TrieDB {
  root: TrieNode = new TrieNode();

  /**
   * 插入一个键值对
   * @param input key input 可重复插入 (重复会自动合并)
   * @param output value output
   */
  insert(input: string, output: string) {
    let node = this.root;
    for (const char of input) {
      if (!node.children.has(char)) {
        node.children.set(char, new TrieNode());
      }
      node = node.children.get(char)!;
    }
    node.isEndOfWord = true;
    // 避免为同一个 key 添加重复的 value
    if (!node.values.includes(output)) {
      node.values.push(output);
    }
  }

  /**
   * 查找具有给定前缀的节点
   * @param prefix 
   * @returns 
   */
  findPrefixNode(prefix: string): TrieNode | null {
    let node = this.root;
    for (const char of prefix) {
      if (node.children.has(char)) {
        node = node.children.get(char)!;
      } else {
        return null; // 前缀不存在
      }
    }
    return node;
  }

  static demo() {
    const trie = new TrieDB();
    // 一对多
    trie.insert("app", "应用");
    trie.insert("app", "应用2");

    // 多对一
    trie.insert("apple", "苹果");
    trie.insert("apricot", "苹果");

    const result = trie.findPrefixNode("ap");
    console.log("demo: TrieDB, search 'ap':", result);
  }
}

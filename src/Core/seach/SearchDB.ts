import type { AMSearch } from '../seach/index'
import { Trie } from './Trie'

/** 核心数据库
 * 
 * 内容交给别的模块来初始化
 * 
 * 支持多层索引方式
 * - Trie树 (前缀树)，用于前缀匹配。对于输入法场景，这是最完美且高效的
 * - 倒排索引，用于模糊匹配
 * - 哈希表，用于精确匹配
 * - 分词辅助 (可选)
 * - 后缀树: 不采用，占用太多
 * 
 * 在app环境中，这里仅临时使用，后续最好还是交给Rust来实现
 */
class SearchDB {
  trie: Trie
  reverse: any
  hash: any
  // 全局的 AMSearch 实例 (仅单例模式下有用，如果场景有多个AMSeach，此处应该恒为null)
  el_search: AMSearch | null = null

  limit: number = 50 // 限制返回结果数量

  constructor() {
    this.trie = new Trie()
  }

  /** 构造前缀树
   * str是使用tab分割的kv对，key允许重复
   * @param str csv字符串 (每行格式为 ${key}\t${value}) 
   */
  init_trie_by_csv(str: string) {
    // const lines = str.split('\n').filter(line => {
    //   return line.trim() !== '' && !line.startsWith('#') // 过滤空行和注释行
    // })
    // for (const line of lines) {
    //   const parts = line.split('\t')
    //   if (parts.length === 2) {
    //     const [key, value] = parts
    //     this.trie.insert(key, value)
    //   }
    // }
  }

  // 前缀查询
  query_by_trie(query: string) {
    // const results: string[] = [];
    // const startNode = this.trie.findPrefixNode(query);

    // // 如果前缀不存在，返回空数组
    // if (!startNode) return results

    // // 使用深度优先搜索（DFS）来收集所有结果
    // const collect = (node: TrieNode) => {
    //   // 如果已达到限制，则停止收集
    //   if (results.length >= this.limit) return

    //   // 如果是单词结尾，将其关联的values添加到结果中
    //   if (node.isEndOfWord) {
    //     for (const val of node.values) {
    //         if (results.length < this.limit && !results.includes(val)) {
    //             results.push(val)
    //         }
    //     }
    //   }

    //   // 递归访问所有子节点
    //   for (const childNode of node.children.values()) {
    //     collect(childNode)
    //     if (results.length >= this.limit) {
    //       return // 提前退出
    //     }
    //   }
    // }
  }
}

export const SEARCH_DB: SearchDB = new SearchDB()

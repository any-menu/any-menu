/** 核心搜索数据库，内置多种子搜索索引方式 */

import type { AMSearch } from '../seach/index'
import { global_setting } from '../Setting'
import { TrieDB, type TrieNode } from './TrieDB'
import { ReverseIndexDB } from './ReverseIndexDB'
import pinyin from 'pinyin'

/** 核心数据库
 * 
 * 单例，内置多种搜索索引方式
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
 * 
 * - TODO 支持后端数据库，以增强性能
 * - TODO 生成 cache 文件，以加速启动
 */
class SearchDB {
  trie: TrieDB // 前缀树
  reverse: ReverseIndexDB // FuzzySearchEngine
  hash: undefined
  // 全局的 AMSearch 实例 (仅单例模式下有用，如果场景有多个AMSeach，此处应该恒为null)
  el_search: AMSearch | null = null

  limit: number = 50 // 限制返回结果数量

  constructor() {
    // if (global_setting.config.search_engine == 'trie') {
    //   this.trie = new TrieDB()
    // } else if (global_setting.config.search_engine == 'reverse') {
    //   this.reverse = new ReverseIndexDB()
    // } else {
    //   console.error(`未知的搜索引擎类型: ${global_setting.config.search_engine}`)
    // }
    this.trie = new TrieDB()
    this.reverse = new ReverseIndexDB()

    // debug时，用demo判断引擎是否正常
    if (global_setting.isDebug) {
      TrieDB.demo()
      ReverseIndexDB.demo()
    }
  }

  /** 构造前缀树
   * str是使用tab分割的kv对，key允许重复
   * @param str csv字符串 (每行格式为 ${key}\t${value}) 
   */
  add_data_by_csv(str: string, path?: string) {
    const lines = str.split(/\r?\n/).filter(line => {
      return line.trim() !== '' && !line.startsWith('#') // 过滤空行和注释行
    })

    const json: {key: string, value: string}[] = []
    for (const line of lines) {
      const parts = line.split('\t')
      if (parts.length != 2) continue // 过滤非法行
      json.push({ key: parts[0], value: parts[1] })
    }

    this.add_data_by_json(json, path)
  }

  /** 构造前缀树
   * json是 {key: <input>, value: <output>}[] 对象，允许多对多
   */
  add_data_by_json(
    json: {key: string, value: string}[],
    path?: string
  ) {
    for (const item of json) {
      // 多keys
      const keys: string[] = []

      // 1. 常规key + 显示名 (显示名是为了不显示错字/混淆音/模糊音/拼音/缩写等增强检索)
      // if (typeof item.key !== 'string' || item.key.trim() === '') {
      //   console.warn("Skip empty key_item:", key, item, json)
      //   continue
      // }
      const key = (path === undefined) ? item.key : `[${path}] ${item.key}`
      keys.push(item.key)

      // 2. 路径key
      if (path !== undefined) {
        const key_path: string = path
        keys.push(key_path)
      }

      // 3. 拼音key
      // 有中文不一定就有拼音。其范围不一定和拼音库的范围相符合（他两可能采用了不同的汉字字标范围，如是否包含某些扩展区）
      const has_chinese = /[\u4e00-\u9fa5]/.test(key)

      // 3.1. 全拼音key
      if (has_chinese && global_setting.config.pinyin_index) {
        const key_pinyin: string = pinyin(key, {
          style: pinyin.STYLE_NORMAL, // 普通风格，不带声调
          heteronym: false, // 不返回多音字的所有读音
          segment: false // 不使用分词
        }).join('')
        keys.push(key_pinyin)
      }

      // 3.2. 拼音首字母key
      if (has_chinese && global_setting.config.pinyin_first_index) {
        const key_first_pinyin: string = pinyin(key, {
          style: pinyin.STYLE_FIRST_LETTER, // 首字母风格
          heteronym: false,
          segment: false
        }).join('')
        keys.push(key_first_pinyin)
      }

      // 填入搜索索引
      // 塞同一前缀树还是分别塞？分别塞的好处
      // 塞多个的话，按分类塞还是按属性(显示/路径/拼音/首拼音)塞
      // - 塞同一个:
      //   - 好处是全部按匹配相关度排序，而不需要分别检索后合并再排序。汉字和拼音感觉适合这种
      // - 分别塞: (暂不支持)
      //   - 好处是可以各自限额，避免某一类似匹配项过多覆盖其他类型
      //   - 可以搜索前限制在哪个类型里搜索
      // 
      // TODO 不支持 "显示名"，后续再改。前缀树不打算支持这功能，比较麻烦，感觉用倒排索引更合适
      if (global_setting.config.search_engine == 'trie') {
        for (const key_item of keys) {
          this.trie.insert(key_item, item.value)
        }
      } else if (global_setting.config.search_engine == 'reverse') {
        for (const key_item of keys) {
          this.reverse.add(key_item, item.value)
        }
      } else {
        console.error(`未知的搜索引擎类型: ${global_setting.config.search_engine}`)
      }
    }
  }

  /** 前缀查询
   * @return 返回 {完整字符串, 值} 数组
   */
  query_by_trie(query: string): {key: string, value: string}[] {
    const results: {key: string, value: string}[] = [];
    const startNode = this.trie.findPrefixNode(query);

    // 如果前缀不存在，返回空数组
    if (!startNode) return results

    // 使用深度优先搜索（DFS）来收集所有结果
    const collect = (node: TrieNode, currentKey: string) => {
      if (results.length >= this.limit) return results // limit

      // 如果是单词结尾，将其关联的 key/value 对添加到结果中
      if (node.isEndOfWord) {
        for (const val of node.values) {
          if (results.length >= this.limit) break // limit
          results.push({ key: currentKey, value: val })
        }
      }

      // 递归访问所有子节点
      for (const [char, childNode] of node.children.entries()) {
        if (results.length >= this.limit) return // limit

        // 将当前字符追加到 key 上，然后继续递归
        collect(childNode, currentKey + char)
      }
    }

    collect(startNode, query)
    return results
  }

  query_by_reverse(query: string): {key: string, value: string}[] {
    return this.reverse.search(query)
      .slice(0, this.limit)
      .map((item: string) => { return { "value": item, "key": "" } } )
  }
}

export const SEARCH_DB: SearchDB = new SearchDB()

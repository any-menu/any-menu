/** 核心搜索数据库，内置多种子搜索索引方式 */

import { global_setting } from '../../setting'
import { TrieDB, type TrieNode } from './TrieDB'
import { ReverseIndexDB } from './ReverseIndexDB'

/** 核心数据库
 * 
 * 单例，内置多种搜索索引方式
 * 
 * 内容交给别的模块来初始化
 * 
 * ## 支持多层索引方式
 * 
 * - Trie树 (前缀树)，用于前缀匹配。对于输入法场景，这是最完美且高效的
 * - 倒排索引，用于模糊匹配
 * - 哈希表，用于精确匹配。但感觉适用性不是很高，没啥应用场景
 * - 分词辅助 (可选)
 * - 后缀树: 不采用，占用太多
 * 
 * 此外，不同的索引方式需要建立不同的索引数据库，所以并不会都同时启用。
 * 而是根据设置启用其中的某个索引方式，建立对应的索引数据库。以节约内存资源和提高性能。
 * 
 * ## 补充
 * 
 * 在app环境中，这里仅临时使用，后续最好还是交给Rust来实现
 * 
 * - TODO 支持后端数据库，以增强性能
 * - TODO 生成 cache 文件，以加速启动
 */
class SearchDB {
  trie: TrieDB // 前缀树搜索引擎
  reverse: ReverseIndexDB     // 模糊搜索搜索引擎 FuzzySearchEngine
  hash: undefined             // (未支持) 哈希搜索引擎。主要是哈希要全量匹配，适用性一般不是很高

  pinyin?: {
    // 函数调用
    (text: string, options: {
      style: number;
      heteronym: boolean;
      segment: boolean;
    }): any[]; // pinyin 默认返回 string[][], any[] 也行
    
    // 静态常量属性 (在 pinyin 库中它们的值是 number 类型)
    STYLE_NORMAL: number;
    STYLE_FIRST_LETTER: number;
  }

  static factory() {
    return new SearchDB()
  }

  private constructor() {
    // if (global_setting.config.search_engine == 'trie') {
    //   this.trie = new TrieDB()
    // } else if (global_setting.config.search_engine == 'reverse') {
    //   this.reverse = new ReverseIndexDB()
    // } else {
    //   console.error(`未知的搜索引擎类型: ${global_setting.config.search_engine}`)
    // }
    this.trie = new TrieDB()
    this.reverse = new ReverseIndexDB()

    // 暂时可手动注释此处以强制禁用拼音功能
    import('pinyin').then(({ default: pinyin }) => {
      this.pinyin = pinyin
    }).catch(_err => {
      console.info("No use pinyin features.")
    })

    // debug时，用demo判断引擎是否正常
    if (global_setting.isDebug) {
      TrieDB.demo()
      ReverseIndexDB.demo()
    }
  }

  /** 填充数据库内容
   * 
   * @param json
   *   {
   *     key: 输入查询字符串,
   *     name?: 显示名, 如不存在则使用原始主 key。
   *       用于不显示的错字/混淆音/模糊音/拼音/缩写等增强检索
   *     value: 脚本的命令id。当应用该项时不会输出文本，而是执行该命令id对应的脚本
   *       脚本会使用标志符与输出文本区分开: "@am-script:xxx"
   *   }
   */
  add_data_by_script(
    json: {id: string, key: string, name?: string, value: string},
  ) {
    this.add_data([`/${json.key}`], `@am-script: ${json.id}`, json.name ?? json.key)
  }

  /** 填充数据库内容
   * 
   * @param str csv字符串
   *   每行格式: ${key}\t${value}
   *   str是使用tab分割的kv对，key允许重复
   */
  add_data_by_csv(
    str: string,
    path?: string
  ) {
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

  /** 填充数据库内容
   * 
   * @param json
   *   {
   *     key: 输入查询字符串,
   *     name?: 显示名, 如不存在则使用原始主 key。
   *       用于不显示的错字/混淆音/模糊音/拼音/缩写等增强检索
   *     value: 输出内容,
   *   }[]
   * @param path 可选的路径信息。支持通过文件名匹配其内部的所有项
   */
  add_data_by_json(
    json: {key: string, name?: string, value: string}[],
    path?: string
  ) {
    for (const item of json) {
      // 1. 多keys。决定了你可以使用哪些关键字搜索到 value
      const keys: string[] = []
      let name = (item.name === undefined) ? item.key : item.name // 显示名
      let key = item.key // 主 key

      // 1.1. 常规key + 路径key, 或可能作为显示名 (显示名是为了不显示错字/混淆音/模糊音/拼音/缩写等增强检索)
      // if (typeof item.key !== 'string' || item.key.trim() === '') {
      //   console.warn("Skip empty key_item:", key, item, json)
      //   continue
      // }
      if (path === undefined) { // 无路径
        keys.push(item.key)
      } else { // 有路径
        if (global_setting.config.search_engine === 'reverse') { // 倒排索引将路径塞入key
          keys.push(`[${path}] ${key}`)
        } else if (global_setting.config.search_engine === 'trie') { // 前缀树要单独塞路径
          keys.push(key)
          keys.push(path)
        } else {
          console.error(`未知的搜索引擎类型: ${global_setting.config.search_engine}`)
          return
        }
      }

      // 1.2. 拼音key
      // 有中文不一定就有拼音。其范围不一定和拼音库的范围相符合（他两可能采用了不同的汉字字标范围，如是否包含某些扩展区）
      if (this.pinyin != undefined) {
        const has_chinese = /[\u4e00-\u9fa5]/.test(key)

        // 全拼音key
        if (has_chinese && global_setting.config.pinyin_index) {
          const key_pinyin: string = this.pinyin(key, {
            style: this.pinyin.STYLE_NORMAL, // 普通风格，不带声调
            heteronym: false, // 不返回多音字的所有读音
            segment: false // 不使用分词
          }).join('')
          keys.push(key_pinyin)
        }

        // 拼音首字母key
        if (has_chinese && global_setting.config.pinyin_first_index) {
          const key_first_pinyin: string = this.pinyin(key, {
            style: this.pinyin.STYLE_FIRST_LETTER, // 首字母风格
            heteronym: false,
            segment: false
          }).join('')
          keys.push(key_first_pinyin)
        }
      }

      // 2. 填入搜索索引
      this.add_data(keys, item.value, name)
    }
  }

  /**
   * 填充数据库内容
   * 
   * @param keys: 输入查询字符串数组
   * @param value: 输出内容
   * @param name: 显示名。
   *   与 keys 不同的是，唯一，且不会显示的错字/混淆音/模糊音/拼音/缩写等增强检索
   */
  add_data(keys: string[], value: string, name: string) {
    // 塞同一前缀树还是分别塞？
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
        this.trie.insert(key_item, value)
      }
    } else if (global_setting.config.search_engine == 'reverse') {
      for (const key_item of keys) {
        this.reverse.add(key_item, value, name)
      }
    } else {
      console.error(`未知的搜索引擎类型: ${global_setting.config.search_engine}`)
    }
  }

  /** 查询
   * @return 返回 {完整字符串, 值} 数组
   */
  query(query: string): {key: string, value: string}[] {
    if (global_setting.config.search_engine === 'trie') {
      return this.query_by_trie(query)
    } else if (global_setting.config.search_engine === 'reverse') {
      return this.query_by_reverse(query)
    } else {
      console.error(`未知的搜索引擎类型: ${global_setting.config.search_engine}`)
      return []
    }
  }

  /** 前缀查询
   * @return 返回 {完整字符串, 值} 数组
   */
  private query_by_trie(query: string): {key: string, value: string}[] {
    const results: {key: string, value: string}[] = [];
    const startNode = this.trie.findPrefixNode(query);

    // 如果前缀不存在，返回空数组
    if (!startNode) return results

    // 使用深度优先搜索（DFS）来收集所有结果
    const collect = (node: TrieNode, currentKey: string) => {
      if (results.length >= global_setting.config.search_limit) return results // limit

      // 如果是单词结尾，将其关联的 key/value 对添加到结果中
      if (node.isEndOfWord) {
        for (const val of node.values) {
          if (results.length >= global_setting.config.search_limit) break // limit
          results.push({ key: currentKey, value: val })
        }
      }

      // 递归访问所有子节点
      for (const [char, childNode] of node.children.entries()) {
        if (results.length >= global_setting.config.search_limit) return // limit

        // 将当前字符追加到 key 上，然后继续递归
        collect(childNode, currentKey + char)
      }
    }

    collect(startNode, query)
    return results
  }

  /**
   * 以模糊匹配方式进行搜索
   * 
   * TODO 如果有几万数据，可能进行的优化：
   * - 异步操作: 并在查询过程中显示查询图标
   * - ~~分页/块查询~~: (做不到，没序列)
   * - 多引擎优化: 多个搜索引擎逐步返回
   * - 早退: 目前是先全量评分排序，然后显示时再做数量限制/分页。可以限制查询时数量限制 (有可能错过优质结果)
   * 
   * @return 返回 {完整字符串, 值} 数组
   */
  private query_by_reverse(query: string): {key: string, value: string}[] {
    return this.reverse.search(query)
      .slice(0, global_setting.config.search_limit)
      .map((item: {output: string, name: string}) => {
        return { "value": item.output, "key": item.name }
      } )
  }
}

export let SEARCH_DB: SearchDB
SEARCH_DB = SearchDB.factory()
export let SEARCH_DB_img: SearchDB // 图片/路径版本的数据库
SEARCH_DB_img = SearchDB.factory()

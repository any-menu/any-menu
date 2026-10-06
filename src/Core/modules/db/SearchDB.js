import { global_setting } from '../../shared/setting';
import { TrieDB } from './TrieDB';
import { ReverseIndexDB } from './ReverseIndexDB';
class SearchDB {
    static factory() {
        return new SearchDB();
    }
    constructor() {
        this.trie = new TrieDB();
        this.reverse = new ReverseIndexDB();
        import('pinyin').then(({ default: pinyin }) => {
            this.pinyin = pinyin;
        }).catch(_err => {
            console.info("No use pinyin features.");
        });
        if (global_setting.isDebug) {
            TrieDB.demo();
            ReverseIndexDB.demo();
        }
    }
    add_data_by_script(json) {
        var _a;
        this.add_data([`/${json.key}`], `@am-script: ${json.id}`, (_a = json.name) !== null && _a !== void 0 ? _a : json.key);
    }
    add_data_by_csv(str, path) {
        const lines = str.split(/\r?\n/).filter(line => {
            return line.trim() !== '' && !line.startsWith('#');
        });
        const json = [];
        for (const line of lines) {
            const parts = line.split('\t');
            if (parts.length != 2)
                continue;
            json.push({ key: parts[0], value: parts[1] });
        }
        this.add_data_by_json(json, path);
    }
    add_data_by_json(json, path) {
        for (const item of json) {
            const keys = [];
            let name = (item.name === undefined) ? item.key : item.name;
            let key = item.key;
            if (path === undefined) {
                keys.push(item.key);
            }
            else {
                if (global_setting.config.search_engine === 'reverse') {
                    keys.push(`[${path}] ${key}`);
                }
                else if (global_setting.config.search_engine === 'trie') {
                    keys.push(key);
                    keys.push(path);
                }
                else {
                    console.error(`未知的搜索引擎类型: ${global_setting.config.search_engine}`);
                    return;
                }
            }
            if (this.pinyin != undefined) {
                const has_chinese = /[\u4e00-\u9fa5]/.test(key);
                if (has_chinese && global_setting.config.pinyin_index) {
                    const key_pinyin = this.pinyin(key, {
                        style: this.pinyin.STYLE_NORMAL,
                        heteronym: false,
                        segment: false
                    }).join('');
                    keys.push(key_pinyin);
                }
                if (has_chinese && global_setting.config.pinyin_first_index) {
                    const key_first_pinyin = this.pinyin(key, {
                        style: this.pinyin.STYLE_FIRST_LETTER,
                        heteronym: false,
                        segment: false
                    }).join('');
                    keys.push(key_first_pinyin);
                }
            }
            this.add_data(keys, item.value, name);
        }
    }
    add_data(keys, value, name) {
        if (global_setting.config.search_engine == 'trie') {
            for (const key_item of keys) {
                this.trie.insert(key_item, value);
            }
        }
        else if (global_setting.config.search_engine == 'reverse') {
            for (const key_item of keys) {
                this.reverse.add(key_item, value, name);
            }
        }
        else {
            console.error(`未知的搜索引擎类型: ${global_setting.config.search_engine}`);
        }
    }
    query(query) {
        if (global_setting.config.search_engine === 'trie') {
            return this.query_by_trie(query);
        }
        else if (global_setting.config.search_engine === 'reverse') {
            return this.query_by_reverse(query);
        }
        else {
            console.error(`未知的搜索引擎类型: ${global_setting.config.search_engine}`);
            return [];
        }
    }
    query_by_trie(query) {
        const results = [];
        const startNode = this.trie.findPrefixNode(query);
        if (!startNode)
            return results;
        const collect = (node, currentKey) => {
            if (results.length >= global_setting.config.search_limit)
                return results;
            if (node.isEndOfWord) {
                for (const val of node.values) {
                    if (results.length >= global_setting.config.search_limit)
                        break;
                    results.push({ key: currentKey, value: val });
                }
            }
            for (const [char, childNode] of node.children.entries()) {
                if (results.length >= global_setting.config.search_limit)
                    return;
                collect(childNode, currentKey + char);
            }
        };
        collect(startNode, query);
        return results;
    }
    query_by_reverse(query) {
        return this.reverse.search(query)
            .slice(0, global_setting.config.search_limit)
            .map((item) => {
            return { "value": item.output, "key": item.name };
        });
    }
}
export let SEARCH_DB;
SEARCH_DB = SearchDB.factory();
export let SEARCH_DB_img;
SEARCH_DB_img = SearchDB.factory();

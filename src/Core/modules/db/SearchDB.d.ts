import { TrieDB } from './TrieDB';
import { ReverseIndexDB } from './ReverseIndexDB';
declare class SearchDB {
    trie: TrieDB;
    reverse: ReverseIndexDB;
    hash: undefined;
    pinyin?: {
        (text: string, options: {
            style: number;
            heteronym: boolean;
            segment: boolean;
        }): any[];
        STYLE_NORMAL: number;
        STYLE_FIRST_LETTER: number;
    };
    static factory(): SearchDB;
    private constructor();
    add_data_by_script(json: {
        id: string;
        key: string;
        name?: string;
        value: string;
    }): void;
    add_data_by_csv(str: string, path?: string): void;
    add_data_by_json(json: {
        key: string;
        name?: string;
        value: string;
    }[], path?: string): void;
    add_data(keys: string[], value: string, name: string): void;
    query(query: string): {
        key: string;
        value: string;
    }[];
    private query_by_trie;
    private query_by_reverse;
}
export declare let SEARCH_DB: SearchDB;
export declare let SEARCH_DB_img: SearchDB;
export {};

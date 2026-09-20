export declare class TrieNode {
    children: Map<string, TrieNode>;
    isEndOfWord: boolean;
    values: string[];
}
export declare class TrieDB {
    root: TrieNode;
    insert(input: string, output: string): void;
    findPrefixNode(prefix: string): TrieNode | null;
    static demo(): void;
}

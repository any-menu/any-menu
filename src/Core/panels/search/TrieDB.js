export class TrieNode {
    constructor() {
        this.children = new Map();
        this.isEndOfWord = false;
        this.values = [];
    }
}
export class TrieDB {
    constructor() {
        this.root = new TrieNode();
    }
    insert(input, output) {
        let node = this.root;
        for (const char of input) {
            if (!node.children.has(char)) {
                node.children.set(char, new TrieNode());
            }
            node = node.children.get(char);
        }
        node.isEndOfWord = true;
        if (!node.values.includes(output)) {
            node.values.push(output);
        }
    }
    findPrefixNode(prefix) {
        let node = this.root;
        for (const char of prefix) {
            if (node.children.has(char)) {
                node = node.children.get(char);
            }
            else {
                return null;
            }
        }
        return node;
    }
    static demo() {
        const trie = new TrieDB();
        trie.insert("app", "应用");
        trie.insert("app", "应用2");
        trie.insert("apple", "苹果");
        trie.insert("apricot", "苹果");
        trie.insert("苹果", "苹果");
        console.log("demo: TrieDB, search 'ap':", trie.findPrefixNode("ap"));
        console.log("demo: TrieDB, search 'ping':", trie.findPrefixNode("ping"));
        console.log("demo: TrieDB, search 'pg':", trie.findPrefixNode("pg"));
    }
}

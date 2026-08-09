export class ReverseIndexDB {
    constructor() {
        this.index = new Map();
        this.documents = new Map();
        this.queryMapping = new Map();
    }
    add(query, output, name) {
        if (!this.documents.has(output)) {
            this.documents.set(output, new Set());
        }
        this.documents.get(output).add(query);
        if (!this.queryMapping.has(query)) {
            this.queryMapping.set(query, []);
        }
        this.queryMapping.get(query).push({ output, name });
        for (const char of query) {
            if (!this.index.has(char)) {
                this.index.set(char, new Set());
            }
            this.index.get(char).add(query);
        }
    }
    search(query) {
        const chars = query.replace(/\s+/g, '').split('');
        if (chars.length === 0)
            return [];
        let candidates = this.index.get(chars[0]);
        if (!candidates || candidates.size === 0)
            return [];
        const scoredResults = [];
        const seen = new Set();
        for (const candidateQuery of candidates) {
            const matchInfo = this.getMatchScore(chars, candidateQuery);
            if (matchInfo.matched) {
                const mappings = this.queryMapping.get(candidateQuery) || [];
                for (const mapping of mappings) {
                    const key = `${mapping.output}|${mapping.name}`;
                    if (!seen.has(key)) {
                        seen.add(key);
                        scoredResults.push(Object.assign(Object.assign({}, mapping), { score: matchInfo.score }));
                    }
                }
            }
        }
        return scoredResults
            .sort((a, b) => b.score - a.score)
            .map(({ output, name }) => ({ output, name }));
    }
    getMatchScore(chars, text) {
        const queryStr = chars.join('');
        if (text === queryStr) {
            return { matched: true, score: 100 };
        }
        if (text.startsWith(queryStr)) {
            return { matched: true, score: 50 };
        }
        let charIndex = 0;
        let consecutiveMatches = 0;
        let maxConsecutive = 0;
        let lastMatchIndex = -1;
        for (let i = 0; i < text.length; i++) {
            if (text[i] === chars[charIndex]) {
                if (i === lastMatchIndex + 1) {
                    consecutiveMatches++;
                }
                else {
                    maxConsecutive = Math.max(maxConsecutive, consecutiveMatches);
                    consecutiveMatches = 1;
                }
                lastMatchIndex = i;
                charIndex++;
                if (charIndex === chars.length)
                    break;
            }
        }
        if (charIndex !== chars.length) {
            return { matched: false, score: 0 };
        }
        maxConsecutive = Math.max(maxConsecutive, consecutiveMatches);
        const lengthRatio = chars.length / text.length;
        const consecutiveRatio = maxConsecutive / chars.length;
        const score = (lengthRatio * 0.6 + consecutiveRatio * 0.4) * 40;
        return { matched: true, score };
    }
    getDetailsByOutput(output) {
        const results = [];
        for (const [query, mappings] of this.queryMapping.entries()) {
            for (const mapping of mappings) {
                if (mapping.output === output) {
                    results.push({ query, name: mapping.name });
                }
            }
        }
        return results;
    }
    static demo() {
        const emojiEngine = new ReverseIndexDB();
        emojiEngine.add('renke', '👍', '认可');
        emojiEngine.add('rk', '👍', '认可');
        emojiEngine.add('diantou', '👍', '点头');
        emojiEngine.add('dt', '👍', '点头');
        emojiEngine.add('tongyi', '👍', '同意');
        emojiEngine.add('renke', '👏', '认可');
        emojiEngine.add('rk', '👏', '认可');
        emojiEngine.add('guzhang', '👏', '鼓掌');
        emojiEngine.add('kaixin', '😊', '开心');
        emojiEngine.add('weixiao', '😊', '微笑');
        console.log('demo: ReverseIndexDB, search "renke":', emojiEngine.search('renke'));
        console.log('demo: ReverseIndexDB, search "rk":', emojiEngine.search('rk'));
        console.log('demo: ReverseIndexDB, search "dt":', emojiEngine.search('dt'));
        console.log('demo: ReverseIndexDB, search "gu":', emojiEngine.search('gu'));
        console.log('demo: ReverseIndexDB, search "k":', emojiEngine.search('k'));
        console.log('demo: ReverseIndexDB, value 👍 find details:', emojiEngine.getDetailsByOutput('👍'));
    }
}

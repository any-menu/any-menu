export declare class ReverseIndexDB {
    private index;
    private documents;
    private queryMapping;
    add(query: string, output: string, name: string): void;
    search(query: string): Array<{
        output: string;
        name: string;
    }>;
    private getMatchScore;
    getDetailsByOutput(output: string): Array<{
        query: string;
        name: string;
    }>;
    static demo(): void;
}

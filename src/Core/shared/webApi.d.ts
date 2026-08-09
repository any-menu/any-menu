export declare class RepoAPI {
    source: 'gitee' | 'github';
    private repoOwner;
    private repoRepo;
    private repoBranch;
    baseUrl(): string;
    blobUrl(): string;
    apiUrl(): string;
    private token;
    giteeBaseUrl: string;
    giteeBlobUrl: string;
    giteeApiUrl: string;
    private giteeToken;
    githubBaseUrl: string;
    githubBlobUrl: string;
    githubApiUrl: string;
    private githubToken;
    constructor();
    getDir_fromStorePath(): Promise<import("../../Type").UrlResponse | null>;
    getDir_fromStorePath_byApi(): Promise<import("../../Type").UrlResponse | null>;
    getFile_fromStorePath(relPath: string): Promise<import("../../Type").UrlResponse | null>;
    getFile_fromStorePath_byApi(relPath: string): Promise<import("../../Type").UrlResponse | null>;
    getFile_fromStorePath_and_writeFile(relPath: string): Promise<boolean>;
    static getFile_fromFile(repoPath: string, relPath: string): Promise<string | null>;
    static getFile_fromRelease(repoPath: string): Promise<string | null>;
    static getFile_fromRelease_and_writeFile(repoPath: string): Promise<boolean>;
    getDir_fromLocal(): Promise<string[]>;
}

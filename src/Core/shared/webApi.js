var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { global_setting } from '../shared/setting';
export class RepoAPI {
    baseUrl() { return this.source === 'gitee' ? this.giteeBaseUrl : this.githubBaseUrl; }
    blobUrl() { return this.source === 'gitee' ? this.giteeBlobUrl : this.githubBlobUrl; }
    apiUrl() { return this.source === 'gitee' ? this.giteeApiUrl : this.githubApiUrl; }
    token() { return this.source === 'gitee' ? this.giteeToken : this.githubToken; }
    constructor() {
        this.source = global_setting.config.dict_online_source;
        this.repoOwner = 'any-menu';
        this.repoRepo = 'any-menu';
        this.repoBranch = 'main';
        this.giteeBaseUrl = `https://gitee.com/${this.repoOwner}/${this.repoRepo}/raw/${this.repoBranch}/`;
        this.giteeBlobUrl = `https://gitee.com/${this.repoOwner}/${this.repoRepo}/blob/${this.repoBranch}/`;
        this.giteeApiUrl = `https://gitee.com/api/v5/repos/${this.repoOwner}/${this.repoRepo}/`;
        this.giteeToken = '6ca4bf01f660cc1b4fdc98f14aaff4f9';
        this.githubBaseUrl = `https://raw.githubusercontent.com/${this.repoOwner}/${this.repoRepo}/${this.repoBranch}/`;
        this.githubBlobUrl = `https://github.com/${this.repoOwner}/${this.repoRepo}/blob/${this.repoBranch}/`;
        this.githubApiUrl = `https://api.github.com/repos/${this.repoOwner}/${this.repoRepo}/`;
        this.githubToken = null;
    }
    getDir_fromStorePath() {
        return __awaiter(this, void 0, void 0, function* () {
            return yield global_setting.api.urlRequest(Object.assign(Object.assign({ url: `${this.baseUrl()}store/directory/dir.json`, method: 'GET' }, (!this.token() ? {} : { headers: {
                    "Authorization": `Bearer ${this.token()}`
                } })), { isParseJson: true }));
        });
    }
    getDir_fromStorePath_byApi() {
        return __awaiter(this, void 0, void 0, function* () {
            const res = yield global_setting.api.urlRequest(Object.assign(Object.assign({ url: `${this.apiUrl()}contents/store/directory/dir.json?ref=${this.repoBranch}`, method: 'GET' }, (!this.token() ? {} : { headers: {
                    "Authorization": `Bearer ${this.token()}`
                } })), { isParseJson: true }));
            if (global_setting.isDebug)
                console.log('repoGetDirectory_byApi res', res);
            return res;
        });
    }
    getFile_fromStorePath(relPath) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield global_setting.api.urlRequest(Object.assign(Object.assign({ url: `${this.baseUrl()}store/dict/${relPath}`, method: 'GET' }, (!this.token() ? {} : { headers: {
                    "Authorization": `Bearer ${this.token()}`
                } })), { isParseJson: false }));
        });
    }
    getFile_fromStorePath_byApi(relPath) {
        return __awaiter(this, void 0, void 0, function* () {
            const res = yield global_setting.api.urlRequest(Object.assign(Object.assign({ url: `${this.apiUrl()}contents/store/dict/${relPath}?ref=${this.repoBranch}`, method: 'GET' }, (!this.token() ? {} : { headers: {
                    "Authorization": `Bearer ${this.token()}`
                } })), { isParseJson: true }));
            if (global_setting.isDebug)
                console.log('repoGetDict_byApi res', res);
            return res;
        });
    }
    getFile_fromStorePath_and_writeFile(relPath) {
        return __awaiter(this, void 0, void 0, function* () {
            const ret = yield this.getFile_fromStorePath(relPath);
            if (ret === null || ret.code !== 0 || !ret.data) {
                console.error(`Failed to download dict from repo: ${relPath}`, ret);
                return false;
            }
            return yield global_setting.api.writeFile(`${global_setting.config.dict_paths}${relPath}`, ret.data.text);
        });
    }
    static getFile_fromFile(repoPath, relPath) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const [owner, repo] = repoPath.split('/');
            const url = `https://raw.githubusercontent.com/${owner}/${repo}/HEAD/${relPath}`;
            const ret = yield global_setting.api.urlRequest({
                url,
                method: 'GET',
                isParseJson: false,
            });
            if (ret === null || ret.code !== 0 || !ret.data) {
                console.error(`Failed to fetch file content from GitHub repo: ${repoPath}, path: ${relPath}`, ret);
                return null;
            }
            return (_a = ret.data.text) !== null && _a !== void 0 ? _a : null;
        });
    }
    static getFile_fromRelease(repoPath) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const [owner, repo] = repoPath.split('/');
            const url = `https://github.com/${owner}/${repo}/releases/latest/download/main.js`;
            const ret = yield global_setting.api.urlRequest({
                url,
                method: 'GET',
                isParseJson: false,
            });
            if (ret === null || ret.code !== 0 || !ret.data) {
                console.error(`Failed to fetch plugin from GitHub repo: ${repoPath}`, ret);
                return null;
            }
            return (_a = ret.data.text) !== null && _a !== void 0 ? _a : null;
        });
    }
    static getFile_fromRelease_and_writeFile(repoPath) {
        return __awaiter(this, void 0, void 0, function* () {
            const text = yield this.getFile_fromRelease(repoPath);
            if (text === null)
                return false;
            const newPath = `${repoPath}.js`;
            return yield global_setting.api.writeFile(`${global_setting.config.dict_paths}${newPath}`, text);
        });
    }
    getDir_fromLocal() {
        return __awaiter(this, void 0, void 0, function* () {
            const ret = yield global_setting.api.readFolder(global_setting.config.dict_paths);
            return ret;
        });
    }
}

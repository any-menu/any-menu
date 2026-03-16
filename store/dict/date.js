export default {
    metadata: {
        id: 'anymenu-date',
        name: '日期',
        version: '1.0.1',
        min_app_version: '1.1.0',
        author: 'LincZero',
        description: '输出当前日期 (ISO 8601 格式 + 当前时区)'
    },

    async run(ctx) {
        // ------- UTC 时间戳版本，带毫秒 (备用)
        // const currentDate = new Date();
        // const dateString = currentDate.toISOString();

        // ------- 本地时间版本
        // sv-SE (瑞典语) 输出类似 "2026-03-16 15:30:00" 的本地时间，然后将空格替换为 T
        const dateString = new Date().toLocaleString('sv-SE').replace(' ', 'T');

        // 输出
        ctx.api.sendText(dateString);
    }
}

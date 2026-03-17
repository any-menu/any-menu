export default {
    metadata: {
        id: 'anymenu-example-notify',
        name: '示例-通知',
        version: '1.0.1',
        min_app_version: '1.1.0',
        author: 'LincZero'
    },

    async run(ctx) {
        ctx.api.notify('测试通知内容')
    }
}

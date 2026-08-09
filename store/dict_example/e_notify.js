export default {
    metadata: {
        id: 'anymenu-example-notify',
        name: '示例-通知',
        version: '1.0.2',
        min_app_version: '1.2.0',
        author: 'LincZero',
        icon: 'lucide-bell'
    },

    async run(ctx) {
        this.app.api.notify('测试通知内容')
    }
}

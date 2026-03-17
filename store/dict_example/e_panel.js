export default {
    metadata: {
        id: 'anymenu-example-panel',
        name: '示例-新面板',
        version: '1.0.1',
        min_app_version: '1.1.0',
        author: 'LincZero'
    },

    async run(ctx) {
        ctx.api.showPanel(['search', 'toolbar', 'menu', 'miniEditor'])
    }
}

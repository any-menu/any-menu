export default {
    metadata: {
        id: 'anymenu-date',
        name: '日期',
        version: '1.0.1',
        min_app_version: '1.1.0',
        author: 'LincZero'
    },

    async run(ctx) {
        const currentDate = new Date();
        const dateString = currentDate.toISOString(); 
        ctx.sendText(dateString);
    }
}

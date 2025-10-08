const plugin = {
    metadata: {
        id: 'anymenu-date',
        name: '日期',
        version: '1.0.0',
        author: 'LincZero'
    },

    async process() {
        const currentDate = new Date();
        const dateString = currentDate.toISOString(); 
        return dateString;
    }
}

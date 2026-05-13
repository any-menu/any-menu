export default {
    metadata: {
        id: 'anymenu-example-request',
        name: '示例-网络请求',
        version: '1.0.1',
        min_app_version: '1.1.0',
        author: 'LincZero',
        icon: 'lucide-cloud-rain'
    },

    async run(ctx) {
        // 其他一些测试用 api:
        // https://api.example.com/data
        const ret = await ctx.api.urlRequest({
            url: 'https://httpbin.org/get',
            method: 'GET',
            // headers: {
            //     'Authorization': 'Bearer token'
            // }
            isParseJson: true,
        });

        console.log('Request result: ', ret);
        ctx.api.sendText(`${JSON.stringify(ret, null, 2)}`);
    }
}

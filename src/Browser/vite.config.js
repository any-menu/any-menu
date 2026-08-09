import { defineConfig } from 'vite';
import path from 'path';
// import vue from '@vitejs/plugin-vue';

import { viteFileApiPlugin } from './vite_file_plugin';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '../../src'),
      // '@/Core': path.resolve(__dirname, '../../src/CoreSource'),
    }
  },

  plugins: [viteFileApiPlugin], // vue()
  define: {
    '__VUE_PROD_HYDRATION_MISMATCH_DETAILS__': JSON.stringify(true),
    // 添加其他需要的特性标志
  },
  css: {
    preprocessorOptions: {
      scss: {
        // additionalData: `@import "./src/styles/global.scss";`
      }
    }
  },
  // base: '/any-menu/', // [!code] 临时，需要根据你要部署的位置进行修改
  server: {
    host: 'localhost',
    port: 3012,
  },
  root: path.resolve(__dirname, './'), // 确保 Vite 使用正确的根目录
  build: {
    outDir: 'dist',
    rollupOptions: {
      // input: {
      //   main: path.resolve(__dirname, './src/main.ts'),
      // },

      // TODO 临时，后面清掉
      //   这里是避免 `Core/panels/search/index.ts::panel_hide()` 中用了 `require('obsidian')` 导致的 ob 依赖
      //   后面把那边的代码优化一下
      external: ['obsidian'],
      input: path.resolve(__dirname, './index.html'),
    },
  }
});

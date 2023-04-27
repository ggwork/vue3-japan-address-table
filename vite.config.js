import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'
import { createHtmlPlugin } from "vite-plugin-html";


import { resolve } from "path";

const getEnvFn = (mode, target) => {
  return loadEnv(mode, process.cwd())[target]
}
/** 路径查找 */
const pathResolve = (dir) => {
  return resolve(__dirname, ".", dir);
};

// https://vitejs.dev/config/
export default ({ mode }) => defineConfig({
  plugins: [
    vue(),
    AutoImport({
      resolvers: [ElementPlusResolver()],
    }),
    Components({
      resolvers: [ElementPlusResolver()],
    }),
    createHtmlPlugin({
      minify: true,
      entry: 'src/main.js',
      inject: {
        data: {
          title: getEnvFn(mode, "VITE_APP_TITLE")
        }

      },
    }),
  ],
  server: {
    port: getEnvFn(mode, "VITE_PORT")
  },
  resolve: {
    alias: pathResolve("src")
  }
})

import tailwindcss from '@tailwindcss/vite';
import vue from '@vitejs/plugin-vue';
import { Plugin, defineConfig } from 'vite';

export default defineConfig({
  root: 'web',
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          native: ['@tauri-apps/plugin-dialog', '@tauri-apps/plugin-http'],
          vendor: ['marked', 'vue-router', 'vue'],
        },
      },
    },
  },
  plugins: [
    html({
      APP_TITLE: `DBChat - Chat with your Database`,
      APP_DESCRIPTION: `Use AI to chat with a MySQL/PostgreSQL database using Google/OpenAI/xAI models`,
      APP_COVER: `https://raw.githubusercontent.com/PactInteractive/dbchat/master/web/assets/cover.png`,
    }),
    tailwindcss(),
    vue(),
  ],
  server: {
    port: 3000,
    strictPort: true, // Fail if 3000 is taken
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
});

function html(data: Record<string, any>): Plugin {
  return {
    name: 'html-replace',
    transformIndexHtml(html) {
      return Object.entries(data).reduce((result, [key, value]) => result.replaceAll(`%${key}%`, value), html);
    },
  };
}

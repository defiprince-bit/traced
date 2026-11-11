import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/react') || id.includes('node_modules/scheduler')) return 'react';
          if (id.includes('node_modules/viem') || id.includes('node_modules/@noble') || id.includes('node_modules/ox') || id.includes('node_modules/abitype') || id.includes('node_modules/isows')) return 'viem';
        },
      },
    },
  },
});

import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      dedupe: ['react', 'react-dom'],
      alias: [
        { find: /^@\/(.*)/, replacement: path.resolve(__dirname, 'src/office/$1') },
        { find: /^@shared\/(.*)/, replacement: path.resolve(__dirname, 'src/office/shared/$1') },
        { find: /^@brand\/(.*)/, replacement: path.resolve(__dirname, 'public/brand/$1') },
        { find: 'react', replacement: path.resolve(__dirname, 'node_modules/react') },
        { find: 'react-dom', replacement: path.resolve(__dirname, 'node_modules/react-dom') },
      ],
    },
    optimizeDeps: {
      include: ['react', 'react-dom', 'motion/react'],
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {
        ignored: [
          '**/*.tmp',
          '**/*.tmp.*',
          '**/*.db',
          '**/*.db-*',
          '**/*.sqlite',
          '**/*.sqlite-*',
          '**/mahr_brain.db*',
          '**/server_chat_history*.json',
          '**/deleted_memories*.json',
          '**/memories*.json',
          '**/daily_tasks*.json',
          '**/knowledge_graph*.json',
          '**/vector_knowledge_graph*.json',
          '**/token_telemetry*.json',
          '**/office_state*.json',
          '**/office_*.json',
          '**/*.log',
          '**/.system_generated/**'
        ]
      },
    },
  };
});

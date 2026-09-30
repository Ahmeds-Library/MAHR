import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, type Plugin} from 'vite';

function pixiExtensionIdempotencyPlugin(): Plugin {
  return {
    name: 'pixi-extension-idempotency',
    enforce: 'pre',
    transform(code: string, id: string) {
      if (id.includes('Extensions') && code.includes('already has a handler')) {
        return {
          code: code.replace(
            /throw new Error\([`'"]Extension type \$\{?type\}? already has a handler[`'"]\);?/g,
            'return this;'
          ),
          map: null,
        };
      }
      return null;
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [pixiExtensionIdempotencyPlugin(), react(), tailwindcss()],
    resolve: {
      dedupe: ['react', 'react-dom', 'pixi.js'],
      alias: [
        { find: /^@office\/(.*)/, replacement: path.resolve(__dirname, 'src/office/$1') },
        { find: /^@shared\/(.*)/, replacement: path.resolve(__dirname, 'src/office/shared/$1') },
        { find: /^@brand\/(.*)/, replacement: path.resolve(__dirname, 'public/brand/$1') },
        { find: /^@components\/(.*)/, replacement: path.resolve(__dirname, 'src/components/$1') },
        { find: /^@hooks\/(.*)/, replacement: path.resolve(__dirname, 'src/hooks/$1') },
        { find: /^@lib\/(.*)/, replacement: path.resolve(__dirname, 'src/lib/$1') },
        { find: /^@\/(.*)/, replacement: path.resolve(__dirname, 'src/$1') },
      ],
    },
    optimizeDeps: {
      include: ['react', 'react-dom', 'motion/react', 'pixi.js'],
    },
    build: {
      outDir: 'dist',
      emptyOutDir: true,
      sourcemap: false,
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
          '*/office/generated/**',
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

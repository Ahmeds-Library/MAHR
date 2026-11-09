import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig, type Plugin } from 'vite';
import { nodePolyfills } from 'vite-plugin-node-polyfills';

const NODE_POLYFILL_OPTIONS = {
  include: ['buffer', 'process', 'util', 'stream', 'events', 'path', 'crypto'] as any,
  globals: {
    Buffer: true,
    global: true,
    process: true,
  },
  protocolImports: true,
};

function patchPixiExtensions(code: string): string {
  if (!code.includes('extensions.add(')) return code;
  return code;
}

function pixiExtensionIdempotencyPlugin(): Plugin {
  return {
    name: 'pixi-extension-idempotency',
    transform(code, id) {
      if (!id.includes('pixi.js') && !id.includes('@pixi')) return null;
      return { code: patchPixiExtensions(code), map: null };
    },
  };
}

function pixiExtensionIdempotencyEsbuildPlugin() {
  return {
    name: 'pixi-extension-idempotency-esbuild',
    setup() {},
  };
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig(() => {
  return {
    plugins: [
      pixiExtensionIdempotencyPlugin(),
      nodePolyfills(NODE_POLYFILL_OPTIONS),
      react(),
      tailwindcss(),
    ],
    resolve: {
      dedupe: ['react', 'react-dom', 'react-dom/client', 'react/jsx-runtime', 'react/jsx-dev-runtime', 'pixi.js'],
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
      include: [
        'react',
        'react-dom',
        'react-dom/client',
        'react/jsx-runtime',
        'react/jsx-dev-runtime',
        'motion/react',
        'lucide-react',
        'pixi.js',
        'canvas-confetti'
      ],
      esbuildOptions: {
        define: {
          global: 'globalThis',
        },
        plugins: [pixiExtensionIdempotencyEsbuildPlugin()],
      },
    },
    build: {
      outDir: 'dist',
      emptyOutDir: true,
      sourcemap: false,
      commonjsOptions: {
        transformMixedEsModules: true,
      },
    },
    server: {
      // HMR is disabled in AI Studio preview iframe.
      hmr: false,
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

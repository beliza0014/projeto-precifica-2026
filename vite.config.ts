import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // Optimized build configuration
  build: {
    // Use esbuild for faster minification (built into Vite)
    minify: mode === 'production' ? 'esbuild' : false,
    // Optimize chunk splitting for better caching
    rollupOptions: {
      output: {
        // Chunk splitting strategy
        manualChunks: {
          // Vendor libraries
          'vendor-react': ['react', 'react-dom'],
          'vendor-ui': ['@radix-ui/react-dialog', '@radix-ui/react-select', '@radix-ui/react-tabs'],
          'vendor-charts': ['recharts'],
          'vendor-utils': ['date-fns', 'clsx', 'class-variance-authority'],
          // App specific chunks
          'pages-core': [
            './src/pages/Dashboard.tsx',
            './src/pages/Index.tsx'
          ],
          'pages-data': [
            './src/pages/Receitas.tsx',
            './src/pages/Insumos.tsx',
            './src/pages/Variacoes.tsx'
          ],
          'pages-analysis': [
            './src/pages/IndicadoresNew.tsx',
            './src/pages/Faturamento.tsx',
            './src/pages/Vendas.tsx'
          ]
        },
        chunkFileNames: (chunkInfo) => {
          return `assets/js/[name]-[hash].js`;
        },
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: 'assets/[ext]/[name]-[hash].[ext]'
      }
    },
    // Enable source maps for debugging
    sourcemap: mode === 'development',
    // Optimize chunk size warnings
    chunkSizeWarningLimit: 1000,
    // Enable CSS code splitting
    cssCodeSplit: true,
  },
  // Optimizations for development
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@radix-ui/react-dialog',
      '@radix-ui/react-select',
      '@radix-ui/react-tabs',
      'recharts',
      'date-fns',
      'clsx'
    ],
    // Force optimization of problematic dependencies
    force: mode === 'development'
  },
  // Performance optimizations
  define: {
    // Remove console logs in production
    ...(mode === 'production' && {
      'console.log': '(() => {})',
      'console.debug': '(() => {})',
      'console.info': '(() => {})'
    })
  }
}));

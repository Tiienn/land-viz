/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [react()],
  // Note: Console methods are handled by logger utility in production
  // instead of Vite defines to avoid build issues
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@/components': path.resolve(__dirname, './src/components'),
      '@/services': path.resolve(__dirname, './src/services'),
      '@/hooks': path.resolve(__dirname, './src/hooks'),
      '@/store': path.resolve(__dirname, './src/store'),
      '@/types': path.resolve(__dirname, './src/types'),
      '@/utils': path.resolve(__dirname, './src/utils'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor libraries - core dependencies
          'vendor-react': ['react', 'react-dom'],
          'vendor-three': ['three', '@react-three/fiber', '@react-three/drei'],
          'vendor-ui': ['zustand'],

          // Feature-based chunks for better code splitting
          'feature-reference-objects': [
            './src/data/referenceObjects',
            './src/components/ComparisonPanel/ComparisonPanel',
            './src/components/ComparisonPanel/ObjectList',
            './src/components/ComparisonPanel/MobileComparisonPanel',
            './src/utils/comparisonCalculations'
          ],
          'feature-geometry': [
            './src/utils/GeometryCache',
            './src/geometries/EiffelTowerGeometry',
            './src/geometries/StatueOfLibertyGeometry'
          ],
          'feature-conversion': [
            './src/services/conversionService',
            './src/utils/conversionUtils',
            './src/components/ConvertPanel/ConvertPanel'
          ]
        }
      }
    },
    chunkSizeWarningLimit: 500 // Target 500KB chunks max
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
  },
}))
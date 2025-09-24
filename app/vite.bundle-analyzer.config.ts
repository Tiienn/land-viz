import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

// Bundle analyzer configuration for Vite
export default defineConfig({
  plugins: [
    react(),
    // Bundle analyzer plugin
    {
      name: 'bundle-analyzer',
      generateBundle(options, bundle) {
        const bundleInfo = {
          timestamp: new Date().toISOString(),
          chunks: {} as Record<string, any>,
          totalSize: 0,
          gzippedSize: 0,
          assets: [] as any[],
        };

        // Analyze each chunk
        for (const [fileName, chunk] of Object.entries(bundle)) {
          if (chunk.type === 'chunk') {
            bundleInfo.chunks[fileName] = {
              size: chunk.code.length,
              modules: Object.keys(chunk.modules || {}),
              imports: chunk.imports || [],
              dynamicImports: chunk.dynamicImports || [],
              isEntry: chunk.isEntry,
              isDynamicEntry: chunk.isDynamicEntry,
            };
          } else if (chunk.type === 'asset') {
            bundleInfo.assets.push({
              fileName,
              size: chunk.source.length,
              type: 'asset',
            });
          }

          bundleInfo.totalSize += fileName.endsWith('.js') || fileName.endsWith('.css')
            ? (chunk.type === 'chunk' ? chunk.code.length : chunk.source.length)
            : 0;
        }

        // Write bundle analysis
        this.emitFile({
          type: 'asset',
          fileName: 'bundle-analysis.json',
          source: JSON.stringify(bundleInfo, null, 2),
        });

        // Generate human-readable report
        const report = generateBundleReport(bundleInfo);
        this.emitFile({
          type: 'asset',
          fileName: 'bundle-report.md',
          source: report,
        });

        // Check bundle size budgets
        checkBundleBudgets(bundleInfo);
      },
    },
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Core libraries
          'vendor-react': ['react', 'react-dom'],
          'vendor-three': ['three', '@react-three/fiber', '@react-three/drei'],
          'vendor-ui': ['zustand', 'lucide-react'],

          // Feature chunks for better code splitting
          'feature-measurement': [
            './src/store/useMeasurementStore.ts',
            './src/utils/measurementUtils.ts',
            './src/components/Scene/MeasurementRenderer.tsx',
          ],
          'feature-comparison': [
            './src/store/useComparisonStore.ts',
            './src/utils/comparisonCalculations.ts',
            './src/components/ComparisonPanel/ComparisonPanel.tsx',
          ],
          'feature-conversion': [
            './src/store/useConversionStore.ts',
            './src/services/conversionService.ts',
            './src/components/ConvertPanel/ConvertPanel.tsx',
          ],

          // Heavy geometries - these will be dynamically imported
          'geometries': [
            './src/geometries/EiffelTowerGeometry.ts',
            './src/geometries/StatueOfLibertyGeometry.ts',
          ],
        },
      },
    },

    // Bundle size limits
    chunkSizeWarningLimit: 1000, // 1MB warning

    // Generate source maps for analysis
    sourcemap: true,
  },

  // Performance optimizations
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'three',
      '@react-three/fiber',
      '@react-three/drei',
      'zustand',
    ],
    exclude: [
      // Exclude heavy geometries from pre-bundling
      './src/geometries/EiffelTowerGeometry.ts',
      './src/geometries/StatueOfLibertyGeometry.ts',
    ],
  },
});

function generateBundleReport(bundleInfo: any): string {
  const { chunks, totalSize, assets } = bundleInfo;

  let report = `# Bundle Analysis Report\n\n`;
  report += `**Generated:** ${bundleInfo.timestamp}\n`;
  report += `**Total Bundle Size:** ${formatBytes(totalSize)}\n\n`;

  // Chunk analysis
  report += `## Chunks\n\n`;
  const sortedChunks = Object.entries(chunks).sort(([,a], [,b]) => b.size - a.size);

  for (const [fileName, chunk] of sortedChunks) {
    report += `### ${fileName}\n`;
    report += `- **Size:** ${formatBytes(chunk.size)}\n`;
    report += `- **Modules:** ${chunk.modules.length}\n`;
    report += `- **Type:** ${chunk.isEntry ? 'Entry' : chunk.isDynamicEntry ? 'Dynamic Entry' : 'Chunk'}\n`;

    if (chunk.dynamicImports.length > 0) {
      report += `- **Dynamic Imports:** ${chunk.dynamicImports.join(', ')}\n`;
    }

    // Largest modules
    const largeModules = chunk.modules
      .filter((m: string) => !m.includes('node_modules'))
      .slice(0, 5);

    if (largeModules.length > 0) {
      report += `- **Key Modules:** ${largeModules.join(', ')}\n`;
    }

    report += '\n';
  }

  // Assets
  if (assets.length > 0) {
    report += `## Assets\n\n`;
    const sortedAssets = assets.sort((a, b) => b.size - a.size);

    for (const asset of sortedAssets.slice(0, 10)) {
      report += `- **${asset.fileName}:** ${formatBytes(asset.size)}\n`;
    }
    report += '\n';
  }

  // Recommendations
  report += `## Recommendations\n\n`;

  if (totalSize > 5 * 1024 * 1024) { // 5MB
    report += `⚠️ **Large Bundle Warning:** Total size (${formatBytes(totalSize)}) exceeds 5MB target\n`;
  }

  const largeChunks = sortedChunks.filter(([, chunk]) => chunk.size > 1024 * 1024); // 1MB
  if (largeChunks.length > 0) {
    report += `⚠️ **Large Chunks:** Consider splitting these chunks:\n`;
    for (const [fileName] of largeChunks) {
      report += `  - ${fileName}\n`;
    }
  }

  return report;
}

function checkBundleBudgets(bundleInfo: any): void {
  const budgets = {
    totalSize: 5 * 1024 * 1024, // 5MB
    chunkSize: 1 * 1024 * 1024, // 1MB per chunk
    geometryChunkSize: 500 * 1024, // 500KB for geometry chunks
  };

  const violations: string[] = [];

  // Check total size budget
  if (bundleInfo.totalSize > budgets.totalSize) {
    violations.push(
      `Total bundle size (${formatBytes(bundleInfo.totalSize)}) exceeds budget (${formatBytes(budgets.totalSize)})`
    );
  }

  // Check individual chunk budgets
  for (const [fileName, chunk] of Object.entries(bundleInfo.chunks)) {
    const budget = fileName.includes('geometries') ? budgets.geometryChunkSize : budgets.chunkSize;

    if (chunk.size > budget) {
      violations.push(
        `Chunk ${fileName} (${formatBytes(chunk.size)}) exceeds budget (${formatBytes(budget)})`
      );
    }
  }

  if (violations.length > 0) {
    console.warn('\n⚠️  Bundle Budget Violations:');
    violations.forEach(violation => console.warn(`  - ${violation}`));
    console.warn('\nConsider optimizing bundle size before deployment.\n');
  } else {
    console.log('\n✅ All bundle budgets met!');
  }
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';

  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}
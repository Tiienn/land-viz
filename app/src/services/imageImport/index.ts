/**
 * Image Import Services
 *
 * Orchestrates the complete site plan import pipeline.
 *
 * @example
 * ```typescript
 * import { importService } from './imageImport';
 *
 * const result = await importService.importSitePlan(imageFile, {
 *   onProgress: (percent, message) => {
 *     console.log(`${percent}%: ${message}`);
 *   },
 *   autoAddToCanvas: true
 * });
 *
 * if (result.success) {
 *   console.log('Shape created:', result.shape);
 * }
 * ```
 */

export { importService, ImportService } from './importService';
export { importTemplateService } from './importTemplateService';
export { geometryReconstructor } from './geometryReconstructor';

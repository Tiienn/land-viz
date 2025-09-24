/**
 * Unified Store System for Land Visualizer
 *
 * This file orchestrates all domain-specific stores and provides a unified interface
 * for components that need to access multiple domains.
 */

// Export individual stores
export { useDrawingStore } from './useDrawingStore';
export { useLayerStore } from './useLayerStore';
export { useMeasurementStore } from './useMeasurementStore';
export { useComparisonStore } from './useComparisonStore';
export { useConversionStore } from './useConversionStore';
// export { useAlignmentStore } from './useAlignmentStore'; // Temporarily disabled

// Legacy store for backward compatibility during migration
export { useAppStore } from './useAppStore';

// Combined store hook for components that need multiple domains
export const useUnifiedStore = () => {
  const drawing = useDrawingStore();
  const layers = useLayerStore();
  const measurement = useMeasurementStore();
  const comparison = useComparisonStore();
  const conversion = useConversionStore();

  return {
    drawing,
    layers,
    measurement,
    comparison,
    conversion,
  };
};

// Utility hooks for common patterns
export const useShapeManagement = () => {
  const { shapes, addShape, updateShape, deleteShape, selectShape } = useDrawingStore();
  const { layers, activeLayerId, getActiveLayer } = useLayerStore();

  return {
    shapes,
    layers,
    activeLayerId,
    getActiveLayer,
    addShape,
    updateShape,
    deleteShape,
    selectShape,
  };
};

export const useDrawingTools = () => {
  const {
    drawing,
    setActiveTool,
    startDrawing,
    finishDrawing,
    cancelDrawing,
    addPoint,
    removeLastPoint,
  } = useDrawingStore();

  return {
    activeTool: drawing.activeTool,
    isDrawing: drawing.isDrawing,
    currentShape: drawing.currentShape,
    setActiveTool,
    startDrawing,
    finishDrawing,
    cancelDrawing,
    addPoint,
    removeLastPoint,
  };
};

export const useMeasurementTools = () => {
  const {
    measurement,
    startMeasurement,
    stopMeasurement,
    setStartPoint,
    setPreviewEndPoint,
    completeMeasurement,
    clearMeasurements,
  } = useMeasurementStore();

  return {
    isActive: measurement.isActive,
    isMeasuring: measurement.isMeasuring,
    startPoint: measurement.startPoint,
    previewEndPoint: measurement.previewEndPoint,
    measurements: measurement.measurements,
    startMeasurement,
    stopMeasurement,
    setStartPoint,
    setPreviewEndPoint,
    completeMeasurement,
    clearMeasurements,
  };
};

export const useVisualComparison = () => {
  const {
    comparison,
    toggleComparisonPanel,
    toggleObjectVisibility,
    setComparisonSearch,
    setComparisonCategory,
    updateLandArea,
    getFilteredObjects,
  } = useComparisonStore();

  return {
    isExpanded: comparison.isExpanded,
    searchQuery: comparison.searchQuery,
    selectedCategory: comparison.selectedCategory,
    visibleObjects: comparison.visibleObjects,
    calculations: comparison.calculations,
    toggleComparisonPanel,
    toggleObjectVisibility,
    setComparisonSearch,
    setComparisonCategory,
    updateLandArea,
    getFilteredObjects,
  };
};

export const useUnitConversion = () => {
  const {
    conversion,
    toggleConvertPanel,
    setInputValue,
    setInputUnit,
    clearConversion,
    getConvertedValue,
    isValidInput,
    copyResult,
  } = useConversionStore();

  return {
    isExpanded: conversion.isExpanded,
    inputValue: conversion.inputValue,
    inputUnit: conversion.inputUnit,
    inputError: conversion.inputError,
    results: conversion.results,
    lastCopied: conversion.lastCopied,
    toggleConvertPanel,
    setInputValue,
    setInputUnit,
    clearConversion,
    getConvertedValue,
    isValidInput,
    copyResult,
  };
};
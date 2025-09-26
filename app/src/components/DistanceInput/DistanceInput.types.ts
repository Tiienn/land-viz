import { Point2D } from '../../types';

export interface DistanceInputState {
  visible: boolean;
  position: Point2D;
  value: string;
  isValid: boolean;
}

export interface DistanceInputActions {
  showInput: (position: Point2D) => void;
  hideInput: () => void;
  updateValue: (value: string) => void;
  confirmInput: () => void;
  cancelInput: () => void;
}

export interface LineToolState {
  // Tool activation
  isActive: boolean;

  // Drawing state
  startPoint: Point2D | null;
  currentDistance: number | null;
  inputValue: string;
  previewEndPoint: Point2D | null;

  // Multi-segment support
  segments: LineSegment[];
  isWaitingForInput: boolean;

  // UI state
  inputPosition: Point2D;
  showInput: boolean;
}

export interface LineSegment {
  startPoint: Point2D;
  endPoint: Point2D;
  distance: number;
}

export interface LineToolActions {
  activateLineTool: () => void;
  deactivateLineTool: () => void;
  setStartPoint: (point: Point2D) => void;
  setPreviewEndPoint: (point: Point2D) => void;
  updateInputValue: (value: string) => void;
  confirmLine: () => void;
  cancelLine: () => void;
  addSegment: (segment: LineSegment) => void;
  clearSegments: () => void;
}
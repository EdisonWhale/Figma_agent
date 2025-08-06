"use strict";
/**
 * Figma API Types
 * Comprehensive type definitions for Figma/FigJam operations
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.FigmaAPIError = void 0;
// Error Types
class FigmaAPIError extends Error {
    constructor(message, code, action, elementId) {
        super(message);
        this.code = code;
        this.action = action;
        this.elementId = elementId;
        this.name = 'FigmaAPIError';
    }
}
exports.FigmaAPIError = FigmaAPIError;
// Export utility types (keeping file focused on Figma-specific types)
//# sourceMappingURL=figma.types.js.map
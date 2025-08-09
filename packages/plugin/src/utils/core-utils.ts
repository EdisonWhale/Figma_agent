/**
 * Core Utility Functions
 * General-purpose utilities for JSON parsing, validation, and common operations
 */

/**
 * Safely parses JSON without throwing errors.
 */
export function safeJsonParse<T = any>(
  jsonString: string,
  defaultValue: T | null = null
): T {
  try {
    // Basic check for empty or obviously non-JSON strings
    if (
      !jsonString ||
      typeof jsonString !== "string" ||
      jsonString.trim() === ""
    ) {
      console.warn("safeJsonParse: Input string is empty or invalid.");
      return defaultValue !== null ? defaultValue : ({} as T);
    }
    return JSON.parse(jsonString) as T;
  } catch (error) {
    console.error("JSON parse error:", error, "Input:", jsonString); // Log input on error
    if (defaultValue !== null) {
      return defaultValue;
    }
    // Return an empty object or potentially throw a custom error if preferred
    return {} as T;
  }
}

/**
 * Safely stringifies a value to JSON without throwing errors.
 */
export function safeJsonStringify(
  value: any,
  defaultValue: string = "{}"
): string {
  try {
    return JSON.stringify(value);
  } catch (error) {
    console.error("JSON stringify error:", error, "Value:", value); // Log value on error
    return defaultValue;
  }
}

/**
 * Validates if a string is a valid URL
 */
export function isValidUrl(string: string): boolean {
  try {
    new URL(string);
    return true;
  } catch {
    return false;
  }
}

/**
 * Debounces a function call
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | undefined;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Deep clones an object
 */
export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== "object") {
    return obj;
  }
  if (obj instanceof Date) {
    return new Date(obj.getTime()) as unknown as T;
  }
  if (obj instanceof Array) {
    return obj.map(item => deepClone(item)) as unknown as T;
  }
  if (obj instanceof Object) {
    const cloned = {} as T;
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        (cloned as any)[key] = deepClone((obj as any)[key]);
      }
    }
    return cloned;
  }
  return obj;
}

// Safe Object Utilities
// Provides null-safe wrappers for Object methods

/**
 * Safe Object.keys wrapper that handles null/undefined objects
 * @param {*} obj - Object to get keys from
 * @returns {Array} Array of keys or empty array if obj is null/undefined
 */
export const safeObjectKeys = (obj) => {
  if (!obj || typeof obj !== 'object') {
    return [];
  }
  return Object.keys(obj);
};

/**
 * Safe Object.values wrapper that handles null/undefined objects
 * @param {*} obj - Object to get values from
 * @returns {Array} Array of values or empty array if obj is null/undefined
 */
export const safeObjectValues = (obj) => {
  if (!obj || typeof obj !== 'object') {
    return [];
  }
  return Object.values(obj);
};

/**
 * Safe Object.entries wrapper that handles null/undefined objects
 * @param {*} obj - Object to get entries from
 * @returns {Array} Array of entries or empty array if obj is null/undefined
 */
export const safeObjectEntries = (obj) => {
  if (!obj || typeof obj !== 'object') {
    return [];
  }
  return Object.entries(obj);
};

/**
 * Safe property access with default value
 * @param {*} obj - Object to access property from
 * @param {string} prop - Property name
 * @param {*} defaultValue - Default value if property doesn't exist
 * @returns {*} Property value or default value
 */
export const safeGet = (obj, prop, defaultValue = undefined) => {
  if (!obj || typeof obj !== 'object') {
    return defaultValue;
  }
  return obj[prop] !== undefined ? obj[prop] : defaultValue;
};

/**
 * Check if object has property safely
 * @param {*} obj - Object to check
 * @param {string} prop - Property name
 * @returns {boolean} True if object has property
 */
export const safeHas = (obj, prop) => {
  if (!obj || typeof obj !== 'object') {
    return false;
  }
  return obj.hasOwnProperty(prop);
};


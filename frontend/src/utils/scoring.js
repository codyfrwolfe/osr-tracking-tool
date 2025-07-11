// NORMALIZED Scoring Logic for OSR Assessment
// Ensures consistent max points across all stores regardless of Foundation questions

import { QUESTIONS, STORE_FOUNDATIONS } from '../data/osrData.js';

// Constants for standardized scoring
const STANDARD_POINTS_PER_PROCEDURE = 2;
const STANDARD_MAX_POINTS_PER_SECTION = {
  availability: 10,  // 5 questions x 2 points average
  checkout: 10,      // 5 questions x 2 points average
  fulfillment: 8,    // 4 questions x 2 points average
  people: 10,        // 5 questions x 2 points average
  culture: 8         // 4 questions x 2 points average
};
const STANDARD_TOTAL_MAX_POINTS = 46; // Sum of all section standard max points

/**
 * Safe Object.keys wrapper that handles null/undefined objects
 * @param {*} obj - Object to get keys from
 * @returns {Array} Array of keys or empty array if obj is null/undefined
 */
const safeObjectKeys = (obj) => {
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
const safeObjectValues = (obj) => {
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
const safeObjectEntries = (obj) => {
  if (!obj || typeof obj !== 'object') {
    return [];
  }
  return Object.entries(obj);
};
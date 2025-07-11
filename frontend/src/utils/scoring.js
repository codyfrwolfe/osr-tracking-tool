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

/**
 * Calculates the score for a single question based on responses
 * @param {Object} question - The question object with procedures and scoring criteria
 * @param {Object} responses - The responses object with procedure index as keys
 * @returns {Object} Score object with score, color, and details
 */
export const calculateQuestionScore = (question, responses) => {
  // Input validation
  if (!question || typeof question !== 'object') {
    console.error('Invalid question object provided to calculateQuestionScore');
    return { score: 0, color: 'red', details: 'Invalid question data', maxPossibleScore: 0 };
  }

  if (!responses || typeof responses !== 'object') {
    return { score: 0, color: 'red', details: 'No responses provided', maxPossibleScore: 0 };
  }

  // Ensure procedures exist and filter actionable ones
  const procedures = question.procedures || [];
  const actionableProcedures = procedures.filter(p => p && p.type === 'actionable');
  
  if (actionableProcedures.length === 0) {
    return { score: 2, color: 'green', details: 'No actionable procedures to evaluate', maxPossibleScore: 2 };
  }

  let totalScore = 0;
  let maxPossibleScore = 0;
  let totalProceduresAnswered = 0;
  let hasAnyIssues = false;

  // Process each actionable procedure with error handling
  actionableProcedures.forEach((procedure, index) => {
    try {
      // Find the procedure index in the original procedures array
      const procedureIndex = procedures.indexOf(procedure);
      const response = responses[procedureIndex.toString()];
      
      if (!response) return;
      
      totalProceduresAnswered++;
      maxPossibleScore += STANDARD_POINTS_PER_PROCEDURE; // Each procedure can give max 2 points
      
      // Validate response structure
      if (typeof response.hasIssues !== 'string') {
        console.warn('Invalid hasIssues value:', response.hasIssues);
        return;
      }

      if (response.hasIssues.toLowerCase() === 'no') {
        // No issues found = excellent performance = full points
        totalScore += STANDARD_POINTS_PER_PROCEDURE;
      } else if (response.hasIssues.toLowerCase() === 'yes') {
        hasAnyIssues = true;
        
        // Issues found - score depends on follow-up details
        const followUp = (response.followUp || '').trim().toLowerCase();
        
        if (followUp.length === 0) {
          // No follow-up provided = minimal points
          totalScore += 0;
        } else if (followUp.length < 10) {
          // Minimal follow-up = some points
          totalScore += 1;
        } else {
          // Detailed follow-up = more points
          totalScore += 1;
        }
      }
    } catch (error) {
      console.error('Error processing procedure response:', error);
    }
  });

  // If no procedures were answered, return 0 score
  if (totalProceduresAnswered === 0) {
    return { 
      score: 0, 
      color: 'red', 
      details: 'No actionable procedures answered',
      maxPossibleScore: maxPossibleScore || (actionableProcedures.length * STANDARD_POINTS_PER_PROCEDURE)
    };
  }

  // Determine color based on performance
  let color;
  const percentage = maxPossibleScore > 0 ? (totalScore / maxPossibleScore) * 100 : 0;
  
  if (percentage >= 80) {
    color = 'green';
  } else if (percentage >= 60) {
    color = 'yellow';
  } else {
    color = 'red';
  }

  // Generate details message
  let details;
  if (!hasAnyIssues && totalProceduresAnswered === actionableProcedures.length) {
    details = 'No exceptions found - excellent performance';
  } else if (hasAnyIssues) {
    details = `Issues identified in ${totalProceduresAnswered} procedure(s)`;
  } else {
    details = `${totalProceduresAnswered}/${actionableProcedures.length} procedures completed`;
  }

  return {
    score: totalScore,
    maxPossibleScore,
    color,
    details,
    percentage: Math.round(percentage)
  };
};

/**
 * Calculates the score for a section based on all question responses
 * @param {Object} sectionQuestions - The section questions object
 * @param {Object} sectionResponses - All responses for this section (questionId -> procedureIndex -> response)
 * @param {string} sectionKey - The section key for logging
 * @param {string} storeId - The store ID for Foundation question handling
 * @returns {Object} Section score object
 */
export const calculateSectionScore = (sectionQuestions, sectionResponses, sectionKey, storeId = null) => {
  try {
    if (!sectionQuestions || !sectionResponses) {
      console.warn('Missing section questions or responses for section:', sectionKey);
      return {
        score: 0,
        maxPossibleScore: STANDARD_MAX_POINTS_PER_SECTION[sectionKey] || 10,
        color: 'red',
        details: 'No data available',
        percentage: 0,
        questionsScored: 0,
        totalQuestions: 0,
        normalized: true
      };
    }

    // Get all questions for this section
    const processCheckQuestions = sectionQuestions.processCheck || [];
    const foundationQuestions = sectionQuestions.foundations || [];
    
    // Determine if this store has Foundation questions for this section
    const hasFoundationQuestions = storeId && 
      STORE_FOUNDATIONS[storeId] && 
      STORE_FOUNDATIONS[storeId].includes(sectionKey);
    
    // Get all applicable questions for this store/section
    const allQuestions = hasFoundationQuestions 
      ? [...processCheckQuestions, ...foundationQuestions]
      : processCheckQuestions;

    if (allQuestions.length === 0) {
      return {
        score: 0,
        maxPossibleScore: STANDARD_MAX_POINTS_PER_SECTION[sectionKey] || 10,
        color: 'red',
        details: 'No questions in section',
        percentage: 0,
        questionsScored: 0,
        totalQuestions: 0,
        normalized: true
      };
    }

    let totalScore = 0;
    let actualMaxPossibleScore = 0;
    let questionsScored = 0;

    // Calculate score for each question
    allQuestions.forEach(question => {
      if (!question || !question.id) return;

      const questionResponses = sectionResponses[question.id] || {};
      
      // Only score questions that have responses - SAFE CHECK
      const responseKeys = safeObjectKeys(questionResponses);
      if (responseKeys.length > 0) {
        const questionScore = calculateQuestionScore(question, questionResponses);
        totalScore += questionScore.score;
        actualMaxPossibleScore += questionScore.maxPossibleScore;
        questionsScored++;
      } else {
        // Count max possible score even for unanswered questions
        const procedures = question.procedures || [];
        const actionableProcedures = procedures.filter(p => p && p.type === 'actionable');
        actualMaxPossibleScore += actionableProcedures.length * STANDARD_POINTS_PER_PROCEDURE;
      }
    });

    // NORMALIZATION: Use standard max points for this section
    const standardMaxPoints = STANDARD_MAX_POINTS_PER_SECTION[sectionKey] || 10;
    
    // Calculate normalization factor
    const normalizationFactor = actualMaxPossibleScore > 0 
      ? standardMaxPoints / actualMaxPossibleScore 
      : 1;
    
    // Normalize the score
    const normalizedScore = Math.round(totalScore * normalizationFactor);
    
    // Calculate percentage based on normalized values
    const percentage = Math.round((normalizedScore / standardMaxPoints) * 100);
    
    // Determine color based on normalized percentage
    let color;
    if (percentage >= 80) {
      color = 'green';
    } else if (percentage >= 60) {
      color = 'yellow';
    } else {
      color = 'red';
    }

    // Log normalization details for debugging
    if (normalizationFactor !== 1) {
      console.log(`🔄 NORMALIZED SECTION SCORE - ${sectionKey}:`, {
        actualScore: totalScore,
        actualMaxScore: actualMaxPossibleScore,
        normalizedScore,
        standardMaxPoints,
        normalizationFactor,
        percentage
      });
    }

    return {
      score: normalizedScore,
      actualScore: totalScore,
      maxPossibleScore: standardMaxPoints,
      actualMaxPossibleScore,
      color,
      details: `${questionsScored}/${allQuestions.length} questions completed`,
      percentage,
      questionsScored,
      totalQuestions: allQuestions.length,
      normalized: true,
      normalizationFactor
    };

  } catch (error) {
    console.error('Error calculating section score:', error);
    return {
      score: 0,
      maxPossibleScore: STANDARD_MAX_POINTS_PER_SECTION[sectionKey] || 10,
      color: 'red',
      details: 'Error calculating score',
      percentage: 0,
      questionsScored: 0,
      totalQuestions: 0,
      normalized: true
    };
  }
};

/**
 * Calculates the overall score for a store based on all section responses
 * @param {string} storeId - The store ID
 * @param {Object} allResponses - All responses organized by store -> section -> question -> procedure
 * @param {Object} sections - The sections configuration
 * @returns {Object} Store score object
 */
export const calculateStoreScore = (storeId, allResponses, sections) => {
  try {
    if (!storeId || !allResponses || !sections) {
      console.warn('Missing required parameters for store score calculation');
      return {
        score: 0,
        maxPossibleScore: STANDARD_TOTAL_MAX_POINTS,
        color: 'red',
        details: 'No data available',
        percentage: 0,
        completedSections: 0,
        totalSections: sections ? safeObjectKeys(sections).length : 5,
        normalized: true
      };
    }

    const storeResponses = allResponses[storeId] || {};
    const sectionKeys = safeObjectKeys(sections); // SAFE CHECK
    
    let totalScore = 0;
    let totalMaxPossibleScore = 0;
    let completedSections = 0;
    let sectionScores = {};

    // Calculate score for each section
    sectionKeys.forEach(sectionKey => {
      const sectionQuestions = QUESTIONS[sectionKey];
      const sectionResponses = storeResponses[sectionKey] || {};
      
      if (!sectionQuestions) return;

      // Pass storeId to calculateSectionScore for Foundation question handling
      const sectionScore = calculateSectionScore(
        sectionQuestions, 
        sectionResponses, 
        sectionKey,
        storeId
      );
      
      // Use normalized scores
      totalScore += sectionScore.score;
      totalMaxPossibleScore += sectionScore.maxPossibleScore;
      sectionScores[sectionKey] = sectionScore;
      
      // Count as completed if any questions were answered
      if (sectionScore.questionsScored > 0) {
        completedSections++;
      }
    });

    // Ensure total max possible score matches the standard
    if (totalMaxPossibleScore !== STANDARD_TOTAL_MAX_POINTS) {
      console.warn(`⚠️ Total max possible score (${totalMaxPossibleScore}) doesn't match standard (${STANDARD_TOTAL_MAX_POINTS})`);
      // Adjust to standard
      totalMaxPossibleScore = STANDARD_TOTAL_MAX_POINTS;
    }

    // Calculate percentage and determine color
    const percentage = Math.round((totalScore / totalMaxPossibleScore) * 100);
    
    let color;
    if (percentage >= 80) {
      color = 'green';
    } else if (percentage >= 60) {
      color = 'yellow';
    } else {
      color = 'red';
    }

    return {
      score: totalScore,
      maxPossibleScore: totalMaxPossibleScore,
      color,
      details: `${completedSections}/${sectionKeys.length} sections completed`,
      percentage,
      completedSections,
      totalSections: sectionKeys.length,
      section_scores: sectionScores,
      normalized: true
    };

  } catch (error) {
    console.error('Error calculating store score:', error);
    return {
      score: 0,
      maxPossibleScore: STANDARD_TOTAL_MAX_POINTS,
      color: 'red',
      details: 'Error calculating score',
      percentage: 0,
      completedSections: 0,
      totalSections: sections ? safeObjectKeys(sections).length : 5, // SAFE CHECK
      normalized: true
    };
  }
};

/**
 * Helper function to transform flat response keys into nested structure
 * @param {Object} flatResponses - Responses with keys like "store-section-question-procedure"
 * @returns {Object} Nested structure: store -> section -> question -> procedure -> response
 */
export const transformResponsesForScoring = (flatResponses) => {
  const transformed = {};
  
  // SAFE CHECK for flatResponses
  const responseEntries = safeObjectEntries(flatResponses);
  
  responseEntries.forEach(([key, response]) => {
    try {
      const parts = key.split('-');
      if (parts.length < 4) return;
      
      const [storeId, section, questionId, ...procedureIndexParts] = parts;
      const procedureIndex = procedureIndexParts.join('-');
      
      if (!transformed[storeId]) transformed[storeId] = {};
      if (!transformed[storeId][section]) transformed[storeId][section] = {};
      if (!transformed[storeId][section][questionId]) transformed[storeId][section][questionId] = {};
      
      transformed[storeId][section][questionId][procedureIndex] = response;
    } catch (error) {
      console.warn('Error transforming response key:', key, error);
    }
  });
  
  return transformed;
};


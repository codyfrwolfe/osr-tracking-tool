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
 * Transform flat responses into nested structure for scoring
 * @param {Object} responses - Flat responses object
 * @returns {Object} Nested responses structure
 */
export const transformResponsesForScoring = (responses) => {
  if (!responses || typeof responses !== 'object') {
    return {};
  }

  const transformed = {};
  
  safeObjectEntries(responses).forEach(([key, response]) => {
    // Parse the response key: storeId-sectionId-questionId-procedureIndex
    const parts = key.split('-');
    if (parts.length >= 4) {
      const storeId = parts[0];
      const sectionId = parts[1];
      const questionId = parts[2];
      const procedureIndex = parts[3];
      
      // Initialize nested structure
      if (!transformed[storeId]) transformed[storeId] = {};
      if (!transformed[storeId][sectionId]) transformed[storeId][sectionId] = {};
      if (!transformed[storeId][sectionId][questionId]) transformed[storeId][sectionId][questionId] = {};
      
      // Store the response
      transformed[storeId][sectionId][questionId][procedureIndex] = response;
    }
  });
  
  return transformed;
};

/**
 * Calculate section score with normalized points
 * @param {Object} sectionQuestions - Questions for the section
 * @param {Object} sectionResponses - Responses for the section
 * @param {string} sectionKey - Section identifier
 * @param {string} storeId - Store identifier
 * @returns {Object} Section score object
 */
export const calculateSectionScore = (sectionQuestions, sectionResponses, sectionKey, storeId) => {
  try {
    if (!sectionQuestions || !sectionResponses) {
      return {
        score: 0,
        maxPossibleScore: STANDARD_MAX_POINTS_PER_SECTION[sectionKey] || 0,
        percentage: 0,
        color: 'red',
        questions_completed: 0,
        total_questions: 0,
        normalized: true
      };
    }

    // Get all questions for this section
    let allQuestions = [...(sectionQuestions.processCheck || [])];
    
    // Add foundation questions if this store requires them for this section
    const foundations = STORE_FOUNDATIONS[storeId] || [];
    if (foundations.includes(sectionKey)) {
      allQuestions = [...allQuestions, ...(sectionQuestions.foundations || [])];
    }

    if (allQuestions.length === 0) {
      return {
        score: 0,
        maxPossibleScore: STANDARD_MAX_POINTS_PER_SECTION[sectionKey] || 0,
        percentage: 0,
        color: 'red',
        questions_completed: 0,
        total_questions: 0,
        normalized: true
      };
    }

    let totalScore = 0;
    let questionsCompleted = 0;
    let totalPossibleScore = 0;

    // Calculate score for each question
    allQuestions.forEach(question => {
      if (!question?.procedures) return;
      
      const actionableProcedures = question.procedures.filter(p => p?.type === 'actionable');
      if (actionableProcedures.length === 0) {
        questionsCompleted++; // Count instructional-only questions as complete
        return;
      }

      let questionScore = 0;
      let questionMaxScore = actionableProcedures.length * STANDARD_POINTS_PER_PROCEDURE;
      let questionCompleted = true;

      actionableProcedures.forEach((procedure, index) => {
        const procedureIndex = question.procedures.indexOf(procedure);
        const response = sectionResponses[question.id]?.[procedureIndex];
        
        if (response && typeof response.hasIssues === 'string') {
          // Award points based on response
          if (response.hasIssues === 'no') {
            questionScore += STANDARD_POINTS_PER_PROCEDURE;
          } else if (response.hasIssues === 'yes') {
            questionScore += 0; // No points for issues found
          }
        } else {
          questionCompleted = false;
        }
      });

      totalScore += questionScore;
      totalPossibleScore += questionMaxScore;
      
      if (questionCompleted) {
        questionsCompleted++;
      }
    });

    // Use normalized max score for consistency
    const normalizedMaxScore = STANDARD_MAX_POINTS_PER_SECTION[sectionKey] || totalPossibleScore;
    
    // Calculate percentage based on normalized score
    const percentage = normalizedMaxScore > 0 ? Math.round((totalScore / normalizedMaxScore) * 100) : 0;
    
    // Determine color based on percentage
    let color = 'red';
    if (percentage >= 80) color = 'green';
    else if (percentage >= 60) color = 'yellow';

    return {
      score: totalScore,
      maxPossibleScore: normalizedMaxScore,
      percentage,
      color,
      questions_completed: questionsCompleted,
      total_questions: allQuestions.length,
      normalized: true
    };
  } catch (error) {
    console.error('Error calculating section score:', error);
    return {
      score: 0,
      maxPossibleScore: STANDARD_MAX_POINTS_PER_SECTION[sectionKey] || 0,
      percentage: 0,
      color: 'red',
      questions_completed: 0,
      total_questions: 0,
      normalized: true
    };
  }
};

/**
 * Calculate overall store score
 * @param {Object} storeResponses - All responses for a store
 * @param {string} storeId - Store identifier
 * @returns {Object} Overall store score
 */
export const calculateStoreScore = (storeResponses, storeId) => {
  try {
    if (!storeResponses || typeof storeResponses !== 'object') {
      return {
        overall_score: 0,
        overall_max_score: STANDARD_TOTAL_MAX_POINTS,
        overall_percentage: 0,
        overall_color: 'red',
        sections_completed: 0,
        total_sections: 5,
        section_scores: {},
        normalized: true
      };
    }

    let totalScore = 0;
    let totalMaxScore = 0;
    let sectionsCompleted = 0;
    const sectionScores = {};

    // Calculate score for each section
    safeObjectEntries(QUESTIONS).forEach(([sectionKey, sectionQuestions]) => {
      const sectionResponses = storeResponses[sectionKey] || {};
      const sectionScore = calculateSectionScore(sectionQuestions, sectionResponses, sectionKey, storeId);
      
      sectionScores[sectionKey] = sectionScore;
      totalScore += sectionScore.score;
      totalMaxScore += sectionScore.maxPossibleScore;
      
      if (sectionScore.questions_completed > 0) {
        sectionsCompleted++;
      }
    });

    // Use normalized total max score
    const normalizedTotalMaxScore = STANDARD_TOTAL_MAX_POINTS;
    const percentage = normalizedTotalMaxScore > 0 ? Math.round((totalScore / normalizedTotalMaxScore) * 100) : 0;
    
    // Determine overall color
    let color = 'red';
    if (percentage >= 80) color = 'green';
    else if (percentage >= 60) color = 'yellow';

    return {
      overall_score: totalScore,
      overall_max_score: normalizedTotalMaxScore,
      overall_percentage: percentage,
      overall_color: color,
      sections_completed: sectionsCompleted,
      total_sections: 5,
      section_scores: sectionScores,
      normalized: true
    };
  } catch (error) {
    console.error('Error calculating store score:', error);
    return {
      overall_score: 0,
      overall_max_score: STANDARD_TOTAL_MAX_POINTS,
      overall_percentage: 0,
      overall_color: 'red',
      sections_completed: 0,
      total_sections: 5,
      section_scores: {},
      normalized: true
    };
  }
};



/**
 * Calculate score for a single question
 * @param {Object} question - Question object
 * @param {Object} questionResponses - Responses for this question
 * @returns {Object} Question score object
 */
export const calculateQuestionScore = (question, questionResponses) => {
  try {
    if (!question?.procedures) {
      return {
        score: 0,
        maxPossibleScore: 0,
        percentage: 0,
        color: 'red',
        completed: false
      };
    }

    const actionableProcedures = question.procedures.filter(p => p?.type === 'actionable');
    
    if (actionableProcedures.length === 0) {
      // Instructional-only questions are considered complete
      return {
        score: 0,
        maxPossibleScore: 0,
        percentage: 100,
        color: 'green',
        completed: true
      };
    }

    let questionScore = 0;
    let questionMaxScore = actionableProcedures.length * STANDARD_POINTS_PER_PROCEDURE;
    let completedProcedures = 0;

    actionableProcedures.forEach((procedure, index) => {
      const procedureIndex = question.procedures.indexOf(procedure);
      const response = questionResponses?.[procedureIndex];
      
      if (response && typeof response.hasIssues === 'string') {
        completedProcedures++;
        
        // Award points based on response
        if (response.hasIssues === 'no') {
          questionScore += STANDARD_POINTS_PER_PROCEDURE;
        } else if (response.hasIssues === 'yes') {
          questionScore += 0; // No points for issues found
        }
      }
    });

    const completed = completedProcedures === actionableProcedures.length;
    const percentage = questionMaxScore > 0 ? Math.round((questionScore / questionMaxScore) * 100) : 0;
    
    // Determine color based on percentage
    let color = 'red';
    if (percentage >= 80) color = 'green';
    else if (percentage >= 60) color = 'yellow';

    return {
      score: questionScore,
      maxPossibleScore: questionMaxScore,
      percentage,
      color,
      completed
    };
  } catch (error) {
    console.error('Error calculating question score:', error);
    return {
      score: 0,
      maxPossibleScore: 0,
      percentage: 0,
      color: 'red',
      completed: false
    };
  }
};


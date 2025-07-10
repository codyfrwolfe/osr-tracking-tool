import { useState, useEffect, useCallback, useMemo } from 'react';

/**
 * Enhanced localStorage hook with error handling, validation, and performance optimizations
 * @param {string} key - The localStorage key
 * @param {*} initialValue - The initial value if no stored value exists
 * @param {Object} options - Configuration options
 * @returns {Array} [storedValue, setValue, { error, isLoading, clear }]
 */
export function useLocalStorage(key, initialValue, options = {}) {
  const {
    serialize = JSON.stringify,
    deserialize = JSON.parse,
    validator = null,
    onError = console.error
  } = options;

  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize state with error handling
  const [storedValue, setStoredValue] = useState(() => {
    if (typeof window === 'undefined') {
      return initialValue;
    }

    try {
      setIsLoading(true);
      const item = window.localStorage.getItem(key);
      
      if (item === null) {
        return initialValue;
      }

      const parsed = deserialize(item);
      
      // Validate data if validator is provided
      if (validator && !validator(parsed)) {
        console.warn(`Invalid data found in localStorage for key "${key}", using initial value`);
        return initialValue;
      }

      return parsed;
    } catch (error) {
      const errorMessage = `Error reading localStorage key "${key}": ${error.message}`;
      onError(errorMessage, error);
      setError(errorMessage);
      return initialValue;
    } finally {
      setIsLoading(false);
    }
  });

  // Enhanced setValue with validation and error handling
  const setValue = useCallback((value) => {
    if (typeof window === 'undefined') {
      console.warn('localStorage is not available in this environment');
      return;
    }

    try {
      setError(null);
      
      // Allow value to be a function so we have the same API as useState
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      
      // Validate data if validator is provided
      if (validator && !validator(valueToStore)) {
        throw new Error('Data validation failed');
      }

      // Update state
      setStoredValue(valueToStore);
      
      // Save to localStorage
      if (valueToStore === undefined) {
        window.localStorage.removeItem(key);
      } else {
        window.localStorage.setItem(key, serialize(valueToStore));
      }
    } catch (error) {
      const errorMessage = `Error setting localStorage key "${key}": ${error.message}`;
      onError(errorMessage, error);
      setError(errorMessage);
    }
  }, [key, serialize, validator, onError, storedValue]);

  // Clear function
  const clear = useCallback(() => {
    try {
      setError(null);
      setStoredValue(initialValue);
      window.localStorage.removeItem(key);
    } catch (error) {
      const errorMessage = `Error clearing localStorage key "${key}": ${error.message}`;
      onError(errorMessage, error);
      setError(errorMessage);
    }
  }, [key, initialValue, onError]);

  // Listen for changes from other tabs/windows
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleStorageChange = (e) => {
      if (e.key === key && e.newValue !== serialize(storedValue)) {
        try {
          const newValue = e.newValue ? deserialize(e.newValue) : initialValue;
          
          // Validate data if validator is provided
          if (validator && !validator(newValue)) {
            console.warn(`Invalid data received from storage event for key "${key}"`);
            return;
          }
          
          setStoredValue(newValue);
          setError(null);
        } catch (error) {
          const errorMessage = `Error handling storage change for key "${key}": ${error.message}`;
          onError(errorMessage, error);
          setError(errorMessage);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [key, storedValue, serialize, deserialize, validator, initialValue, onError]);

  // Return enhanced API
  return [storedValue, setValue, { error, isLoading, clear }];
}

/**
 * Enhanced hook for managing assessment responses with auto-save, validation, and performance optimizations
 */
export function useAssessmentData() {
  // Validator function for response data
  const responseValidator = useCallback((data) => {
    if (!data || typeof data !== 'object') return false;
    
    // Validate each response entry
    for (const [key, response] of Object.entries(data)) {
      if (!key || typeof key !== 'string') return false;
      if (!response || typeof response !== 'object') return false;
      if (!response.timestamp || typeof response.timestamp !== 'string') return false;
    }
    
    return true;
  }, []);

  const [responses, setResponses, { error, isLoading, clear }] = useLocalStorage(
    'osr-assessment-responses', 
    {},
    {
      validator: responseValidator,
      onError: (message, error) => {
        console.error('Assessment data error:', message, error);
        // Could integrate with error reporting service here
      }
    }
  );

  // Memoized helper functions for better performance
  const saveResponse = useCallback((storeId, section, questionId, procedureIndex, response) => {
    if (!storeId || !section || !questionId || procedureIndex === undefined || !response) {
      console.error('Invalid parameters provided to saveResponse');
      return;
    }

    try {
      const key = `${storeId}-${section}-${questionId}-${procedureIndex}`;
      const enhancedResponse = {
        ...response,
        timestamp: new Date().toISOString(),
        version: '1.0' // For future data migration support
      };

      setResponses(prev => ({
        ...prev,
        [key]: enhancedResponse
      }));
    } catch (error) {
      console.error('Error saving response:', error);
    }
  }, [setResponses]);

  const getResponse = useCallback((storeId, section, questionId, procedureIndex) => {
    if (!storeId || !section || !questionId || procedureIndex === undefined) {
      console.error('Invalid parameters provided to getResponse');
      return null;
    }

    try {
      const key = `${storeId}-${section}-${questionId}-${procedureIndex}`;
      return responses[key] || null;
    } catch (error) {
      console.error('Error getting response:', error);
      return null;
    }
  }, [responses]);

  const getSectionResponses = useCallback((storeId, section) => {
    if (!storeId || !section) {
      console.error('Invalid parameters provided to getSectionResponses');
      return {};
    }

    try {
      const prefix = `${storeId}-${section}-`;
      return Object.keys(responses)
        .filter(key => key.startsWith(prefix))
        .reduce((acc, key) => {
          acc[key] = responses[key];
          return acc;
        }, {});
    } catch (error) {
      console.error('Error getting section responses:', error);
      return {};
    }
  }, [responses]);

  // Get all responses for a specific store
  const getStoreResponses = useCallback((storeId) => {
    if (!storeId) {
      console.error('Invalid storeId provided to getStoreResponses');
      return {};
    }

    try {
      const prefix = `${storeId}-`;
      return Object.keys(responses)
        .filter(key => key.startsWith(prefix))
        .reduce((acc, key) => {
          acc[key] = responses[key];
          return acc;
        }, {});
    } catch (error) {
      console.error('Error getting store responses:', error);
      return {};
    }
  }, [responses]);

  // Transform responses for scoring calculations (memoized for performance)
  const getTransformedResponses = useMemo(() => {
    try {
      const transformed = {};
      
      Object.entries(responses).forEach(([key, response]) => {
        try {
          const [storeId, section, questionId, procedureIndex] = key.split('-');
          
          if (!storeId || !section || !questionId || procedureIndex === undefined) {
            console.warn('Invalid response key format:', key);
            return;
          }

          // Initialize nested structure
          if (!transformed[storeId]) transformed[storeId] = {};
          if (!transformed[storeId][section]) transformed[storeId][section] = {};
          if (!transformed[storeId][section][questionId]) transformed[storeId][section][questionId] = {};

          // Store response by procedure index
          transformed[storeId][section][questionId][procedureIndex] = response;
        } catch (error) {
          console.warn('Error processing response key:', key, error);
        }
      });

      return transformed;
    } catch (error) {
      console.error('Error transforming responses:', error);
      return {};
    }
  }, [responses]);

  // Get completion statistics
  const getCompletionStats = useCallback((storeId, section = null) => {
    try {
      const storeResponses = getStoreResponses(storeId);
      const totalResponses = Object.keys(storeResponses).length;
      
      if (section) {
        const sectionResponses = getSectionResponses(storeId, section);
        return {
          totalResponses: Object.keys(sectionResponses).length,
          lastUpdated: Math.max(...Object.values(sectionResponses).map(r => new Date(r.timestamp).getTime())) || null
        };
      }

      return {
        totalResponses,
        lastUpdated: totalResponses > 0 ? Math.max(...Object.values(storeResponses).map(r => new Date(r.timestamp).getTime())) : null
      };
    } catch (error) {
      console.error('Error getting completion stats:', error);
      return { totalResponses: 0, lastUpdated: null };
    }
  }, [getStoreResponses, getSectionResponses]);

  // Clear responses for a specific store or section
  const clearResponses = useCallback((storeId = null, section = null) => {
    try {
      if (!storeId) {
        // Clear all responses
        clear();
        return;
      }

      if (section) {
        // Clear specific section
        const prefix = `${storeId}-${section}-`;
        setResponses(prev => {
          const filtered = {};
          Object.keys(prev).forEach(key => {
            if (!key.startsWith(prefix)) {
              filtered[key] = prev[key];
            }
          });
          return filtered;
        });
      } else {
        // Clear entire store
        const prefix = `${storeId}-`;
        setResponses(prev => {
          const filtered = {};
          Object.keys(prev).forEach(key => {
            if (!key.startsWith(prefix)) {
              filtered[key] = prev[key];
            }
          });
          return filtered;
        });
      }
    } catch (error) {
      console.error('Error clearing responses:', error);
    }
  }, [clear, setResponses]);

  return {
    responses,
    transformedResponses: getTransformedResponses,
    saveResponse,
    getResponse,
    getSectionResponses,
    getStoreResponses,
    getCompletionStats,
    clearResponses,
    error,
    isLoading
  };
}


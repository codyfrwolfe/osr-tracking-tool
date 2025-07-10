import { useState, useEffect, useCallback, useRef } from 'react';
import apiService from '../services/apiService';

/**
 * Custom hook for shared storage across multiple users
 * Replaces localStorage with backend API for collaborative assessments
 */
export const useSharedStorage = (key, initialValue = {}) => {
  const [value, setValue] = useState(initialValue);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isOnline, setIsOnline] = useState(true);
  const intervalRef = useRef(null);

  // Load initial data from backend
  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Check if backend is available
      const isHealthy = await apiService.healthCheck();
      setIsOnline(isHealthy);

      if (isHealthy) {
        const responses = await apiService.getAllResponses();
        setValue(responses || initialValue);
      } else {
        // Fallback to localStorage if backend is unavailable
        const stored = localStorage.getItem(key);
        if (stored) {
          try {
            setValue(JSON.parse(stored));
          } catch (parseError) {
            console.warn('Failed to parse stored data, using initial value');
            setValue(initialValue);
          }
        } else {
          setValue(initialValue);
        }
      }
    } catch (err) {
      console.error('Failed to load data:', err);
      setError(err.message);
      setIsOnline(false);
      
      // Fallback to localStorage
      try {
        const stored = localStorage.getItem(key);
        if (stored) {
          setValue(JSON.parse(stored));
        } else {
          setValue(initialValue);
        }
      } catch (fallbackError) {
        setValue(initialValue);
      }
    } finally {
      setIsLoading(false);
    }
  }, [key, initialValue]);

  // Save data to backend
  const saveData = useCallback(async (newValue) => {
    try {
      setValue(newValue);
      
      // Always save to localStorage as backup
      localStorage.setItem(key, JSON.stringify(newValue));

      if (isOnline) {
        // The actual saving to backend happens in the component level
        // This hook just manages the local state
        return true;
      }
    } catch (err) {
      console.error('Failed to save data:', err);
      setError(err.message);
      return false;
    }
  }, [key, isOnline]);

  // Periodic sync with backend
  const startPeriodicSync = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    intervalRef.current = setInterval(async () => {
      try {
        const isHealthy = await apiService.healthCheck();
        setIsOnline(isHealthy);

        if (isHealthy) {
          const responses = await apiService.getAllResponses();
          setValue(responses || {});
          setError(null);
        }
      } catch (err) {
        console.warn('Periodic sync failed:', err);
        setIsOnline(false);
      }
    }, 30000); // Sync every 30 seconds
  }, []);

  const stopPeriodicSync = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // Initialize on mount
  useEffect(() => {
    loadData();
    startPeriodicSync();

    return () => {
      stopPeriodicSync();
    };
  }, [loadData, startPeriodicSync, stopPeriodicSync]);

  // Handle online/offline events
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      loadData();
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [loadData]);

  return {
    value,
    setValue: saveData,
    isLoading,
    error,
    isOnline,
    reload: loadData,
    startSync: startPeriodicSync,
    stopSync: stopPeriodicSync
  };
};

/**
 * Hook specifically for OSR responses with backend integration
 */
export const useOSRResponses = () => {
  const {
    value: responses,
    setValue: setResponses,
    isLoading,
    error,
    isOnline,
    reload
  } = useSharedStorage('osr-responses', {});

  // Save a single response
  const saveResponse = useCallback(async (storeId, section, questionId, procedureIndex, response) => {
    try {
      const responseKey = `${storeId}-${section}-${questionId}-${procedureIndex}`;
      
      // Update local state immediately for better UX
      const newResponses = {
        ...responses,
        [responseKey]: response
      };
      setResponses(newResponses);

      // Save to backend if online
      if (isOnline) {
        await apiService.saveResponse(storeId, section, questionId, procedureIndex, response);
      }

      return true;
    } catch (err) {
      console.error('Failed to save response:', err);
      return false;
    }
  }, [responses, setResponses, isOnline]);

  // Get a single response
  const getResponse = useCallback((storeId, section, questionId, procedureIndex) => {
    const responseKey = `${storeId}-${section}-${questionId}-${procedureIndex}`;
    return responses[responseKey] || null;
  }, [responses]);

  // Get all responses for a store
  const getStoreResponses = useCallback((storeId) => {
    const storeResponses = {};
    Object.entries(responses).forEach(([key, response]) => {
      if (key.startsWith(`${storeId}-`)) {
        storeResponses[key] = response;
      }
    });
    return storeResponses;
  }, [responses]);

  // Get all responses for a section
  const getSectionResponses = useCallback((storeId, section) => {
    const sectionResponses = {};
    Object.entries(responses).forEach(([key, response]) => {
      if (key.startsWith(`${storeId}-${section}-`)) {
        sectionResponses[key] = response;
      }
    });
    return sectionResponses;
  }, [responses]);

  // Delete a response
  const deleteResponse = useCallback(async (storeId, section, questionId, procedureIndex) => {
    try {
      const responseKey = `${storeId}-${section}-${questionId}-${procedureIndex}`;
      
      // Update local state
      const newResponses = { ...responses };
      delete newResponses[responseKey];
      setResponses(newResponses);

      // Delete from backend if online
      if (isOnline) {
        await apiService.deleteResponse(responseKey);
      }

      return true;
    } catch (err) {
      console.error('Failed to delete response:', err);
      return false;
    }
  }, [responses, setResponses, isOnline]);

  return {
    responses,
    saveResponse,
    getResponse,
    getStoreResponses,
    getSectionResponses,
    deleteResponse,
    isLoading,
    error,
    isOnline,
    reload
  };
};


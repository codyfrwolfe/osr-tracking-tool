import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { ChevronRight, ChevronLeft, CheckCircle, AlertTriangle, Zap, Info, Home, List, Wifi, WifiOff } from 'lucide-react';
import { calculateQuestionScore } from '../utils/scoring';
import ErrorBoundary from './ErrorBoundary';
import LoadingSpinner from './LoadingSpinner';
import apiService from '../utils/apiService';

const Assessment = ({ 
  store, 
  section, 
  questions, 
  sectionInfo, 
  onSaveResponse, 
  onGetResponse, 
  onFinish,
  onNavigateToSections,
  onNavigateToStores,
  onRefreshProgress
}) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [responses, setResponses] = useState({});
  const [pendingResponses, setPendingResponses] = useState({});
  const [questionScores, setQuestionScores] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);
  const [backendStatus, setBackendStatus] = useState({ isHealthy: false });

  // Memoize current question to prevent unnecessary re-renders
  const currentQuestion = useMemo(() => {
    return questions?.[currentQuestionIndex] || null;
  }, [questions, currentQuestionIndex]);

  const isLastQuestion = useMemo(() => {
    return currentQuestionIndex === questions.length - 1;
  }, [currentQuestionIndex, questions.length]);

  // Update backend status
  useEffect(() => {
    const updateBackendStatus = () => {
      setBackendStatus(apiService.getBackendStatus());
    };
    
    updateBackendStatus();
    const interval = setInterval(updateBackendStatus, 30000); // Update every 30 seconds
    
    return () => clearInterval(interval);
  }, []);

  // FIXED: Load responses with better error handling
  useEffect(() => {
    const loadResponses = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        if (!questions || questions.length === 0) {
          setError('No questions available for this section');
          return;
        }

        const loadedResponses = {};
        
        // Try to load from API first
        try {
          const apiResult = await apiService.getResponses(store, section);
          if (apiResult.success && apiResult.responses) {
            // Convert API responses to local format
            for (const [responseKey, response] of Object.entries(apiResult.responses)) {
              loadedResponses[responseKey] = response;
            }
            console.log('Loaded responses from API:', loadedResponses);
          }
        } catch (error) {
          console.warn('Failed to load from API, trying localStorage:', error);
        }
        
        // Load from localStorage for any missing responses
        for (const question of questions) {
          if (!question?.procedures) continue;
          
          for (let procedureIndex = 0; procedureIndex < question.procedures.length; procedureIndex++) {
            const responseKey = `${question.id}-${procedureIndex}`;
            
            // Skip if already loaded from API
            if (loadedResponses[responseKey]) continue;
            
            try {
              // Try localStorage
              const storageKey = `osr_response_${store}_${section}_${question.id}_${procedureIndex}`;
              const storedResponse = localStorage.getItem(storageKey);
              if (storedResponse) {
                loadedResponses[responseKey] = JSON.parse(storedResponse);
              } else {
                // Fallback to prop-based response
                const response = onGetResponse?.(store, section, question.id, procedureIndex);
                if (response) {
                  loadedResponses[responseKey] = response;
                }
              }
            } catch (error) {
              console.warn(`Error loading response for ${question.id}-${procedureIndex}:`, error);
            }
          }
        }
        
        setResponses(loadedResponses);
        console.log('Final loaded responses:', loadedResponses);
      } catch (error) {
        console.error('Error loading responses:', error);
        setError('Failed to load existing responses');
      } finally {
        setIsLoading(false);
      }
    };

    loadResponses();
  }, [store, section]); // FIXED: Removed questions and onGetResponse to prevent excessive re-runs

  // Calculate scores when responses change
  const calculateScores = useCallback(() => {
    if (!questions || questions.length === 0) return;

    try {
      const newScores = {};
      
      questions.forEach((question) => {
        if (!question?.procedures) return;
        
        const questionResponses = {};
        
        question.procedures.forEach((procedure, procedureIndex) => {
          if (procedure?.type === 'actionable') {
            const responseKey = `${question.id}-${procedureIndex}`;
            const response = responses[responseKey] || pendingResponses[responseKey];
            if (response) {
              questionResponses[procedureIndex.toString()] = response;
            }
          }
        });
        
        if (Object.keys(questionResponses).length > 0) {
          const score = calculateQuestionScore(question, questionResponses);
          if (score) {
            newScores[question.id] = score;
          }
        }
      });
      
      setQuestionScores(newScores);
    } catch (error) {
      console.error('Error calculating scores:', error);
    }
  }, [responses, pendingResponses, questions]);

  useEffect(() => {
    calculateScores();
  }, [calculateScores]);

  // FIXED: Handle procedure response without page refresh
  const handleProcedureResponse = useCallback((questionId, procedureIndex, hasIssue, followUp = '') => {
    try {
      // Prevent any form submission or page refresh
      if (event) {
        event.preventDefault();
        event.stopPropagation();
      }

      // Validate inputs
      if (!questionId || procedureIndex === undefined) {
        console.error('Invalid question ID or procedure index');
        return;
      }

      const responseKey = `${questionId}-${procedureIndex}`;
      const response = {
        hasIssues: hasIssue ? 'yes' : 'no',
        followUp: followUp.trim(),
        timestamp: new Date().toISOString(),
        version: '1.0'
      };
      
      // Update local state immediately for responsive UI
      setResponses(prev => ({
        ...prev,
        [responseKey]: response
      }));
      
      // Store in pending responses for batch saving
      setPendingResponses(prev => ({
        ...prev,
        [responseKey]: response
      }));
      
      // Save to localStorage immediately as backup
      try {
        const storageKey = `osr_response_${store}_${section}_${questionId}_${procedureIndex}`;
        localStorage.setItem(storageKey, JSON.stringify(response));
        console.log(`Saved to localStorage: ${storageKey}`);
      } catch (storageError) {
        console.error('Error saving to localStorage:', storageError);
      }
      
      // Also call the prop-based save function for compatibility
      if (onSaveResponse) {
        try {
          onSaveResponse(store, section, questionId, procedureIndex, response);
        } catch (error) {
          console.error('Error calling onSaveResponse:', error);
        }
      }
      
    } catch (error) {
      console.error('Error handling procedure response:', error);
      setError('Failed to process response. Please try again.');
    }
  }, [store, section, onSaveResponse]);

  // FIXED: Batch save pending responses with progress refresh
  const savePendingResponses = useCallback(async () => {
    if (Object.keys(pendingResponses).length === 0) return;

    try {
      setIsSaving(true);
      
      // Try batch save first
      const batchResult = await apiService.batchSaveResponses(store, section, pendingResponses);
      
      if (batchResult.success) {
        console.log('Batch save successful');
        setPendingResponses({}); // Clear pending responses
        
        // Refresh scores after saving
        try {
          await apiService.refreshScores(store, section);
          
          // FIXED: Refresh store progress only after successful batch save
          if (onRefreshProgress) {
            onRefreshProgress(store);
          }
        } catch (error) {
          console.warn('Failed to refresh scores:', error);
        }
      } else {
        console.warn('Batch save failed, responses saved locally');
      }
    } catch (error) {
      console.error('Error saving pending responses:', error);
    } finally {
      setIsSaving(false);
    }
  }, [store, section, pendingResponses, onRefreshProgress]);

  // Check if question is complete
  const isQuestionComplete = useCallback((question) => {
    if (!question?.procedures) return false;
    
    const actionableProcedures = question.procedures.filter(p => p?.type === 'actionable');
    
    return actionableProcedures.every((procedure, index) => {
      const procedureIndex = question.procedures.indexOf(procedure);
      const response = responses[`${question.id}-${procedureIndex}`] || pendingResponses[`${question.id}-${procedureIndex}`];
      return response && typeof response.hasIssues === 'string';
    });
  }, [responses, pendingResponses]);

  // Navigation handlers with validation
  const canProceedToNext = useCallback(() => {
    return currentQuestion && isQuestionComplete(currentQuestion);
  }, [currentQuestion, isQuestionComplete]);

  const canFinishSection = useCallback(() => {
    return questions.every(question => isQuestionComplete(question));
  }, [questions, isQuestionComplete]);

  // FIXED: Navigation without page refresh
  const handleNext = useCallback(async (e) => {
    // Prevent any form submission or page refresh
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    if (!canProceedToNext() || isLastQuestion) return;
    
    // Save pending responses before navigation
    await savePendingResponses();
    
    // Simple state update - no page refresh
    setCurrentQuestionIndex(prev => prev + 1);
  }, [canProceedToNext, isLastQuestion, savePendingResponses]);

  const handlePrevious = useCallback((e) => {
    // Prevent any form submission or page refresh
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    if (currentQuestionIndex <= 0) return;
    
    // Simple state update - no page refresh
    setCurrentQuestionIndex(prev => prev - 1);
  }, [currentQuestionIndex]);

  // FIXED: Finish section without page refresh
  const handleFinish = useCallback(async (e) => {
    // Prevent any form submission or page refresh
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    if (!canFinishSection()) return;
    
    try {
      // Save all pending responses before finishing
      await savePendingResponses();
      
      // Call the finish handler
      if (onFinish) {
        onFinish();
      }
    } catch (error) {
      console.error('Error finishing section:', error);
      setError('Failed to complete section. Please try again.');
    }
  }, [canFinishSection, savePendingResponses, onFinish]);

  // Navigation handlers
  const handleNavigateToSections = useCallback((e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    // Save pending responses before navigation
    savePendingResponses();
    
    if (onNavigateToSections) {
      onNavigateToSections();
    }
  }, [onNavigateToSections, savePendingResponses]);

  const handleNavigateToStores = useCallback((e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    // Save pending responses before navigation
    savePendingResponses();
    
    if (onNavigateToStores) {
      onNavigateToStores();
    }
  }, [onNavigateToStores, savePendingResponses]);

  // Utility functions for UI
  const getQuestionTypeLabel = useCallback((questionId) => {
    if (!questionId) return null;
    
    if (questionId.includes('_fd_')) {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
          Foundation Question
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          Process Check
        </span>
      );
    }
  }, []);

  const getScoreBadge = useCallback((score) => {
    if (!score) return null;
    
    const colorClass = score.color === 'green' ? 'score-green' : 
                      score.color === 'yellow' ? 'score-yellow' : 'score-red';
    
    return (
      <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${colorClass}`}>
        Current Score: {score.color.toUpperCase()} ({score.score} pts)
        {score.details && (
          <span className="ml-2 text-xs opacity-75">
            {score.details}
          </span>
        )}
      </div>
    );
  }, []);

  // Loading state
  if (isLoading) {
    return (
      <div className="fade-in max-w-4xl mx-auto">
        <LoadingSpinner message="Loading assessment..." />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="fade-in max-w-4xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <AlertTriangle className="h-12 w-12 text-red-600 mx-auto mb-4" />
          <h3 className="heading-tertiary text-red-900 mb-2">Assessment Error</h3>
          <p className="text-body text-red-700 mb-4">{error}</p>
          <button 
            type="button"
            onClick={() => window.location.reload()} 
            className="btn-walmart"
          >
            Reload Page
          </button>
        </div>
      </div>
    );
  }

  // No questions available
  if (!questions || questions.length === 0) {
    return (
      <div className="fade-in max-w-4xl mx-auto">
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 text-center">
          <AlertTriangle className="h-12 w-12 text-yellow-600 mx-auto mb-4" />
          <h3 className="heading-tertiary text-yellow-900 mb-2">No Questions Available</h3>
          <p className="text-body text-yellow-700">
            No questions are available for this section at the moment.
          </p>
        </div>
      </div>
    );
  }

  // No current question
  if (!currentQuestion) {
    return (
      <div className="fade-in max-w-4xl mx-auto">
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 text-center">
          <AlertTriangle className="h-12 w-12 text-yellow-600 mx-auto mb-4" />
          <h3 className="heading-tertiary text-yellow-900 mb-2">Question Not Found</h3>
          <p className="text-body text-yellow-700">
            The requested question could not be found.
          </p>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="fade-in max-w-4xl mx-auto space-y-6">
        {/* Navigation Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                type="button"
                onClick={handleNavigateToStores}
                className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200"
              >
                <Home className="h-4 w-4" />
                <span>Store Selection</span>
              </button>
              <span className="text-gray-300">|</span>
              <button
                type="button"
                onClick={handleNavigateToSections}
                className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200"
              >
                <List className="h-4 w-4" />
                <span>Section Selection</span>
              </button>
            </div>
            
            {/* Backend Status Indicator */}
            <div className="flex items-center space-x-4">
              {Object.keys(pendingResponses).length > 0 && (
                <div className="flex items-center space-x-2 text-yellow-600">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                  <span className="text-sm">{Object.keys(pendingResponses).length} pending</span>
                </div>
              )}
              
              {isSaving && (
                <div className="flex items-center space-x-2 text-blue-600">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                  <span className="text-sm">Saving...</span>
                </div>
              )}
              
              <div className={`flex items-center space-x-2 ${backendStatus.isHealthy ? 'text-green-600' : 'text-red-600'}`}>
                {backendStatus.isHealthy ? <Wifi className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />}
                <span className="text-sm">{backendStatus.isHealthy ? 'Connected' : 'Offline'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Question Header */}
        <div className="professional-card p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="heading-secondary flex items-center space-x-2">
                <span className="text-2xl">{sectionInfo?.icon || '📋'}</span>
                <span>{sectionInfo?.title || section}</span>
              </h2>
              <p className="text-body">
                Store {store} – Question {currentQuestionIndex + 1} of {questions.length}
              </p>
            </div>
            <div className="text-right">
              {getQuestionTypeLabel(currentQuestion.id)}
              {questionScores[currentQuestion.id] && (
                <div className="mt-2">
                  {getScoreBadge(questionScores[currentQuestion.id])}
                </div>
              )}
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-6">
            <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
              <span>Progress</span>
              <span>{Math.round(((currentQuestionIndex + 1) / questions.length) * 100)}% Complete</span>
            </div>
            <div className="progress-bar">
              <div 
                className="progress-fill"
                style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Question Content */}
        <div className="professional-card p-6">
          <h3 className="heading-tertiary mb-6">{currentQuestion.text}</h3>

          {/* Rating Guidance */}
          {currentQuestion.ratingGuidance && (
            <div className="mb-6">
              <h4 className="font-semibold text-gray-900 mb-4">Rating Guidance</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {Object.entries(currentQuestion.ratingGuidance).map(([level, guidance]) => (
                  <div key={level} className={`p-4 rounded-lg border-2 ${
                    level === 'green' ? 'bg-green-50 border-green-200' :
                    level === 'yellow' ? 'bg-yellow-50 border-yellow-200' :
                    'bg-red-50 border-red-200'
                  }`}>
                    <h5 className={`font-semibold mb-2 ${
                      level === 'green' ? 'text-green-800' :
                      level === 'yellow' ? 'text-yellow-800' :
                      'text-red-800'
                    }`}>
                      {level.charAt(0).toUpperCase() + level.slice(1)} ({guidance.points} pts)
                    </h5>
                    <p className={`text-sm ${
                      level === 'green' ? 'text-green-700' :
                      level === 'yellow' ? 'text-yellow-700' :
                      'text-red-700'
                    }`}>
                      {guidance.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Procedures */}
          <div className="space-y-4">
            <h4 className="font-semibold text-gray-900 mb-4">Procedures</h4>
            
            {currentQuestion.procedures?.map((procedure, procedureIndex) => {
              const responseKey = `${currentQuestion.id}-${procedureIndex}`;
              const response = responses[responseKey] || pendingResponses[responseKey];
              
              if (procedure.type === 'instructional') {
                return (
                  <div key={procedureIndex} className="bg-blue-50 rounded-lg p-4 border-l-4 border-blue-400">
                    <div className="flex items-start space-x-3">
                      <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                      <p className="text-blue-800">{procedure.text}</p>
                    </div>
                  </div>
                );
              }

              return (
                <div key={procedureIndex} className="border border-gray-200 rounded-lg p-6 hover:border-gray-300 transition-colors">
                  <div className="flex items-start space-x-3 mb-4">
                    <Zap className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-gray-900 mb-3">{procedure.text}</p>
                      
                      <div className="space-y-4">
                        <div>
                          <p className="text-sm font-medium text-gray-700 mb-2" id={`question-${currentQuestion.id}-${procedureIndex}`}>
                            Were any issues found during this procedure?
                          </p>
                          <div className="flex space-x-4" role="group" aria-labelledby={`question-${currentQuestion.id}-${procedureIndex}`}>
                            <button
                              type="button"
                              id={`yes-${currentQuestion.id}-${procedureIndex}`}
                              name={`response-${currentQuestion.id}-${procedureIndex}`}
                              aria-describedby={`question-${currentQuestion.id}-${procedureIndex}`}
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleProcedureResponse(currentQuestion.id, procedureIndex, true, response?.followUp || '');
                              }}
                              className={`px-4 py-2 rounded-lg border transition-all duration-200 ${
                                response?.hasIssues === 'yes'
                                  ? 'bg-red-100 border-red-300 text-red-800'
                                  : 'bg-white border-gray-300 text-gray-700 hover:bg-red-50'
                              }`}
                            >
                              Yes
                            </button>
                            <button
                              type="button"
                              id={`no-${currentQuestion.id}-${procedureIndex}`}
                              name={`response-${currentQuestion.id}-${procedureIndex}`}
                              aria-describedby={`question-${currentQuestion.id}-${procedureIndex}`}
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleProcedureResponse(currentQuestion.id, procedureIndex, false, '');
                              }}
                              className={`px-4 py-2 rounded-lg border transition-all duration-200 ${
                                response?.hasIssues === 'no'
                                  ? 'bg-green-100 border-green-300 text-green-800'
                                  : 'bg-white border-gray-300 text-gray-700 hover:bg-green-50'
                              }`}
                            >
                              No
                            </button>
                          </div>
                        </div>

                        {response?.hasIssues === 'yes' && procedure.followUp && (
                          <div className="slide-in">
                            <label htmlFor={`followup-${currentQuestion.id}-${procedureIndex}`} className="block text-sm font-medium text-gray-700 mb-2">
                              {procedure.followUp}
                            </label>
                            <input
                              type="text"
                              id={`followup-${currentQuestion.id}-${procedureIndex}`}
                              name={`followup-${currentQuestion.id}-${procedureIndex}`}
                              value={response.followUp || ''}
                              onChange={(e) => handleProcedureResponse(currentQuestion.id, procedureIndex, true, e.target.value)}
                              className="form-input"
                              placeholder="Enter details..."
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Navigation - No form wrapper to prevent submission */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={handlePrevious}
            disabled={currentQuestionIndex === 0}
            className={`flex items-center space-x-2 px-6 py-3 rounded-lg transition-all duration-200 ${
              currentQuestionIndex === 0
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'btn-walmart-outline'
            }`}
          >
            <ChevronLeft className="h-4 w-4" />
            <span>Previous</span>
          </button>

          <div className="flex items-center space-x-4">
            {!canProceedToNext() && (
              <div className="flex items-center space-x-2 text-yellow-600">
                <AlertTriangle className="h-4 w-4" />
                <span className="text-sm">Please answer all questions to proceed</span>
              </div>
            )}
            
            {isQuestionComplete(currentQuestion) && (
              <div className="flex items-center space-x-2 text-green-600">
                <CheckCircle className="h-4 w-4" />
                <span className="text-sm">Question completed</span>
              </div>
            )}
          </div>

          {isLastQuestion ? (
            <button
              type="button"
              onClick={handleFinish}
              disabled={!canFinishSection()}
              className={`flex items-center space-x-2 px-6 py-3 rounded-lg transition-all duration-200 ${
                canFinishSection()
                  ? 'btn-walmart'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              <span>Finish</span>
              <CheckCircle className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleNext}
              disabled={!canProceedToNext()}
              className={`flex items-center space-x-2 px-6 py-3 rounded-lg transition-all duration-200 ${
                canProceedToNext()
                  ? 'btn-walmart'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              <span>Next</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default React.memo(Assessment);


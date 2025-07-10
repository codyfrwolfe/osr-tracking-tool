import React, { useMemo, useCallback, useEffect, useState } from 'react';
import { ChevronRight, CheckCircle, Clock, AlertCircle, Home, RefreshCw } from 'lucide-react';
import { calculateSectionScore, transformResponsesForScoring } from '../utils/scoring';
import { QUESTIONS, STORE_FOUNDATIONS } from '../data/osrData';
import ErrorBoundary from './ErrorBoundary';
import { CardSkeleton } from './LoadingSpinner';
import apiService from '../utils/apiService';

const SectionSelection = ({ 
  store, 
  sections, 
  storeFoundations, 
  onSectionSelect, 
  onNavigateToStores,
  responses,
  storeProgress = {},
  isLoading = false 
}) => {
  const [localProgress, setLocalProgress] = useState({});
  const [refreshing, setRefreshing] = useState(false);

  // Transform flat responses into nested structure for scoring
  const transformedResponses = useMemo(() => {
    return transformResponsesForScoring(responses);
  }, [responses]);

  // Load section progress from API on component mount and when responses change
  useEffect(() => {
    const loadSectionProgress = async () => {
      try {
        const progressData = {};
        
        // For each section, get the progress from the API or calculate it locally
        for (const sectionKey of Object.keys(sections)) {
          try {
            // Try to get from API first
            const result = await apiService.getSectionScore(store, sectionKey);
            
            if (result.success && result.score) {
              progressData[sectionKey] = result.score;
            } else {
              // Calculate locally if API fails
              const sectionQuestions = QUESTIONS[sectionKey];
              const sectionResponses = transformedResponses[store]?.[sectionKey] || {};
              
              if (sectionQuestions) {
                const score = calculateSectionScore(
                  sectionQuestions, 
                  sectionResponses, 
                  sectionKey,
                  store // Pass store ID for Foundation question handling
                );
                progressData[sectionKey] = score;
              }
            }
          } catch (error) {
            console.warn(`Failed to load progress for section ${sectionKey}:`, error);
          }
        }
        
        setLocalProgress(progressData);
        console.log('Loaded section progress:', progressData);
      } catch (error) {
        console.error('Error loading section progress:', error);
      }
    };

    loadSectionProgress();
  }, [store, sections, transformedResponses]);

  // Handle refresh button click
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const progressData = {};
      
      // For each section, get the progress from the API or calculate it locally
      for (const sectionKey of Object.keys(sections)) {
        try {
          // Force API refresh
          const result = await apiService.getSectionScore(store, sectionKey);
          
          if (result.success && result.score) {
            progressData[sectionKey] = result.score;
          }
        } catch (error) {
          console.warn(`Failed to refresh progress for section ${sectionKey}:`, error);
        }
      }
      
      setLocalProgress(progressData);
      console.log('Refreshed section progress:', progressData);
    } catch (error) {
      console.error('Error refreshing section progress:', error);
    } finally {
      setTimeout(() => setRefreshing(false), 1000);
    }
  };

  // Get section completion status (memoized)
  const getSectionCompletionStatus = useCallback((sectionKey) => {
    try {
      // ENHANCED: First check if we have progress data from the API
      if (localProgress[sectionKey]) {
        const apiProgress = localProgress[sectionKey];
        return {
          status: apiProgress.questions_completed === 0 ? 'not-started' :
                 apiProgress.questions_completed === apiProgress.total_questions ? 'complete' : 
                 'in-progress',
          questionsAnswered: apiProgress.questions_completed,
          totalQuestions: apiProgress.total_questions,
          percentage: apiProgress.percentage || 0,
          score: apiProgress
        };
      }
      
      // Fall back to calculating from responses if API data is not available
      const sectionQuestions = QUESTIONS[sectionKey];
      if (!sectionQuestions) {
        return {
          status: 'error',
          questionsAnswered: 0,
          totalQuestions: 0,
          percentage: 0,
          score: null
        };
      }

      // Get all questions for this section
      let allQuestions = [...(sectionQuestions.processCheck || [])];
      
      // Add foundation questions if this store requires them for this section
      const foundations = storeFoundations?.[store] || STORE_FOUNDATIONS[store] || [];
      if (foundations.includes(sectionKey)) {
        allQuestions = [...allQuestions, ...(sectionQuestions.foundations || [])];
      }

      if (allQuestions.length === 0) {
        return {
          status: 'error',
          questionsAnswered: 0,
          totalQuestions: 0,
          percentage: 0,
          score: null
        };
      }

      // Count completed questions
      let questionsAnswered = 0;
      
      allQuestions.forEach(question => {
        if (!question?.procedures) return;
        
        const actionableProcedures = question.procedures.filter(p => p?.type === 'actionable');
        if (actionableProcedures.length === 0) {
          questionsAnswered++; // Count instructional-only questions as complete
          return;
        }

        const isComplete = actionableProcedures.every((procedure, index) => {
          const procedureIndex = question.procedures.indexOf(procedure);
          const responseKey = `${store}-${sectionKey}-${question.id}-${procedureIndex}`;
          const response = responses?.[responseKey];
          return response && typeof response.hasIssues === 'string';
        });

        if (isComplete) {
          questionsAnswered++;
        }
      });

      const percentage = Math.round((questionsAnswered / allQuestions.length) * 100);
      
      // Calculate section score using the corrected scoring function
      let score = null;
      if (questionsAnswered > 0) {
        try {
          // Get responses for this specific section
          const sectionResponses = transformedResponses[store]?.[sectionKey] || {};
          score = calculateSectionScore(
            sectionQuestions, 
            sectionResponses, 
            sectionKey,
            store // Pass store ID for Foundation question handling
          );
        } catch (error) {
          console.error('Error calculating section score:', error);
        }
      }

      // Determine status
      let status;
      if (questionsAnswered === 0) {
        status = 'not-started';
      } else if (questionsAnswered === allQuestions.length) {
        status = 'complete';
      } else {
        status = 'in-progress';
      }

      return {
        status,
        questionsAnswered,
        totalQuestions: allQuestions.length,
        percentage,
        score
      };
    } catch (error) {
      console.error('Error getting section completion status:', error);
      return {
        status: 'error',
        questionsAnswered: 0,
        totalQuestions: 0,
        percentage: 0,
        score: null
      };
    }
  }, [store, storeFoundations, responses, transformedResponses, localProgress]);

  // Get status icon and color
  const getStatusDisplay = useCallback((status, score) => {
    switch (status) {
      case 'complete':
        return {
          icon: CheckCircle,
          color: 'text-green-600',
          bgColor: 'bg-green-100',
          label: 'Complete',
          labelColor: 'text-green-800'
        };
      case 'in-progress':
        return {
          icon: Clock,
          color: 'text-blue-600',
          bgColor: 'bg-blue-100',
          label: 'In Progress',
          labelColor: 'text-blue-800'
        };
      case 'error':
        return {
          icon: AlertCircle,
          color: 'text-red-600',
          bgColor: 'bg-red-100',
          label: 'Error',
          labelColor: 'text-red-800'
        };
      default:
        return {
          icon: Clock,
          color: 'text-gray-400',
          bgColor: 'bg-gray-100',
          label: 'Not Started',
          labelColor: 'text-gray-600'
        };
    }
  }, []);

  // ENHANCED: Get score display with proper formatting
  const getScoreDisplay = useCallback((score) => {
    if (!score || typeof score.score !== 'number' || typeof score.maxPossibleScore !== 'number') {
      return null;
    }

    const percentage = score.percentage || 
      (score.maxPossibleScore > 0 ? Math.round((score.score / score.maxPossibleScore) * 100) : 0);
    
    const colorClasses = {
      green: 'bg-green-100 text-green-800 border-green-200',
      yellow: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      red: 'bg-red-100 text-red-800 border-red-200'
    };

    return (
      <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${colorClasses[score.color] || colorClasses.red}`}>
        {percentage}% ({score.score}/{score.maxPossibleScore} pts)
      </div>
    );
  }, []);

  // Handle section click
  const handleSectionClick = useCallback((sectionKey) => {
    try {
      onSectionSelect(sectionKey);
    } catch (error) {
      console.error('Error selecting section:', error);
    }
  }, [onSectionSelect]);

  // Loading state
  if (isLoading) {
    return (
      <div className="fade-in">
        <div className="text-center mb-8">
          <h2 className="heading-secondary mb-2">Store {store} - Section Selection</h2>
          <p className="text-gray-600">Loading sections...</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4, 5].map(i => (
            <CardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="fade-in">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={onNavigateToStores}
              className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200 border border-gray-300 hover:border-blue-300"
            >
              <Home className="h-4 w-4" />
              <span>Back to Store Selection</span>
            </button>
            
            {/* Refresh Button */}
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200 border border-gray-300 hover:border-blue-300"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              <span>{refreshing ? 'Refreshing...' : 'Refresh Progress'}</span>
            </button>
          </div>
          <h2 className="heading-secondary mb-2">Store {store} - Section Selection</h2>
          <p className="text-gray-600">
            Select a section to begin assessment. Each section contains Process Check questions.
          </p>
        </div>

        {/* Section Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Object.entries(sections).map(([sectionKey, sectionInfo]) => {
            const completionStatus = getSectionCompletionStatus(sectionKey);
            const statusDisplay = getStatusDisplay(completionStatus.status, completionStatus.score);
            const StatusIcon = statusDisplay.icon;

            return (
              <div
                key={sectionKey}
                onClick={() => handleSectionClick(sectionKey)}
                className="professional-card p-6 cursor-pointer group hover:shadow-xl transition-all duration-300"
              >
                {/* Section Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="text-2xl">{sectionInfo.icon}</div>
                    <div>
                      <h3 className="heading-tertiary group-hover:text-blue-600 transition-colors">
                        {sectionInfo.title}
                      </h3>
                      <p className="text-sm text-gray-600">{sectionInfo.description}</p>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
                </div>

                {/* Status and Progress */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <div className={`p-1 rounded-full ${statusDisplay.bgColor}`}>
                      <StatusIcon className={`h-4 w-4 ${statusDisplay.color}`} />
                    </div>
                    <span className={`text-sm font-medium ${statusDisplay.labelColor}`}>
                      {statusDisplay.label}
                    </span>
                  </div>
                  
                  {completionStatus.score && getScoreDisplay(completionStatus.score)}
                </div>

                {/* Progress Information */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Questions Available</span>
                    <span className="font-medium">
                      {completionStatus.totalQuestions} total
                    </span>
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Questions Answered</span>
                    <span className="font-medium">
                      {completionStatus.questionsAnswered} total
                    </span>
                  </div>

                  {/* Progress Bar */}
                  {completionStatus.totalQuestions > 0 && (
                    <div className="mt-3">
                      <div className="progress-bar">
                        <div 
                          className="progress-fill"
                          style={{ width: `${completionStatus.percentage}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>Progress</span>
                        <span>{completionStatus.percentage}% Complete</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Foundation Questions Indicator */}
                {(storeFoundations?.[store] || STORE_FOUNDATIONS[store] || []).includes(sectionKey) && (
                  <div className="mt-4 p-2 bg-purple-50 rounded-lg border border-purple-200">
                    <p className="text-xs text-purple-800 font-medium">
                      ⭐ Includes Foundation Questions for this store
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Summary Information */}
        <div className="mt-8 bg-blue-50 rounded-xl p-6 border border-blue-200">
          <h3 className="font-semibold text-blue-900 mb-2">Assessment Information</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Each section contains multiple Process Check questions</li>
            <li>• Some sections may include Foundation Questions specific to your store</li>
            <li>• Your progress is automatically saved and shared with team members</li>
            <li>• You can return to any section to review or modify responses</li>
          </ul>
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default React.memo(SectionSelection);


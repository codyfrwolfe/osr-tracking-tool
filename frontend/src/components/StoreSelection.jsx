import React, { useEffect, useState } from 'react';
import { Building2, CheckCircle, Clock, ArrowRight, RefreshCw, TrendingUp, Award } from 'lucide-react';
import MovingClocksFooter from './MovingClocksFooter';
import apiService from '../utils/apiService';

const StoreSelection = ({ 
  stores, 
  onStoreSelect, 
  responses, 
  storeProgress, 
  isLoading, 
  onRefreshProgress 
}) => {
  const [refreshing, setRefreshing] = useState(false);
  const [localProgress, setLocalProgress] = useState({});

  // Load store progress on component mount
  useEffect(() => {
    setLocalProgress(storeProgress);
  }, [storeProgress]);

  const handleRefresh = async () => {
    setRefreshing(true);
    
    try {
      // Refresh all store progress
      const progressData = {};
      
      for (const storeId of stores) {
        try {
          const result = await apiService.getStoreScore(storeId);
          if (result.success && result.score) {
            progressData[storeId] = result.score;
          }
        } catch (error) {
          console.warn(`Failed to refresh progress for store ${storeId}:`, error);
        }
      }
      
      setLocalProgress(progressData);
      console.log('Refreshed store progress:', progressData);
      
      // Call the parent refresh handler if provided
      if (onRefreshProgress) {
        await onRefreshProgress();
      }
    } catch (error) {
      console.error('Error refreshing store progress:', error);
    } finally {
      setTimeout(() => setRefreshing(false), 1000);
    }
  };

  const getStoreCompletionStatus = (storeId) => {
    try {
      // First check if we have progress data from the API or local state
      const progress = localProgress[storeId] || storeProgress[storeId];
      
      if (progress) {
        const {
          overall_score = 0,
          overall_max_score = 46,
          overall_percentage = 0,
          overall_color = 'red',
          sections_completed = 0,
          total_sections = 5,
          section_scores = {}
        } = progress;

        // ENHANCED: Ensure we're using the normalized score
        const normalizedScore = {
          score: overall_score,
          maxPossibleScore: overall_max_score,
          percentage: overall_percentage,
          color: overall_color,
          completedSections: sections_completed,
          totalSections: total_sections,
          sectionScores: section_scores,
          normalized: true
        };

        if (sections_completed > 0) {
          if (sections_completed === total_sections) {
            return {
              status: 'completed',
              score: normalizedScore,
              message: `All ${total_sections} sections completed`
            };
          } else {
            return {
              status: 'in-progress',
              score: normalizedScore,
              message: `${sections_completed}/${total_sections} sections completed`
            };
          }
        }
      }

      // Check if there are any responses for this store
      const hasResponses = Object.keys(responses).some(key => key.startsWith(`${storeId}-`));
      
      if (hasResponses) {
        return {
          status: 'in-progress',
          score: {
            score: 0,
            maxPossibleScore: 46,
            percentage: 0,
            color: 'red',
            completedSections: 0,
            totalSections: 5,
            sectionScores: {}
          },
          message: 'Assessment in progress'
        };
      } else {
        return {
          status: 'pending',
          score: {
            score: 0,
            maxPossibleScore: 46,
            percentage: 0,
            color: 'red',
            completedSections: 0,
            totalSections: 5,
            sectionScores: {}
          },
          message: 'Not started'
        };
      }
    } catch (error) {
      console.error('Error calculating store completion status:', error);
      return {
        status: 'error',
        score: {
          score: 0,
          maxPossibleScore: 46,
          percentage: 0,
          color: 'red',
          completedSections: 0,
          totalSections: 5,
          sectionScores: {}
        },
        message: 'Error calculating status'
      };
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'in-progress':
        return <Clock className="h-5 w-5 text-yellow-600" />;
      case 'error':
        return <Building2 className="h-5 w-5 text-red-600" />;
      default:
        return <Building2 className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusBadge = (status, score) => {
    if (score && score.completedSections > 0 && score.percentage > 0) {
      const colorClass = score.color === 'green' ? 'score-green' : 
                        score.color === 'yellow' ? 'score-yellow' : 'score-red';
      return (
        <span className={`status-indicator ${colorClass} flex items-center space-x-1`}>
          <Award className="h-3 w-3" />
          <span>{score.percentage}% Complete</span>
        </span>
      );
    }
    
    switch (status) {
      case 'in-progress':
        return (
          <span className="status-indicator status-in-progress flex items-center space-x-1">
            <Clock className="h-3 w-3" />
            <span>In Progress</span>
          </span>
        );
      case 'error':
        return (
          <span className="status-indicator status-error flex items-center space-x-1">
            <Building2 className="h-3 w-3" />
            <span>Error</span>
          </span>
        );
      default:
        return (
          <span className="status-indicator status-pending flex items-center space-x-1">
            <TrendingUp className="h-3 w-3" />
            <span>0% Complete</span>
          </span>
        );
    }
  };

  const getScoreColor = (percentage) => {
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="fade-in">
      {/* Header Section */}
      <div className="text-center mb-8">
        <h2 className="heading-secondary mb-4">Select Store for Assessment</h2>
        <p className="text-body max-w-2xl mx-auto">
          Choose a store from Market 448 to begin or continue the OSR assessment. 
          Your progress is automatically saved and shared across all team members in real-time.
        </p>
        
        {/* Refresh Button */}
        <div className="mt-4">
          <button
            onClick={handleRefresh}
            disabled={isLoading || refreshing}
            className="inline-flex items-center space-x-2 px-4 py-2 text-sm text-gray-600 hover:text-blue-600 transition-colors"
          >
            <RefreshCw className={`h-4 w-4 ${(isLoading || refreshing) ? 'animate-spin' : ''}`} />
            <span>{isLoading || refreshing ? 'Refreshing...' : 'Refresh Progress'}</span>
          </button>
        </div>
      </div>

      {/* Store Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stores.map((storeId) => {
          const completionStatus = getStoreCompletionStatus(storeId);
          
          return (
            <div
              key={storeId}
              onClick={() => onStoreSelect(storeId)}
              className="professional-card p-6 cursor-pointer group hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  {getStatusIcon(completionStatus.status)}
                  <div>
                    <h3 className="heading-tertiary text-lg">Store {storeId}</h3>
                    <p className="text-sm text-gray-600">Market 448</p>
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-walmart-blue transition-colors duration-200" />
              </div>

              <div className="space-y-3">
                {getStatusBadge(completionStatus.status, completionStatus.score)}
                
                <p className="text-sm text-gray-600">
                  {completionStatus.message}
                </p>

                {/* Enhanced Score Information */}
                {completionStatus.score && (
                  <div className="pt-3 border-t border-gray-100 space-y-2">
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>Overall Score</span>
                      <span className={getScoreColor(completionStatus.score.percentage)}>
                        {completionStatus.score.score || 0}/{completionStatus.score.maxPossibleScore || 46} points
                      </span>
                    </div>
                    <div className="progress-bar">
                      <div 
                        className="progress-fill"
                        style={{ width: `${completionStatus.score.percentage || 0}%` }}
                      ></div>
                    </div>
                    
                    {/* Section breakdown for completed stores */}
                    {completionStatus.score.completedSections > 0 && completionStatus.score.sectionScores && (
                      <div className="mt-2 pt-2 border-t border-gray-50">
                        <div className="text-xs text-gray-500 mb-1">Section Progress:</div>
                        <div className="grid grid-cols-5 gap-1">
                          {Object.entries(completionStatus.score.sectionScores).map(([sectionName, sectionData]) => (
                            <div
                              key={sectionName}
                              className={`h-2 rounded-full ${
                                sectionData.color === 'green' ? 'bg-green-400' :
                                sectionData.color === 'yellow' ? 'bg-yellow-400' :
                                sectionData.questions_completed > 0 ? 'bg-red-400' : 'bg-gray-200'
                              }`}
                              title={`${sectionName}: ${sectionData.percentage}%`}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary Statistics */}
      {Object.keys(localProgress).length > 0 && (
        <div className="mt-12 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-200">
          <h3 className="heading-tertiary mb-4 text-center">Assessment Overview</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="text-2xl font-bold text-blue-600">
                {Object.values(localProgress).filter(p => p.sections_completed > 0).length}
              </div>
              <div className="text-sm text-gray-600">Stores Started</div>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="text-2xl font-bold text-green-600">
                {Object.values(localProgress).filter(p => p.sections_completed === 5).length}
              </div>
              <div className="text-sm text-gray-600">Stores Completed</div>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="text-2xl font-bold text-purple-600">
                {Object.values(localProgress).reduce((sum, p) => sum + (p.sections_completed || 0), 0)}
              </div>
              <div className="text-sm text-gray-600">Total Sections</div>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="text-2xl font-bold text-orange-600">
                {Math.round(Object.values(localProgress).reduce((sum, p) => sum + (p.overall_percentage || 0), 0) / Math.max(Object.keys(localProgress).length, 1))}%
              </div>
              <div className="text-sm text-gray-600">Average Progress</div>
            </div>
          </div>
        </div>
      )}

      <MovingClocksFooter />
    </div>
  );
};

export default StoreSelection;


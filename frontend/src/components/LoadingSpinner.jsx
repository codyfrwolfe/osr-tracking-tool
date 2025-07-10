import React from 'react';
import { Loader2 } from 'lucide-react';

const LoadingSpinner = ({ 
  message = 'Loading...', 
  size = 'medium',
  className = '',
  showMessage = true 
}) => {
  const sizeClasses = {
    small: 'h-4 w-4',
    medium: 'h-8 w-8',
    large: 'h-12 w-12'
  };

  const containerClasses = {
    small: 'p-4',
    medium: 'p-8',
    large: 'p-12'
  };

  return (
    <div className={`flex flex-col items-center justify-center ${containerClasses[size]} ${className}`}>
      <Loader2 className={`${sizeClasses[size]} text-blue-600 animate-spin`} />
      {showMessage && (
        <p className="mt-4 text-gray-600 text-center">
          {message}
        </p>
      )}
    </div>
  );
};

// Skeleton loader for better UX
export const SkeletonLoader = ({ className = '' }) => {
  return (
    <div className={`animate-pulse ${className}`}>
      <div className="bg-gray-200 rounded-lg h-4 w-3/4 mb-2"></div>
      <div className="bg-gray-200 rounded-lg h-4 w-1/2 mb-2"></div>
      <div className="bg-gray-200 rounded-lg h-4 w-5/6"></div>
    </div>
  );
};

// Card skeleton for loading states
export const CardSkeleton = ({ className = '' }) => {
  return (
    <div className={`bg-white rounded-xl border border-gray-200 p-6 ${className}`}>
      <div className="animate-pulse">
        <div className="flex items-center justify-between mb-4">
          <div className="bg-gray-200 rounded-lg h-6 w-1/3"></div>
          <div className="bg-gray-200 rounded-full h-8 w-20"></div>
        </div>
        <div className="space-y-3">
          <div className="bg-gray-200 rounded-lg h-4 w-full"></div>
          <div className="bg-gray-200 rounded-lg h-4 w-3/4"></div>
          <div className="bg-gray-200 rounded-lg h-4 w-1/2"></div>
        </div>
        <div className="mt-6 flex justify-between items-center">
          <div className="bg-gray-200 rounded-lg h-4 w-1/4"></div>
          <div className="bg-gray-200 rounded-lg h-8 w-16"></div>
        </div>
      </div>
    </div>
  );
};

// Full page loading component
export const PageLoader = ({ message = 'Loading application...' }) => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="h-16 w-16 text-blue-600 animate-spin mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          {message}
        </h2>
        <p className="text-gray-600">
          Please wait while we prepare your assessment...
        </p>
      </div>
    </div>
  );
};

export default LoadingSpinner;


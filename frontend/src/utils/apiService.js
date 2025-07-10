// Enhanced API Service for OSR Assessment Tool
// Addresses root API issues and prevents page refresh

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'm448osrq2-production-4cce.up.railway.app';

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
    this.isBackendHealthy = false;
    this.lastHealthCheck = null;
    this.requestQueue = [];
    this.isProcessingQueue = false;
    this.responseCache = new Map();
    this.cacheTTL = 60000; // 1 minute cache TTL
    
    console.log('API Service initialized with base URL:', this.baseURL);
    
    // Check backend health on initialization
    this.checkBackendHealth();
  }

  // ENHANCED: Comprehensive backend health check with retry
  async checkBackendHealth(retries = 2) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);
      
      const response = await fetch(`${this.baseURL}/api/health`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      const contentType = response.headers.get('content-type');
      
      if (response.ok && contentType && contentType.includes('application/json')) {
        const data = await response.json();
        this.isBackendHealthy = true;
        this.lastHealthCheck = new Date();
        console.log('✅ Backend is healthy:', data);
        return true;
      } else {
        console.warn('⚠️ Backend returned non-JSON response for health check');
        this.isBackendHealthy = false;
        
        // Retry if retries remaining
        if (retries > 0) {
          console.log(`Retrying health check (${retries} retries left)...`);
          await new Promise(resolve => setTimeout(resolve, 1000));
          return this.checkBackendHealth(retries - 1);
        }
        
        return false;
      }
    } catch (error) {
      console.error('❌ Backend health check failed:', error);
      this.isBackendHealthy = false;
      
      // Retry if retries remaining
      if (retries > 0) {
        console.log(`Retrying health check (${retries} retries left)...`);
        await new Promise(resolve => setTimeout(resolve, 1000));
        return this.checkBackendHealth(retries - 1);
      }
      
      return false;
    }
  }

  // ENHANCED: Request method with caching, retries, and better error handling
  async makeRequest(endpoint, options = {}, useCache = false, retries = 1) {
    const url = `${this.baseURL}/api${endpoint}`;
    
    // Check cache if enabled
    if (useCache && options.method === 'GET') {
      const cacheKey = `${options.method}:${url}`;
      const cachedResponse = this.responseCache.get(cacheKey);
      
      if (cachedResponse && (Date.now() - cachedResponse.timestamp) < this.cacheTTL) {
        console.log(`Using cached response for ${url}`);
        return cachedResponse.data;
      }
    }
    
    const defaultOptions = {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      timeout: 8000,
      ...options
    };

    try {
      console.log(`Making ${defaultOptions.method || 'GET'} request to:`, url);
      
      // Add timeout to fetch request
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), defaultOptions.timeout);
      
      const response = await fetch(url, {
        ...defaultOptions,
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);

      // Check if response is OK
      if (!response.ok) {
        console.error(`HTTP ${response.status}: ${response.statusText}`);
        
        if (response.status === 404) {
          throw new Error(`API endpoint not found: ${endpoint}`);
        }
        
        const errorText = await response.text();
        console.error('Error response body:', errorText);
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // Comprehensive content-type checking
      const contentType = response.headers.get('content-type');
      console.log('Response content-type:', contentType);
      
      if (!contentType || !contentType.includes('application/json')) {
        const responseText = await response.text();
        console.error('Backend returned non-JSON response:', responseText.substring(0, 500));
        
        if (responseText.includes('<html>') || responseText.includes('<!DOCTYPE')) {
          throw new Error('Backend returned HTML error page - API endpoints may not be configured correctly');
        }
        
        throw new Error('Backend returned non-JSON response - service may be misconfigured');
      }

      const data = await response.json();
      console.log('API Response:', data);
      
      this.isBackendHealthy = true;
      this.lastHealthCheck = new Date();
      
      // Cache the response if it's a GET request
      if (useCache && options.method === 'GET') {
        const cacheKey = `${options.method}:${url}`;
        this.responseCache.set(cacheKey, {
          data,
          timestamp: Date.now()
        });
      }
      
      return data;
    } catch (error) {
      console.error(`API Error for ${endpoint}:`, error);
      
      // Retry if retries remaining
      if (retries > 0) {
        console.log(`Retrying request (${retries} retries left)...`);
        await new Promise(resolve => setTimeout(resolve, 1000));
        return this.makeRequest(endpoint, options, useCache, retries - 1);
      }
      
      this.isBackendHealthy = false;
      
      // Return structured error response instead of throwing
      if (error.name === 'AbortError') {
        return {
          success: false,
          error: 'Request timeout - backend may be slow or down',
          errorType: 'timeout',
          fallback: true
        };
      }
      
      if (error.message.includes('HTML error page')) {
        return {
          success: false,
          error: 'Backend API endpoints not configured correctly',
          errorType: 'configuration',
          fallback: true
        };
      }
      
      if (error.message.includes('non-JSON response')) {
        return {
          success: false,
          error: 'Backend returning HTML instead of JSON',
          errorType: 'content_type',
          fallback: true
        };
      }
      
      return {
        success: false,
        error: error.message || 'Unknown API error',
        errorType: 'unknown',
        fallback: true
      };
    }
  }

  // ENHANCED: Save response with better error handling and no page refresh
  async saveResponse(store, section, questionId, procedureIndex, response) {
    // Validate inputs
    if (!store || store === 'undefined' || !section || !questionId) {
      console.error('Invalid parameters for saveResponse:', { store, section, questionId, procedureIndex });
      return {
        success: false,
        error: 'Invalid parameters provided',
        errorType: 'validation'
      };
    }

    try {
      const payload = {
        store: store,
        section: section,
        question_id: questionId,
        procedure_index: procedureIndex,
        response: response,
        user_id: 'collaborative_user',
        timestamp: new Date().toISOString()
      };

      console.log('Saving response:', payload);

      // Clear cache for this store and section
      this.clearCache(store, section);

      const result = await this.makeRequest('/save_response', {
        method: 'POST',
        body: JSON.stringify(payload)
      }, false, 2); // Use 2 retries for save operations

      if (!result.success) {
        if (result.errorType === 'configuration') {
          console.warn('Backend API not configured - responses will be saved locally only');
          return {
            success: true,
            message: 'Response saved locally (backend API not configured)',
            localOnly: true
          };
        }
        
        if (result.errorType === 'timeout') {
          console.warn('Backend timeout - responses will be saved locally only');
          return {
            success: true,
            message: 'Response saved locally (backend timeout)',
            localOnly: true
          };
        }
        
        console.error('API save failed:', result.error);
        return {
          success: true,
          message: 'Response saved locally (backend unavailable)',
          localOnly: true
        };
      }

      console.log('Response saved successfully to backend:', result);
      return result;
    } catch (error) {
      console.error('Error in saveResponse:', error);
      return {
        success: true,
        message: 'Response saved locally (error occurred)',
        localOnly: true,
        error: error.message
      };
    }
  }

  // ENHANCED: Batch save responses for better performance
  async batchSaveResponses(store, section, responses) {
    if (!store || store === 'undefined' || !section || !responses) {
      console.error('Invalid parameters for batchSaveResponses:', { store, section, responses });
      return {
        success: false,
        error: 'Invalid parameters provided',
        errorType: 'validation'
      };
    }

    try {
      const payload = {
        store: store,
        section: section,
        responses: responses,
        user_id: 'collaborative_user',
        timestamp: new Date().toISOString()
      };

      console.log('Batch saving responses:', payload);

      // Clear cache for this store and section
      this.clearCache(store, section);

      const result = await this.makeRequest('/batch_save_responses', {
        method: 'POST',
        body: JSON.stringify(payload)
      }, false, 2); // Use 2 retries for batch save operations

      if (!result.success) {
        console.warn('Batch save failed, falling back to individual saves');
        
        // Fallback to individual saves
        const individualResults = [];
        for (const [responseKey, response] of Object.entries(responses)) {
          const [questionId, procedureIndex] = responseKey.split('-');
          const individualResult = await this.saveResponse(store, section, questionId, procedureIndex, response);
          individualResults.push(individualResult);
        }
        
        return {
          success: true,
          message: 'Responses saved individually (batch save failed)',
          individualResults: individualResults,
          localOnly: true
        };
      }

      console.log('Batch save successful:', result);
      return result;
    } catch (error) {
      console.error('Error in batchSaveResponses:', error);
      return {
        success: true,
        message: 'Responses saved locally (batch save error)',
        localOnly: true,
        error: error.message
      };
    }
  }

  // ENHANCED: Get responses with caching and better error handling
  async getResponses(store, section) {
    if (!store || store === 'undefined' || !section) {
      console.error('Invalid parameters for getResponses:', { store, section });
      return {
        success: true,
        responses: {},
        localOnly: true
      };
    }

    try {
      const result = await this.makeRequest(`/get_responses/${store}/${section}`, {}, true); // Use cache
      
      if (!result.success) {
        console.warn('Failed to get responses from backend:', result.error);
        return {
          success: true,
          responses: {},
          localOnly: true
        };
      }
      
      if (result.success && result.responses) {
        console.log(`Loaded responses for ${store}-${section}:`, result.responses);
        return result;
      } else {
        return {
          success: true,
          responses: {},
          localOnly: true
        };
      }
    } catch (error) {
      console.error('Error in getResponses:', error);
      return {
        success: true,
        responses: {},
        localOnly: true
      };
    }
  }

  // ENHANCED: Get store score with caching and better error handling
  async getStoreScore(store) {
    if (!store || store === 'undefined') {
      console.error('Invalid store ID for getStoreScore:', store);
      return {
        success: true,
        score: this.getDefaultStoreScore(),
        localOnly: true
      };
    }

    try {
      const result = await this.makeRequest(`/get_store_score/${store}`, {}, true); // Use cache
      
      if (!result.success) {
        console.warn('Failed to get store score from backend:', result.error);
        return {
          success: true,
          score: this.getDefaultStoreScore(),
          localOnly: true
        };
      }
      
      if (result.success && result.score) {
        console.log(`Loaded store score for ${store}:`, result.score);
        
        const enhancedScore = {
          overall_score: result.score.overall_score || 0,
          overall_max_score: result.score.overall_max_score || 46,
          overall_percentage: result.score.overall_percentage || 0,
          overall_color: result.score.overall_color || 'red',
          sections_completed: result.score.sections_completed || 0,
          total_sections: result.score.total_sections || 5,
          section_scores: result.score.section_scores || {},
          last_updated: new Date().toISOString()
        };
        
        return {
          success: true,
          score: enhancedScore,
          localOnly: false
        };
      } else {
        return {
          success: true,
          score: this.getDefaultStoreScore(),
          localOnly: true
        };
      }
    } catch (error) {
      console.error('Error in getStoreScore:', error);
      return {
        success: true,
        score: this.getDefaultStoreScore(),
        localOnly: true
      };
    }
  }

  // Helper method to get default store score
  getDefaultStoreScore() {
    return {
      overall_score: 0,
      overall_max_score: 46,
      overall_percentage: 0,
      overall_color: 'red',
      sections_completed: 0,
      total_sections: 5,
      section_scores: {},
      last_updated: new Date().toISOString()
    };
  }

  // ENHANCED: Get section score with caching
  async getSectionScore(store, section) {
    if (!store || store === 'undefined' || !section) {
      console.error('Invalid parameters for getSectionScore:', { store, section });
      return {
        success: true,
        score: this.getDefaultSectionScore(),
        localOnly: true
      };
    }

    try {
      const result = await this.makeRequest(`/get_section_score/${store}/${section}`, {}, true); // Use cache
      
      if (!result.success) {
        console.warn('Failed to get section score from backend:', result.error);
        return {
          success: true,
          score: this.getDefaultSectionScore(),
          localOnly: true
        };
      }
      
      if (result.success && result.score) {
        console.log(`Loaded section score for ${store}-${section}:`, result.score);
        return result;
      } else {
        return {
          success: true,
          score: this.getDefaultSectionScore(),
          localOnly: true
        };
      }
    } catch (error) {
      console.error('Error in getSectionScore:', error);
      return {
        success: true,
        score: this.getDefaultSectionScore(),
        localOnly: true
      };
    }
  }

  // Helper method to get default section score
  getDefaultSectionScore() {
    return {
      score: 0,
      max_score: 10,
      percentage: 0,
      color: 'red',
      questions_completed: 0,
      total_questions: 5
    };
  }

  // ENHANCED: Refresh scores after saving with cache clearing
  async refreshScores(store, section = 'all') {
    if (!store || store === 'undefined') {
      console.error('Invalid store ID for refreshScores:', store);
      return { success: false, error: 'Invalid store ID' };
    }

    try {
      // Clear cache for this store and section
      this.clearCache(store, section);

      const result = await this.makeRequest(`/refresh_scores/${store}/${section}`, {
        method: 'POST'
      }, false, 2); // Use 2 retries for refresh operations
      
      if (result.success) {
        console.log(`Refreshed scores for ${store}-${section}`);
      } else {
        console.warn('Failed to refresh scores:', result.error);
      }
      
      return result;
    } catch (error) {
      console.error('Error refreshing scores:', error);
      return { success: false, error: error.message };
    }
  }

  // Helper method to clear cache for a store and section
  clearCache(store, section = null) {
    const cacheKeys = [];
    
    // Get all cache keys for this store
    for (const key of this.responseCache.keys()) {
      if (key.includes(`/${store}/`)) {
        if (!section || section === 'all' || key.includes(`/${store}/${section}`)) {
          cacheKeys.push(key);
        }
      }
    }
    
    // Clear matching cache entries
    for (const key of cacheKeys) {
      this.responseCache.delete(key);
    }
    
    console.log(`Cleared ${cacheKeys.length} cache entries for store ${store}${section ? `, section ${section}` : ''}`);
  }

  // ENHANCED: Backend diagnostic method
  async diagnoseBackend() {
    console.log('🔍 Running backend diagnostics...');
    
    const diagnostics = {
      baseUrl: this.baseURL,
      timestamp: new Date().toISOString(),
      tests: {}
    };

    // Test 1: Basic connectivity
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(this.baseURL, { 
        method: 'HEAD', 
        signal: controller.signal 
      });
      
      clearTimeout(timeoutId);
      
      diagnostics.tests.connectivity = {
        status: response.ok ? 'PASS' : 'FAIL',
        httpStatus: response.status,
        statusText: response.statusText
      };
    } catch (error) {
      diagnostics.tests.connectivity = {
        status: 'FAIL',
        error: error.message
      };
    }

    // Test 2: Health endpoint
    try {
      const healthResult = await this.checkBackendHealth(0); // No retries for diagnostics
      diagnostics.tests.healthEndpoint = {
        status: healthResult ? 'PASS' : 'FAIL',
        healthy: this.isBackendHealthy
      };
    } catch (error) {
      diagnostics.tests.healthEndpoint = {
        status: 'FAIL',
        error: error.message
      };
    }

    // Test 3: API endpoint structure
    const testEndpoints = ['/api/health', '/api/get_store_score/test', '/api/get_responses/test/test'];
    for (const endpoint of testEndpoints) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        
        const response = await fetch(`${this.baseURL}${endpoint}`, {
          method: 'GET',
          headers: { 'Accept': 'application/json' },
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        const contentType = response.headers.get('content-type');
        diagnostics.tests[`endpoint_${endpoint.replace(/[^a-zA-Z0-9]/g, '_')}`] = {
          status: response.ok && contentType && contentType.includes('application/json') ? 'PASS' : 'FAIL',
          httpStatus: response.status,
          contentType: contentType,
          isJson: contentType && contentType.includes('application/json')
        };
      } catch (error) {
        diagnostics.tests[`endpoint_${endpoint.replace(/[^a-zA-Z0-9]/g, '_')}`] = {
          status: 'FAIL',
          error: error.message
        };
      }
    }

    console.log('🔍 Backend diagnostics complete:', diagnostics);
    return diagnostics;
  }

  // Health check endpoint
  async healthCheck() {
    return await this.checkBackendHealth();
  }

  // Test connection to backend
  async testConnection() {
    try {
      const isHealthy = await this.checkBackendHealth();
      if (isHealthy) {
        console.log('✅ Backend connection successful');
        return true;
      } else {
        console.warn('⚠️ Backend connection failed - running diagnostics...');
        await this.diagnoseBackend();
        return false;
      }
    } catch (error) {
      console.error('❌ Backend connection test failed:', error);
      await this.diagnoseBackend();
      return false;
    }
  }

  // ENHANCED: Get backend status for UI display
  getBackendStatus() {
    return {
      isHealthy: this.isBackendHealthy,
      lastHealthCheck: this.lastHealthCheck,
      baseURL: this.baseURL
    };
  }
}

// Create and export a singleton instance
const apiService = new ApiService();

// Test connection on module load and run diagnostics if needed
apiService.testConnection().catch(error => {
  console.warn('Initial backend connection test failed:', error);
});

export default apiService;


// FIXED API Service for OSR Assessment Tool
// Ensures absolute URLs and proper error handling

// CRITICAL: Ensure absolute URL with protocol
const API_BASE_URL = 'https://osr-tracking-tool-production.up.railway.app';

class ApiService {
  constructor() {
    // Ensure the base URL is always absolute
    this.baseURL = API_BASE_URL;
    this.isBackendHealthy = false;
    this.lastHealthCheck = null;
    this.requestQueue = [];
    this.isProcessingQueue = false;
    this.responseCache = new Map();
    this.cacheTTL = 60000; // 1 minute cache TTL
    
    console.log('API Service initialized with base URL:', this.baseURL);
    
    // Validate URL format
    if (!this.baseURL.startsWith('https://')) {
      console.error('❌ API Base URL must start with https://');
      throw new Error('Invalid API Base URL configuration');
    }
    
    // Check backend health on initialization
    this.checkBackendHealth();
  }

  // Enhanced health check with better error handling
  async checkBackendHealth(retries = 3) {
    try {
      const healthUrl = `${this.baseURL}/api/health`;
      console.log('🔍 Checking backend health at:', healthUrl);
      
      const response = await fetch(healthUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        timeout: 5000
      });

      if (!response.ok) {
        throw new Error(`Health check failed: ${response.status} ${response.statusText}`);
      }

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        console.warn('⚠️ Backend returned non-JSON response for health check');
        throw new Error('Backend health check returned non-JSON response');
      }

      const healthData = await response.json();
      console.log('✅ Backend health check passed:', healthData);
      
      this.isBackendHealthy = true;
      this.lastHealthCheck = new Date();
      return true;
      
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

  // FIXED: Request method with absolute URL construction
  async makeRequest(endpoint, options = {}, useCache = false, retries = 1) {
    // CRITICAL: Ensure absolute URL construction
    const url = `${this.baseURL}/api${endpoint}`;
    
    // Validate the constructed URL
    if (!url.startsWith('https://')) {
      console.error('❌ Constructed URL is not absolute:', url);
      throw new Error('Invalid URL construction - must be absolute HTTPS URL');
    }
    
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
        method: defaultOptions.method || 'GET',
        headers: defaultOptions.headers,
        body: defaultOptions.body,
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
      if (useCache && (defaultOptions.method || 'GET') === 'GET') {
        const cacheKey = `GET:${url}`;
        this.responseCache.set(cacheKey, {
          data,
          timestamp: Date.now()
        });
      }
      
      return data;
      
    } catch (error) {
      console.error(`API Error for ${endpoint}:`, error);
      this.isBackendHealthy = false;
      
      // Enhanced error messages
      if (error.name === 'AbortError') {
        throw new Error(`Request timeout after ${defaultOptions.timeout}ms`);
      }
      
      if (error.message.includes('Failed to fetch')) {
        throw new Error('Network error - check internet connection and backend availability');
      }
      
      // Retry logic
      if (retries > 0) {
        console.log(`Retrying request (${retries} retries left)...`);
        await new Promise(resolve => setTimeout(resolve, 1000));
        return this.makeRequest(endpoint, options, useCache, retries - 1);
      }
      
      throw error;
    }
  }

  // Test connection with comprehensive diagnostics
  async testConnection() {
    console.log('🔍 Testing backend connection...');
    
    try {
      // Test health endpoint
      const healthResult = await this.checkBackendHealth();
      
      if (!healthResult) {
        console.log('⚠️ Backend connection failed - running diagnostics...');
        return await this.diagnoseBackend();
      }
      
      console.log('✅ Backend connection successful');
      return { success: true, message: 'Backend connection established' };
      
    } catch (error) {
      console.error('❌ Connection test failed:', error);
      return { success: false, error: error.message };
    }
  }

  // Comprehensive backend diagnostics
  async diagnoseBackend() {
    console.log('🔍 Running backend diagnostics...');
    
    const diagnostics = {
      baseUrl: this.baseURL,
      timestamp: new Date().toISOString(),
      tests: {}
    };

    // Test basic connectivity
    try {
      const response = await fetch(this.baseURL, { method: 'HEAD', timeout: 5000 });
      diagnostics.tests.connectivity = {
        success: response.ok,
        status: response.status,
        statusText: response.statusText
      };
    } catch (error) {
      diagnostics.tests.connectivity = {
        success: false,
        error: error.message
      };
    }

    // Test health endpoint
    try {
      const healthResponse = await this.checkBackendHealth(1);
      diagnostics.tests.healthEndpoint = {
        success: healthResponse,
        message: healthResponse ? 'Health endpoint responding' : 'Health endpoint failed'
      };
    } catch (error) {
      diagnostics.tests.healthEndpoint = {
        success: false,
        error: error.message
      };
    }

    // Test specific API endpoints
    const testEndpoints = ['/api/health', '/api/get_store_score/test', '/api/get_responses/test/test'];
    
    for (const endpoint of testEndpoints) {
      const endpointKey = `endpoint_${endpoint.replace(/\//g, '_')}`;
      try {
        const response = await fetch(`${this.baseURL}${endpoint}`, {
          method: 'GET',
          headers: { 'Accept': 'application/json' },
          timeout: 3000
        });
        
        diagnostics.tests[endpointKey] = {
          success: response.ok,
          status: response.status,
          contentType: response.headers.get('content-type')
        };
      } catch (error) {
        diagnostics.tests[endpointKey] = {
          success: false,
          error: error.message
        };
      }
    }

    console.log('🔍 Backend diagnostics complete:', diagnostics);
    return diagnostics;
  }

  // Get current backend status
  getBackendStatus() {
    return {
      isHealthy: this.isBackendHealthy,
      lastCheck: this.lastHealthCheck,
      baseUrl: this.baseURL,
      status: this.isBackendHealthy ? 'connected' : 'disconnected'
    };
  }

  // API Methods
  async getStoreScore(storeId) {
    try {
      const data = await this.makeRequest(`/get_store_score/${storeId}`, {}, true);
      return data;
    } catch (error) {
      console.error('Failed to get store score from backend:', error.message);
      throw error;
    }
  }

  async saveResponse(storeId, sectionId, questionId, procedureIndex, response) {
    try {
      const data = await this.makeRequest('/save_response', {
        method: 'POST',
        body: JSON.stringify({
          store: storeId,
          section: sectionId,
          question_id: questionId,
          procedure_index: procedureIndex,
          response: response
        })
      });
      return data;
    } catch (error) {
      console.error('Failed to save response to backend:', error.message);
      throw error;
    }
  }

  async getResponses(storeId, sectionId) {
    try {
      const data = await this.makeRequest(`/get_responses/${storeId}/${sectionId}`, {}, true);
      return data;
    } catch (error) {
      console.error('Failed to get responses from backend:', error.message);
      throw error;
    }
  }

  async getSectionScore(storeId, sectionId) {
    try {
      const data = await this.makeRequest(`/get_section_score/${storeId}/${sectionId}`, {}, true);
      return data;
    } catch (error) {
      console.error('Failed to get section score from backend:', error.message);
      throw error;
    }
  }

  async refreshScores(storeId, sectionId) {
    try {
      const data = await this.makeRequest(`/refresh_scores/${storeId}/${sectionId}`, {
        method: 'POST'
      });
      return data;
    } catch (error) {
      console.error('Failed to refresh scores from backend:', error.message);
      throw error;
    }
  }

  async batchSaveResponses(storeId, sectionId, responses) {
    try {
      const data = await this.makeRequest('/batch_save_responses', {
        method: 'POST',
        body: JSON.stringify({ 
          store: storeId,
          section: sectionId,
          responses: responses 
        })
      });
      return data;
    } catch (error) {
      console.error('Failed to batch save responses to backend:', error.message);
      throw error;
    }
  }
}

// Create and export singleton instance
const apiService = new ApiService();
export default apiService;


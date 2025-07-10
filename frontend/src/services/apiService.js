// API Service for OSR Assessment Backend Communication
// Provides shared data persistence across multiple users

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

class ApiService {
  constructor() {
    this.baseUrl = API_BASE_URL;
    this.userId = this.generateUserId();
  }

  generateUserId() {
    // Generate a unique user ID for this session
    const stored = localStorage.getItem('osr_user_id');
    if (stored) return stored;
    
    const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('osr_user_id', userId);
    return userId;
  }

  async makeRequest(endpoint, options = {}) {
    try {
      const url = `${this.baseUrl}${endpoint}`;
      const config = {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        },
        ...options
      };

      const response = await fetch(url, config);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`API request failed for ${endpoint}:`, error);
      throw error;
    }
  }

  // Get all responses (for all stores and sections)
  async getAllResponses() {
    try {
      const result = await this.makeRequest('/api/responses');
      return result.success ? result.responses : {};
    } catch (error) {
      console.error('Failed to get all responses:', error);
      return {};
    }
  }

  // Get responses for a specific store
  async getStoreResponses(storeId) {
    try {
      const result = await this.makeRequest(`/api/responses/${storeId}`);
      return result.success ? result.responses : {};
    } catch (error) {
      console.error(`Failed to get responses for store ${storeId}:`, error);
      return {};
    }
  }

  // Save a response
  async saveResponse(storeId, section, questionId, procedureIndex, response) {
    try {
      const responseKey = `${storeId}-${section}-${questionId}-${procedureIndex}`;
      
      const payload = {
        responseKey,
        storeId,
        section,
        questionId,
        procedureIndex: procedureIndex.toString(),
        hasIssues: response.hasIssues,
        followUp: response.followUp || '',
        timestamp: response.timestamp || new Date().toISOString(),
        userId: this.userId,
        version: response.version || '1.0'
      };

      const result = await this.makeRequest('/api/responses', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      if (!result.success) {
        throw new Error(result.error || 'Failed to save response');
      }

      return result;
    } catch (error) {
      console.error('Failed to save response:', error);
      throw error;
    }
  }

  // Delete a response
  async deleteResponse(responseKey) {
    try {
      const result = await this.makeRequest(`/api/responses/${responseKey}`, {
        method: 'DELETE'
      });

      if (!result.success) {
        throw new Error(result.error || 'Failed to delete response');
      }

      return result;
    } catch (error) {
      console.error('Failed to delete response:', error);
      throw error;
    }
  }

  // Get assessment statistics
  async getStatistics() {
    try {
      const result = await this.makeRequest('/api/stats');
      return result.success ? result.statistics : null;
    } catch (error) {
      console.error('Failed to get statistics:', error);
      return null;
    }
  }

  // Health check
  async healthCheck() {
    try {
      const result = await this.makeRequest('/health');
      return result.status === 'healthy';
    } catch (error) {
      console.error('Health check failed:', error);
      return false;
    }
  }

  // Batch operations for better performance
  async batchSaveResponses(responses) {
    try {
      const promises = responses.map(({ storeId, section, questionId, procedureIndex, response }) =>
        this.saveResponse(storeId, section, questionId, procedureIndex, response)
      );

      const results = await Promise.allSettled(promises);
      
      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;

      return {
        successful,
        failed,
        total: responses.length,
        results
      };
    } catch (error) {
      console.error('Batch save failed:', error);
      throw error;
    }
  }
}

// Create and export a singleton instance
const apiService = new ApiService();
export default apiService;


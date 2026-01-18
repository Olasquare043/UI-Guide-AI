import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://ui-guide-api-production.up.railway.app';

// Create axios instance with better configuration
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 seconds timeout for long responses
});

// Request interceptor for logging
api.interceptors.request.use(
  (config) => {
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const errorMessage = getErrorMessage(error);
    console.error('API Response Error:', {
      message: errorMessage,
      status: error.response?.status,
      url: error.config?.url,
    });
    
    // Create a user-friendly error object
    const userError = new Error(errorMessage);
    userError.status = error.response?.status;
    userError.isNetworkError = !error.response;
    userError.isTimeout = error.code === 'ECONNABORTED';
    
    return Promise.reject(userError);
  }
);

// Helper function to generate user-friendly error messages
function getErrorMessage(error) {
  if (!error.response) {
    if (error.code === 'ECONNABORTED') {
      return 'Request timed out. The server is taking too long to respond.';
    }
    if (error.message === 'Network Error') {
      return 'Network connection error. Please check your internet connection.';
    }
    return 'Unable to connect to the server. Please try again later.';
  }

  switch (error.response.status) {
    case 400:
      return 'Bad request. Please check your input and try again.';
    case 401:
      return 'Authentication required. Please refresh the page.';
    case 403:
      return 'Access forbidden. You do not have permission.';
    case 404:
      return 'Resource not found. The requested endpoint does not exist.';
    case 429:
      return 'Too many requests. Please wait a moment before trying again.';
    case 500:
      return 'Server error. Our team has been notified. Please try again later.';
    case 502:
    case 503:
    case 504:
      return 'Service temporarily unavailable. Please try again in a few moments.';
    default:
      return `Server returned an error (${error.response.status}). Please try again.`;
  }
}

export const sendMessage = async (message, threadId = null) => {
  try {
    const response = await api.post('/chat', {
      message,
      thread_id: threadId,
    });
    
    // Validate response structure
    if (!response.data || typeof response.data !== 'object') {
      throw new Error('Invalid response format from server');
    }
    
    // Ensure required fields exist with defaults
    const safeResponse = {
      answer: response.data.answer || 'No response received.',
      used_retriever: response.data.used_retriever || false,
      thread_id: response.data.thread_id || threadId || `user_${Date.now()}`,
      // Handle citations/sources if provided by backend
      sources: response.data.sources || null,
      confidence: response.data.confidence || null,
    };
    
    return safeResponse;
  } catch (error) {
    console.error('Chat API Error:', error);
    
    // Re-throw with additional context
    error.context = 'Failed to send message to AI assistant';
    throw error;
  }
};

export const checkHealth = async () => {
  try {
    const response = await api.get('/health');
    
    // Add timestamp for health check tracking
    const healthData = {
      ...response.data,
      timestamp: new Date().toISOString(),
      frontendVersion: '2.0.0', // Increment with major changes
    };
    
    return healthData;
  } catch (error) {
    console.error('Health check failed:', error);
    
    // Return degraded status instead of throwing
    return {
      status: 'degraded',
      message: 'Unable to reach backend server',
      timestamp: new Date().toISOString(),
      frontendVersion: '2.0.0',
    };
  }
};

// New function for connection testing
export const testConnection = async () => {
  try {
    const startTime = Date.now();
    const response = await api.get('/');
    const endTime = Date.now();
    
    return {
      connected: true,
      responseTime: endTime - startTime,
      status: response.data.status || 'unknown',
      version: response.data.version,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    return {
      connected: false,
      error: error.message,
      timestamp: new Date().toISOString(),
    };
  }
};

// Export the api instance for other components if needed
export default api;
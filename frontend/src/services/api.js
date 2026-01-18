import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://ui-guide-api-production.up.railway.app';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const sendMessage = async (message, threadId = null) => {
  try {
    const response = await api.post('/chat', {
      message,
      thread_id: threadId,
    });
    return response.data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

export const checkHealth = async () => {
  try {
    const response = await api.get('/health');
    return response.data;
  } catch (error) {
    console.error('Health check failed:', error);
    throw error;
  }
};

export default api;
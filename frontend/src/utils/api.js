import axios from 'axios';
import BASE_URL from '../config/baseUrl'
const api = axios.create({ baseURL: '/api' });

export const getProviders = () => api.get('/providers');
export const createConversation = (data) => api.post('/conversations', data);
export const getConversations = () => api.get('/conversations');
export const getConversation = (sessionId) => api.get(`/conversations/${sessionId}`);
export const cancelConversation = (sessionId) => api.patch(`/conversations/${sessionId}/cancel`);
export const saveMessages = (sessionId, data) => api.post(`/conversations/${sessionId}/save`, data);
export const getDashboardStats = (params) => api.get('/dashboard/stats', { params });
export const getLogs = (params) => api.get('/logs', { params });

export const streamMessage = (sessionId, content) => {
  return new EventSource(`/api/conversations/${sessionId}/messages?content=${encodeURIComponent(content)}`);
};

export default api;

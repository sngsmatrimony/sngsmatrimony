import axios from 'axios';

const adminClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000',
});

// Request interceptor - attach admin token
adminClient.interceptors.request.use((config) => {
  // Only access localStorage in browser environment
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('adminAuthToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }

  // Only set Content-Type for non-FormData requests
  if (!(config.data instanceof FormData)) {
    config.headers['Content-Type'] = 'application/json';
  }

  return config;
});

// Response interceptor - handle errors
adminClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Only access browser APIs in browser environment
      if (typeof window !== 'undefined') {
        localStorage.removeItem('adminAuthToken');
        window.location.href = '/admin/login';
      }
    }
    return Promise.reject(error);
  }
);

export default adminClient;

import axios from 'axios';
import type { PunchDataFile, ApiResponse } from '../types';

// Prioritize deployed backend URL for production
// Only use localhost fallback in development mode
const getApiBaseUrl = (): string => {
  // Debug: Log all available environment variables
  console.log('🔍 Environment check:', {
    VITE_API_DEPLOY_URL: import.meta.env.VITE_API_DEPLOY_URL,
    VITE_API_BASE_URL: import.meta.env.VITE_API_BASE_URL,
    MODE: import.meta.env.MODE,
    DEV: import.meta.env.DEV,
    PROD: import.meta.env.PROD,
  });

  // First priority: Deployed backend URL (for production/deployment)
  // Use this if set, regardless of dev/prod mode
  if (import.meta.env.VITE_API_DEPLOY_URL) {
    const url = import.meta.env.VITE_API_DEPLOY_URL;
    console.log('✅ Using deployed backend URL:', url);
    return url;
  }
  
  // Second priority: Base URL (for local development with custom backend)
  if (import.meta.env.VITE_API_BASE_URL) {
    const url = import.meta.env.VITE_API_BASE_URL;
    console.log('✅ Using base URL:', url);
    return url;
  }
  
  // Only use localhost in development mode
  if (import.meta.env.DEV) {
    console.warn('⚠️ Using localhost fallback. To use deployed backend, create .env.local with:');
    console.warn('   VITE_API_DEPLOY_URL=https://your-deployed-backend-url.com');
    return 'http://localhost:8000';
  }
  
  // In production, if no URL is set, show warning
  console.error(
    '❌ VITE_API_DEPLOY_URL is not set! API calls will fail. Please configure it in your Vercel environment variables.'
  );
  // Return empty string so API calls fail with clear network errors
  return '';
};

const API_BASE_URL = getApiBaseUrl();

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  // Ensure proper URL encoding for query parameters
  paramsSerializer: {
    encode: (param: string) => {
      // Custom encoder to ensure dates with / are properly encoded
      return encodeURIComponent(param);
    },
  },
});

// Add request interceptor to log what's being sent
api.interceptors.request.use(
  (config) => {
    // Log request details, especially for date parameters
    if (config.params) {
      console.log('API Request:', {
        url: config.url,
        method: config.method,
        params: config.params,
        fullUrl: `${config.baseURL}${config.url}?${new URLSearchParams(config.params).toString()}`,
      });
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for debugging
api.interceptors.response.use(
  (response) => {
    // Log successful responses for debugging
    console.log('API Response:', {
      url: response.config.url,
      status: response.status,
      dataType: Array.isArray(response.data) ? 'array' : typeof response.data,
      dataLength: Array.isArray(response.data) ? response.data.length : 'N/A',
    });
    return response;
  },
  (error) => {
    // Log errors
    console.error('API Error:', {
      url: error.config?.url,
      status: error.response?.status,
      message: error.message,
      data: error.response?.data,
    });
    return Promise.reject(error);
  }
);

// All Data endpoints
export const allDataApi = {
  // Fetch from external API and save to database
  fetchAndSave: async (fromDate: string, toDate: string): Promise<ApiResponse<any>> => {
    const response = await api.get(`/inout/list/`, {
      params: { from_date: fromDate, to_date: toDate },
    });
    return response.data;
  },

  // Search attendance data (doesn't save to DB)
  search: async (fromDate: string, toDate: string, empcode?: string): Promise<ApiResponse<any>> => {
    const params: any = { from_date: fromDate, to_date: toDate };
    if (empcode) params.empcode = empcode;
    const response = await api.get(`/inout/search/`, { params });
    return response.data;
  },

  // Filter by employee
  filter: async (empcode: string, fromDate: string, toDate: string): Promise<ApiResponse<any>> => {
    const response = await api.get(`/inout/filter/`, {
      params: { empcode, from_date: fromDate, to_date: toDate },
    });
    return response.data;
  },
};

// MCID Data endpoints
export const mcidDataApi = {
  // Fetch MCID data and save to database
  fetch: async (fromDate: string, toDate: string): Promise<ApiResponse<any>> => {
    const response = await api.get(`/mcid-data/fetch/`, {
      params: { from_date: fromDate, to_date: toDate },
    });
    return response.data;
  },

  // Process MCID data operations
  process: async (fromDate: string, toDate: string, empcode?: string): Promise<ApiResponse<any>> => {
    const params: any = { from_date: fromDate, to_date: toDate };
    if (empcode) params.empcode = empcode;
    const response = await api.get(`/mcid-data/process/`, { params });
    return response.data;
  },
};

// File Management endpoints
export const fileApi = {
  // Get all files
  getAll: async (limit?: number, offset?: number): Promise<ApiResponse<PunchDataFile[]>> => {
    const params: any = {};
    if (limit) params.limit = limit;
    if (offset) params.offset = offset;
    const response = await api.get(`/files/list/`, { params });
    return response.data;
  },

  // Get file by ID
  getById: async (fileId: number): Promise<ApiResponse<PunchDataFile>> => {
    const response = await api.get(`/files/detail/${fileId}/`);
    return response.data;
  },

  // Process file operations
  process: async (fileId: number): Promise<ApiResponse<any>> => {
    const response = await api.get(`/files/process/${fileId}/`);
    return response.data;
  },
};

// MCID endpoints (different from mcid-data)
export const mcidApi = {
  export: async (fromDate: string, toDate: string): Promise<ApiResponse<any>> => {
    const response = await api.get(`/mcid/export/`, {
      params: { from_date: fromDate, to_date: toDate },
    });
    return response.data;
  },

  record: async (empcode: string, fromDate: string, toDate: string): Promise<ApiResponse<any>> => {
    const response = await api.get(`/mcid/record/`, {
      params: { empcode, from_date: fromDate, to_date: toDate },
    });
    return response.data;
  },

  records: async (fromDate: string, toDate: string, empcode?: string): Promise<ApiResponse<any>> => {
    const params: any = { from_date: fromDate, to_date: toDate };
    if (empcode) params.empcode = empcode;
    const response = await api.get(`/mcid/records/`, { params });
    return response.data;
  },
};

export default api;


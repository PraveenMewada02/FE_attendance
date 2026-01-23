import axios from 'axios';
import type { PunchDataFile, ApiResponse } from '../types';

// Get API base URL from environment variable
const getApiBaseUrl = (): string => {
  const url = import.meta.env.VITE_API_DEPLOY_URL;
  
  // Debug: Log what we're getting from the environment
  console.log('🔍 Environment variable check:', {
    VITE_API_DEPLOY_URL: url,
    type: typeof url,
    isUndefined: url === undefined,
    isNull: url === null,
    isEmpty: url === '',
    trimmed: url?.trim(),
    allEnvVars: Object.keys(import.meta.env).filter(key => key.startsWith('VITE_')),
  });
  
  // Check if the variable exists but is undefined (common Vite issue)
  if (url === undefined) {
    console.error('❌ VITE_API_DEPLOY_URL is undefined!');
    console.error('');
    console.error('This usually means:');
    console.error('1. The .env file is not in the root directory (same level as package.json)');
    console.error('2. The dev server was not restarted after creating/editing the .env file');
    console.error('3. The variable name is misspelled (must be exactly: VITE_API_DEPLOY_URL)');
    console.error('');
    console.error('To fix:');
    console.error('1. Create/check .env file in root directory with:');
    console.error('   VITE_API_DEPLOY_URL=http://localhost:8000');
    console.error('2. Make sure there are NO spaces around the = sign');
    console.error('3. Make sure there are NO quotes around the value');
    console.error('4. STOP the dev server (Ctrl+C)');
    console.error('5. START it again: npm run dev');
    return '';
  }
  
  if (!url || url.trim() === '') {
    console.error(
      '❌ VITE_API_DEPLOY_URL is empty! API calls will fail.'
    );
    console.error('   Check your .env file - the value appears to be empty or whitespace only.');
    console.error('   Make sure it looks like: VITE_API_DEPLOY_URL=http://localhost:8000');
    console.error('   Then restart your development server completely.');
    return '';
  }

  // Check for placeholder values
  const placeholderPatterns = [
    /YOUR_DEPLOYED_URL_HERE/i,
    /your-backend-api-url/i,
    /your-deployed-backend-url/i,
    /example\.com/i,
    /placeholder/i,
  ];

  for (const pattern of placeholderPatterns) {
    if (pattern.test(url)) {
      console.error(
        `❌ VITE_API_DEPLOY_URL appears to be a placeholder: "${url}"`
      );
      console.error('   Please replace it with your actual backend API URL in .env.local');
      console.error('   Then restart your development server.');
      return '';
    }
  }

  // Validate that it's a proper URL
  try {
    const urlObj = new URL(url);
    // Ensure it's http or https
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      console.error(
        `❌ VITE_API_DEPLOY_URL must use http or https protocol: "${url}"`
      );
      return '';
    }
  } catch (e) {
    console.error(
      `❌ VITE_API_DEPLOY_URL is not a valid URL: "${url}"`
    );
    console.error('   It should be a full URL like: https://api.example.com');
    console.error('   Update it in .env.local and restart your development server.');
    return '';
  }

  // Remove trailing slash if present
  return url.replace(/\/$/, '');
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

// Add request interceptor to log what's being sent and validate baseURL
api.interceptors.request.use(
  (config) => {
    // Check if baseURL is set
    if (!config.baseURL || config.baseURL.trim() === '') {
      const error = new Error(
        'VITE_API_DEPLOY_URL is not configured. Please set it in your .env.local file and restart the server.'
      ) as any;
      error.config = config;
      return Promise.reject(error);
    }

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

// Email endpoints
export interface EmailAttendanceRequest {
  empcode: string;
  email: string;
  employeeName: string;
  fromDate: string;
  toDate: string;
  attendanceData: any[];
}

export const emailApi = {
  // Send attendance report via email
  sendAttendanceReport: async (data: EmailAttendanceRequest): Promise<ApiResponse<any>> => {
    const response = await api.post(`/email/send-attendance/`, data);
    return response.data;
  },
};

export default api;


import axios, { type AxiosInstance, type AxiosRequestConfig, type AxiosResponse } from 'axios';

import { $t } from '@/locales';
import { localStg } from '@/utils/storage';

import type { ApiResponse, PageResponse } from './types';
import { ErrorCode } from './types';

// API客户端类
class ApiClient {
  private instance: AxiosInstance;
  private baseURL: string;

  constructor() {
    // 使用本地API地址
    this.baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

    console.log(`🌐 API Base URL: ${this.baseURL}`);

    // 创建axios实例
    this.instance = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });

    // 设置请求拦截器
    this.setupRequestInterceptors();

    // 设置响应拦截器
    this.setupResponseInterceptors();
  }

  /** 设置请求拦截器 */
  private setupRequestInterceptors() {
    this.instance.interceptors.request.use(
      config => {
        // 打印请求信息
        console.log('🚀 发送请求:', {
          baseURL: config.baseURL,
          data: config.data,
          fullURL: `${config.baseURL}${config.url}`,
          headers: {
            Authorization: config.headers?.Authorization ? '已设置' : '未设置',
            'Content-Type': config.headers?.['Content-Type']
          },
          method: config.method?.toUpperCase(),
          params: config.params,
          url: config.url
        });

        // 添加认证token
        const token = localStg.get('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
          console.log('✅ Token已添加到请求头');
        } else {
          console.log('⚠️ 未找到认证Token');
        }

        // 添加时间戳防止缓存
        if (config.method === 'get') {
          config.params = {
            ...config.params,
            _t: Date.now()
          };
        }

        return config;
      },
      error => {
        console.error('❌ 请求拦截器错误:', error);
        return Promise.reject(error);
      }
    );
  }

  /** 设置响应拦截器 */
  private setupResponseInterceptors() {
    this.instance.interceptors.response.use(
      (response: AxiosResponse<ApiResponse>) => {
        console.log('📨 收到响应:', {
          data: response.data,
          status: response.status,
          statusText: response.statusText,
          url: response.config.url
        });

        // 如果是blob类型响应，直接返回数据
        if (response.config.responseType === 'blob') {
          console.log('📦 Blob响应，直接返回');
          return response.data;
        }

        const { code, data, message } = response.data;

        // 成功响应
        if (code === ErrorCode.SUCCESS) {
          console.log('✅ 业务成功响应，返回data:', data);
          return data;
        }

        // 业务错误
        console.error('❌ 业务错误响应:', { code, message });
        const error = new Error(message || '请求失败');
        (error as any).code = code;
        return Promise.reject(error);
      },
      error => {
        console.error('❌ HTTP响应错误:', {
          config: {
            baseURL: error.config?.baseURL,
            method: error.config?.method,
            url: error.config?.url
          },
          message: error.message,
          response: error.response?.data,
          status: error.response?.status
        });

        // 网络错误或HTTP状态码错误
        if (error.response) {
          const { data, status } = error.response;

          switch (status) {
            case 401:
              // Token过期或无效，清除本地存储并跳转登录
              console.log('🔐 Token过期，清除存储并跳转登录');
              localStg.remove('token');
              localStg.remove('refreshToken');
              window.location.href = '/login';
              return Promise.reject(new Error($t('common.unauthorized')));

            case 403:
              return Promise.reject(new Error($t('common.forbidden')));

            case 404:
              console.log('🔍 请求的资源不存在 (404)');
              return Promise.reject(new Error($t('common.notFound')));

            case 500:
              return Promise.reject(new Error($t('common.serverError')));

            default:
              return Promise.reject(new Error(data?.message || $t('common.requestError')));
          }
        } else if (error.request) {
          // 网络错误
          console.error('🌐 网络连接错误');
          return Promise.reject(new Error($t('common.networkError')));
        } else {
          // 其他错误
          console.error('❓ 其他错误:', error.message);
          return Promise.reject(new Error(error.message || $t('common.unknownError')));
        }
      }
    );
  }

  /** GET请求 */
  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.instance.get(url, config);
  }

  /** POST请求 */
  async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return this.instance.post(url, data, config);
  }

  /** PUT请求 */
  async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return this.instance.put(url, data, config);
  }

  /** DELETE请求 */
  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.instance.delete(url, config);
  }

  /** PATCH请求 */
  async patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return this.instance.patch(url, data, config);
  }

  /** 上传文件 */
  async upload<T = any>(url: string, file: File, data?: Record<string, any>): Promise<T> {
    const formData = new FormData();
    formData.append('file', file);

    if (data) {
      Object.keys(data).forEach(key => {
        formData.append(key, data[key]);
      });
    }

    return this.instance.post(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  }

  /** 下载文件 */
  async download(url: string, filename?: string): Promise<void> {
    const response = await this.instance.get(url, {
      responseType: 'blob'
    });

    const blob = new Blob([response.data]);
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = filename || 'download';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(downloadUrl);
  }
}

// 创建全局API客户端实例
export const apiClient = new ApiClient();

// 便捷的模拟数据工具函数
export const createMockResponse = <T>(data: T, delay = 500): Promise<T> => {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve(data);
    }, delay);
  });
};

// 创建分页模拟响应
export const createMockPageResponse = <T>(
  records: T[],
  options: {
    current?: number;
    delay?: number;
    size?: number;
  } = {}
): Promise<PageResponse<T>['data']> => {
  const { current = 1, delay = 500, size = 10 } = options;

  return new Promise(resolve => {
    setTimeout(() => {
      const start = (current - 1) * size;
      const end = start + size;
      const pageRecords = records.slice(start, end);

      resolve({
        current,
        pages: Math.ceil(records.length / size),
        records: pageRecords,
        size,
        total: records.length
      });
    }, delay);
  });
};

// 模拟后端错误用于测试
export const fetchCustomBackendError = (code: string, message: string): Promise<never> => {
  return new Promise((_, reject) => {
    setTimeout(() => {
      const error = new Error(message);
      (error as any).code = code;
      reject(error);
    }, 500);
  });
};

export default apiClient;

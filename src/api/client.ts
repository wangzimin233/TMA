import axios from 'axios';
import { useAuthStore } from '../store/auth.store';

export type ApiResult<T> = {
  code: number;
  message: string;
  data: T;
};

export class ApiError extends Error {
  code: number;

  constructor(code: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
  }
}

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || window.location.origin,
  timeout: 15000,
});

apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token || localStorage.getItem('access_token');

  if (token) {
    config.headers.Authorization = token;
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => {
    const result = response.data as ApiResult<unknown>;

    if (result && typeof result === 'object' && 'code' in result) {
      if (result.code === 200) return response;
      if (result.code === 401) useAuthStore.getState().clearSession();

      throw new ApiError(result.code, result.message || getDefaultErrorMessage(result.code));
    }

    return response;
  },
  (error) => {
    const status = error.response?.status;

    if (status === 401) {
      useAuthStore.getState().clearSession();
    }

    return Promise.reject(error);
  },
);

export async function requestData<T>(promise: Promise<{ data: ApiResult<T> }>) {
  const response = await promise;
  return response.data.data;
}

export function getErrorMessage(error: unknown) {
  if (error instanceof ApiError) return error.message;
  if (axios.isAxiosError(error)) {
    const result = error.response?.data as Partial<ApiResult<unknown>> | undefined;
    return result?.message || error.message || '系统繁忙，请稍后再试';
  }

  if (error instanceof Error) return error.message;
  return '系统繁忙，请稍后再试';
}

function getDefaultErrorMessage(code: number) {
  if (code === 400) return '参数错误';
  if (code === 401) return '请先登录';
  if (code === 403) return '无权限访问';
  return '系统繁忙，请稍后再试';
}

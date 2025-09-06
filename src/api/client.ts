import axios, { AxiosInstance } from 'axios';
import type {
  ApiResponse,
  User,
  SearchResponse,
  LineRealTimeInfo,
  Bus,
} from './types.js';

const BASE_URL = 'https://api.369cx.cn/v2';
const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';

export class Travel369Client {
  private client: AxiosInstance;
  private token: string | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: BASE_URL,
      headers: {
        'User-Agent': USER_AGENT,
        'Content-Type': 'application/json',
      },
    });
  }

  setToken(token: string): void {
    this.token = token;
    this.client.defaults.headers.common['Authorization'] = token;
  }

  clearToken(): void {
    this.token = null;
    delete this.client.defaults.headers.common['Authorization'];
  }

  async requestScanId(): Promise<string> {
    try {
      const response = await this.client.get<ApiResponse<null>>('/Auth/LoginByScan/1');
      if (response.data.status.code === 401 && response.data.status.msg) {
        return response.data.status.msg;
      }
      throw new Error('Failed to get scanId');
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`Request failed: ${error.message}`);
      }
      throw error;
    }
  }

  async pollLoginStatus(scanId: string): Promise<{ success: boolean; user?: User }> {
    try {
      const response = await this.client.get<ApiResponse<User>>(`/Auth/LoginByScan/${scanId}`);
      const { code, msg } = response.data.status;

      if (code === 0 && response.data.result) {
        this.setToken(response.data.result.token);
        return { success: true, user: response.data.result };
      }

      return { success: false };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`Poll login failed: ${error.message}`);
      }
      throw error;
    }
  }

  async search(keyword: string): Promise<SearchResponse> {
    if (!this.token) {
      throw new Error('Not authenticated. Please login first.');
    }

    try {
      const response = await this.client.post<ApiResponse<SearchResponse>>(
        '/Search',
        { keyword },
        {
          headers: {
            Authorization: this.token,
          },
        }
      );

      if (response.data.status.code === 0) {
        return response.data.result;
      }

      throw new Error(`Search failed: ${response.data.status.msg}`);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`Search request failed: ${error.message}`);
      }
      throw error;
    }
  }

  async getLineRealTimeInfo(lineId: number): Promise<LineRealTimeInfo> {
    if (!this.token) {
      throw new Error('Not authenticated. Please login first.');
    }

    try {
      const response = await this.client.get<ApiResponse<LineRealTimeInfo>>(
        `/Line/GetRealTimeLineInfo/${lineId}`,
        {
          headers: {
            Authorization: this.token,
          },
        }
      );

      if (response.data.status.code === 0) {
        return response.data.result;
      }

      throw new Error(`Get line info failed: ${response.data.status.msg}`);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`Get line info request failed: ${error.message}`);
      }
      throw error;
    }
  }

  async getBussesByLineId(lineId: number): Promise<Bus[]> {
    if (!this.token) {
      throw new Error('Not authenticated. Please login first.');
    }

    try {
      const response = await this.client.get<ApiResponse<Bus[]>>(
        `/Bus/GetBussesByLineId/${lineId}`,
        {
          headers: {
            Authorization: this.token,
          },
        }
      );

      if (response.data.status.code === 0) {
        return response.data.result;
      }

      throw new Error(`Get buses failed: ${response.data.status.msg}`);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`Get buses request failed: ${error.message}`);
      }
      throw error;
    }
  }
}

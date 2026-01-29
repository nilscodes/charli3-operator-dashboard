import axios, { AxiosInstance, AxiosError } from 'axios';
import {
  NodesResponse,
  BalanceInfo,
  TransactionsResponse,
  RewardBalanceResponse,
  PriceResponse,
  RewardBreakdownResponse,
  ROISummaryResponse,
} from '@/types/api';

const API_KEY_STORAGE_KEY = 'charli3_api_key';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: import.meta.env.VITE_API_URL || '/api',
      timeout: 30000,
    });

    this.client.interceptors.request.use(
      (config) => {
        const apiKey = this.getApiKey();
        if (apiKey) {
          config.headers['X-API-Key'] = apiKey;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.response?.status === 401) {
          this.clearApiKey();
          window.location.href = '/';
        }
        return Promise.reject(error);
      }
    );
  }

  setApiKey(apiKey: string): void {
    sessionStorage.setItem(API_KEY_STORAGE_KEY, apiKey);
  }

  getApiKey(): string | null {
    return sessionStorage.getItem(API_KEY_STORAGE_KEY);
  }

  clearApiKey(): void {
    sessionStorage.removeItem(API_KEY_STORAGE_KEY);
  }

  hasApiKey(): boolean {
    return !!this.getApiKey();
  }

  async getNodes(): Promise<NodesResponse> {
    const response = await this.client.get<NodesResponse>('/nodes');
    return response.data;
  }

  async getNodeBalance(address: string): Promise<BalanceInfo> {
    const response = await this.client.get<BalanceInfo>(`/nodes/${address}/balance`);
    return response.data;
  }

  async getNodeTransactions(
    address: string,
    fromDate?: Date,
    toDate?: Date
  ): Promise<TransactionsResponse> {
    const params: Record<string, string> = {};
    
    if (fromDate) {
      params.fromDate = fromDate.toISOString();
    }
    
    if (toDate) {
      params.toDate = toDate.toISOString();
    }

    const response = await this.client.get<TransactionsResponse>(
      `/nodes/${address}/transactions`,
      { params }
    );
    return response.data;
  }

  async getRewardBalance(): Promise<RewardBalanceResponse> {
    const response = await this.client.get<RewardBalanceResponse>('/reward/balance');
    return response.data;
  }

  async getTokenPrice(): Promise<PriceResponse> {
    const response = await this.client.get<PriceResponse>('/reward/price');
    return response.data;
  }

  async getRewardBreakdown(): Promise<RewardBreakdownResponse> {
    const response = await this.client.get<RewardBreakdownResponse>('/reward/breakdown');
    return response.data;
  }

  async getROISummary(): Promise<ROISummaryResponse> {
    const response = await this.client.get<ROISummaryResponse>('/roi/summary');
    return response.data;
  }
}

export const apiClient = new ApiClient();

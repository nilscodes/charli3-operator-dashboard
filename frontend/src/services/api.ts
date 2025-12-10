import axios, { AxiosInstance, AxiosError } from 'axios';
import {
  NodesResponse,
  BalanceInfo,
  TransactionsResponse,
  RewardBalanceResponse,
  PriceResponse,
} from '@/types/api';

const API_KEY_STORAGE_KEY = 'charli3_api_key';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: import.meta.env.VITE_API_URL || '/api',
      timeout: 30000,
    });

    // Request interceptor to add API key
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

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.response?.status === 401) {
          // Clear invalid API key
          this.clearApiKey();
          // Redirect to login
          window.location.href = '/';
        }
        return Promise.reject(error);
      }
    );
  }

  /**
   * Store API key in session storage
   */
  setApiKey(apiKey: string): void {
    sessionStorage.setItem(API_KEY_STORAGE_KEY, apiKey);
  }

  /**
   * Get API key from session storage
   */
  getApiKey(): string | null {
    return sessionStorage.getItem(API_KEY_STORAGE_KEY);
  }

  /**
   * Clear API key from session storage
   */
  clearApiKey(): void {
    sessionStorage.removeItem(API_KEY_STORAGE_KEY);
  }

  /**
   * Check if API key is set
   */
  hasApiKey(): boolean {
    return !!this.getApiKey();
  }

  /**
   * Get all nodes with their balance information
   */
  async getNodes(): Promise<NodesResponse> {
    const response = await this.client.get<NodesResponse>('/nodes');
    return response.data;
  }

  /**
   * Get balance information for a specific address
   */
  async getNodeBalance(address: string): Promise<BalanceInfo> {
    const response = await this.client.get<BalanceInfo>(`/nodes/${address}/balance`);
    return response.data;
  }

  /**
   * Get transaction history for a specific address
   */
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

  /**
   * Get reward address token balance
   */
  async getRewardBalance(): Promise<RewardBalanceResponse> {
    const response = await this.client.get<RewardBalanceResponse>('/reward/balance');
    return response.data;
  }

  /**
   * Get current token price
   */
  async getTokenPrice(): Promise<PriceResponse> {
    const response = await this.client.get<PriceResponse>('/reward/price');
    return response.data;
  }
}

// Export singleton instance
export const apiClient = new ApiClient();


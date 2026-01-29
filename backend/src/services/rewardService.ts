import type { DatabaseService } from './database.js';
import type { PriceService } from './priceService.js';
import type { ConfigLoader } from '@config/loader.js';

export interface RewardBalanceResponse {
  address: string;
  policyId: string;
  balance: string;
}

export interface RewardPriceResponse {
  tokenId: string;
  price: number;
  currency: string;
  provider: string;
  timestamp: string;
}

export interface FeedRewardBreakdown {
  pair: string;
  oracleScriptAddress: string;
  tokenAmount: string;
  tokenAmountFormatted: string;
  transactionCount: number;
}

export interface RewardBreakdownResponse {
  feeds: FeedRewardBreakdown[];
  totalTokens: string;
}

export interface RewardService {
  getRewardBalance(): Promise<RewardBalanceResponse>;
  getRewardPrice(): Promise<RewardPriceResponse>;
  getRewardBreakdownByFeed(): Promise<RewardBreakdownResponse>;
}

export function createRewardService(
  dbService: DatabaseService,
  priceService: PriceService,
  configLoader: typeof ConfigLoader
): RewardService {
  return {
    async getRewardBalance(): Promise<RewardBalanceResponse> {
      const config = configLoader.config;
      const rawBalance = await dbService.getTokenBalance(config.rewardAddress, config.tokenPolicy);
      
      // Convert from smallest unit to full token amount (e.g., 1000000 with 6 decimals = 1.0)
      const decimals = config.tokenDecimals || 6;
      const balanceNumber = Number(rawBalance) / Math.pow(10, decimals);
      const balance = balanceNumber.toString();

      return {
        address: config.rewardAddress,
        policyId: config.tokenPolicy,
        balance,
      };
    },

    async getRewardPrice(): Promise<RewardPriceResponse> {
      const config = configLoader.config;
      const price = await priceService.getPrice(config.priceProvider.tokenId);

      return {
        tokenId: config.priceProvider.tokenId,
        price,
        currency: 'USD',
        provider: config.priceProvider.type,
        timestamp: new Date().toISOString(),
      };
    },

    async getRewardBreakdownByFeed(): Promise<RewardBreakdownResponse> {
      const config = configLoader.config;
      const decimals = config.tokenDecimals || 6;

      const feedBreakdowns = await Promise.all(
        config.nodes.map(async (node) => {
          const { totalTokens, transactionCount } = await dbService.getRewardTransactionsByScript(
            config.rewardAddress,
            config.tokenPolicy,
            node.oracleScriptAddress
          );

          const tokenAmountFormatted = (Number(totalTokens) / Math.pow(10, decimals)).toString();

          return {
            pair: node.pair,
            oracleScriptAddress: node.oracleScriptAddress,
            tokenAmount: totalTokens,
            tokenAmountFormatted,
            transactionCount,
          };
        })
      );

      const totalTokens = feedBreakdowns.reduce((sum, feed) => sum + BigInt(feed.tokenAmount), BigInt(0)).toString();

      return {
        feeds: feedBreakdowns,
        totalTokens,
      };
    }
  };
}

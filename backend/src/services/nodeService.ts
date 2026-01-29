import type { DatabaseService } from './database.js';
import type { ConfigLoader } from '@config/loader.js';
import type { PriceService } from './priceService.js';

export interface NodeWithBalance {
  address: string;
  pair: string;
  oracleScriptAddress: string;
  startDate: string;
  endDate?: string;
  currentBalance: string;
  lifetimeReceived: string;
  lifetimeSpent: string;
  isBelowThreshold: boolean;
  threshold: string;
  rewardTokensEarned: string;
  rewardValueAda: string;
  roiPercent: number;
  estimatedRewardTokens: string;
  estimatedRoiPercent: number;
}

export interface NodesResponse {
  nodes: NodeWithBalance[];
  adaThreshold: string;
}

export interface TransactionHistoryResponse {
  address: string;
  fromDate?: string;
  toDate?: string;
  transactions: Array<{
    txHash: string;
    blockTime: Date;
    value: string;
    txIndex: number;
  }>;
  stats: {
    count: number;
    totalSpent: string;
    totalReceived: string;
  };
}

export interface NodeService {
  getAllNodesWithBalances(): Promise<NodesResponse>;
  getNodeBalance(address: string): Promise<{
    address: string;
    currentBalance: string;
    lifetimeReceived: string;
    lifetimeSpent: string;
  }>;
  getNodeTransactionHistory(
    address: string,
    fromDate?: Date,
    toDate?: Date
  ): Promise<TransactionHistoryResponse>;
}

export function createNodeService(
  dbService: DatabaseService,
  configLoader: typeof ConfigLoader,
  priceService: PriceService
): NodeService {
  return {
    async getAllNodesWithBalances(): Promise<NodesResponse> {
      const config = configLoader.config;
      const nodes = config.nodes;

      const [tokenPrice, adaPrice] = await Promise.all([
        priceService.getPrice(config.priceProvider.tokenId),
        priceService.getPrice('cardano'),
      ]);

      const decimals = config.tokenDecimals || 6;

      const nodeData = await Promise.all(
        nodes.map(async (node) => {
          const [balance, rewardData, rewardTimestamps] = await Promise.all([
            dbService.getBalanceInfo(node.address, node.oracleScriptAddress),
            dbService.getRewardTransactionsByScript(
              config.rewardAddress,
              config.tokenPolicy,
              node.oracleScriptAddress
            ),
            dbService.getRewardTransactionTimestamps(
              config.rewardAddress,
              config.tokenPolicy,
              node.oracleScriptAddress
            ),
          ]);

          const currentBalanceLovelace = BigInt(balance.currentBalance);
          const thresholdLovelace = BigInt(config.adaThreshold);
          const isBelowThreshold = currentBalanceLovelace < thresholdLovelace;

          const rewardTokens = Number(rewardData.totalTokens) / Math.pow(10, decimals);
          const rewardValueUsd = rewardTokens * tokenPrice;
          const feesAda = Number(balance.lifetimeSpent) / 1_000_000;
          const costsUsd = feesAda * adaPrice;
          
          const rewardValueAda = tokenPrice > 0 && adaPrice > 0 
            ? (rewardValueUsd / adaPrice)
            : 0;
          
          // ROI: (Revenue - Costs) / Costs × 100
          const roiPercent = costsUsd > 0 
            ? ((rewardValueUsd - costsUsd) / costsUsd) * 100
            : 0;

          let estimatedRoiPercent = 0;
          let estimatedTotalTokens = rewardTokens;
          
          if (rewardTimestamps.length >= 2) {
            const lastPayment = rewardTimestamps[rewardTimestamps.length - 1];
            const secondLastPayment = rewardTimestamps[rewardTimestamps.length - 2];
            const timeBetweenPaymentsMs = lastPayment.getTime() - secondLastPayment.getTime();
            const daysBetweenPayments = timeBetweenPaymentsMs / (1000 * 60 * 60 * 24);
            
            if (daysBetweenPayments > 0) {
              const now = new Date();
              const timeSinceLastPaymentMs = now.getTime() - lastPayment.getTime();
              const daysSinceLastPayment = timeSinceLastPaymentMs / (1000 * 60 * 60 * 24);
              
              const tokensPerPayment = rewardTokens / rewardTimestamps.length;
              const paymentCyclesElapsed = daysSinceLastPayment / daysBetweenPayments;
              const estimatedUnpaidTokens = tokensPerPayment * paymentCyclesElapsed;
              
              estimatedTotalTokens = rewardTokens + estimatedUnpaidTokens;
              const estimatedTotalValueUsd = estimatedTotalTokens * tokenPrice;
              
              estimatedRoiPercent = costsUsd > 0 
                ? ((estimatedTotalValueUsd - costsUsd) / costsUsd) * 100
                : 0;
            }
          } else if (rewardTimestamps.length === 1) {
            const firstPayment = rewardTimestamps[0];
            const launchDate = new Date(node.startDate);
            const timeToFirstPaymentMs = firstPayment.getTime() - launchDate.getTime();
            const daysToFirstPayment = timeToFirstPaymentMs / (1000 * 60 * 60 * 24);
            
            if (daysToFirstPayment > 0) {
              const now = new Date();
              const timeSinceFirstPaymentMs = now.getTime() - firstPayment.getTime();
              const daysSinceFirstPayment = timeSinceFirstPaymentMs / (1000 * 60 * 60 * 24);
              
              const paymentCyclesElapsed = daysSinceFirstPayment / daysToFirstPayment;
              const estimatedUnpaidTokens = rewardTokens * paymentCyclesElapsed;
              
              estimatedTotalTokens = rewardTokens + estimatedUnpaidTokens;
              const estimatedTotalValueUsd = estimatedTotalTokens * tokenPrice;
              
              estimatedRoiPercent = costsUsd > 0 
                ? ((estimatedTotalValueUsd - costsUsd) / costsUsd) * 100
                : 0;
            }
          }

          return {
            address: node.address,
            pair: node.pair,
            oracleScriptAddress: node.oracleScriptAddress,
            startDate: node.startDate,
            endDate: node.endDate,
            currentBalance: balance.currentBalance,
            lifetimeReceived: balance.lifetimeReceived,
            lifetimeSpent: balance.lifetimeSpent,
            isBelowThreshold,
            threshold: config.adaThreshold.toString(),
            rewardTokensEarned: rewardTokens.toFixed(2),
            rewardValueAda: rewardValueAda.toFixed(2),
            roiPercent: Number(roiPercent.toFixed(2)),
            estimatedRewardTokens: estimatedTotalTokens.toFixed(2),
            estimatedRoiPercent: Number(estimatedRoiPercent.toFixed(2)),
          };
        })
      );

      return {
        nodes: nodeData,
        adaThreshold: config.adaThreshold.toString(),
      };
    },

    async getNodeBalance(address: string) {
      const config = configLoader.config;
      const node = config.nodes.find(n => n.address === address);
      const oracleScriptAddress = node?.oracleScriptAddress;
      
      return await dbService.getBalanceInfo(address, oracleScriptAddress);
    },

    async getNodeTransactionHistory(
      address: string,
      fromDate?: Date,
      toDate?: Date
    ): Promise<TransactionHistoryResponse> {
      const config = configLoader.config;
      const node = config.nodes.find(n => n.address === address);
      const oracleScriptAddress = node?.oracleScriptAddress;

      const [transactions, stats] = await Promise.all([
        dbService.getTransactionHistory({ address, oracleScriptAddress, fromDate, toDate }),
        dbService.getTransactionStats(address, oracleScriptAddress, fromDate, toDate),
      ]);

      return {
        address,
        fromDate: fromDate?.toISOString(),
        toDate: toDate?.toISOString(),
        transactions,
        stats,
      };
    }
  };
}

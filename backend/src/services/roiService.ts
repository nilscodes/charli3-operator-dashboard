import type { NodeService } from './nodeService.js';
import type { RewardService } from './rewardService.js';
import type { PriceService } from './priceService.js';
import logger from '../helpers/logger.js';

export interface ROISummaryResponse {
  costs: {
    totalFeesLovelace: string;
    totalFeesAda: string;
    totalFeesUsd: number;
    adaPriceUsd: number;
  };
  revenue: {
    tokenBalance: string;
    tokenPriceUsd: number;
    totalRevenueUsd: number;
  };
  roi: {
    netProfitUsd: number;
    profitMarginPercent: number;
  };
  timestamp: string;
}

export interface ROIService {
  getROISummary(): Promise<ROISummaryResponse>;
}

export function createROIService(
  nodeService: NodeService,
  rewardService: RewardService,
  priceService: PriceService
): ROIService {
  return {
    async getROISummary(): Promise<ROISummaryResponse> {
      try {
        const [nodesData, rewardBalance, adaPrice, tokenPrice] = await Promise.all([
          nodeService.getAllNodesWithBalances(),
          rewardService.getRewardBalance(),
          priceService.getPrice('cardano'),
          rewardService.getRewardPrice(),
        ]);

        const totalFeesLovelace = nodesData.nodes.reduce((sum, node) => {
          return sum + BigInt(node.lifetimeSpent);
        }, BigInt(0));

        // 1 ADA = 1,000,000 lovelaces
        const totalFeesAda = Number(totalFeesLovelace) / 1_000_000;
        const totalFeesUsd = totalFeesAda * adaPrice;

        const tokenBalance = Number(rewardBalance.balance);
        const tokenPriceUsd = tokenPrice.price;
        const totalRevenueUsd = tokenBalance * tokenPriceUsd;

        const netProfitUsd = totalRevenueUsd - totalFeesUsd;
        
        // Profit margin: (Revenue - Costs) / Revenue × 100
        const profitMarginPercent = totalRevenueUsd > 0 
          ? ((totalRevenueUsd - totalFeesUsd) / totalRevenueUsd) * 100
          : 0;

        logger.info({
          totalFeesLovelace: totalFeesLovelace.toString(),
          totalFeesAda,
          totalFeesUsd,
          tokenBalance,
          totalRevenueUsd,
          netProfitUsd,
          profitMarginPercent
        }, 'ROI summary calculated');

        return {
          costs: {
            totalFeesLovelace: totalFeesLovelace.toString(),
            totalFeesAda: totalFeesAda.toFixed(6),
            totalFeesUsd,
            adaPriceUsd: adaPrice,
          },
          revenue: {
            tokenBalance: rewardBalance.balance,
            tokenPriceUsd,
            totalRevenueUsd,
          },
          roi: {
            netProfitUsd,
            profitMarginPercent,
          },
          timestamp: new Date().toISOString(),
        };
      } catch (error) {
        logger.error({ err: error }, 'Error calculating ROI summary');
        throw error;
      }
    }
  };
}

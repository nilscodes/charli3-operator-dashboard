import axios from 'axios';
import NodeCache from 'node-cache';
import logger from '../helpers/logger.js';

export interface PriceService {
  getPrice(tokenId: string): Promise<number>;
  clearCache(): void;
  getCacheStats(): { keys: number; hits: number; misses: number; ksize: number; vsize: number };
}

function createCoinGeckoPriceService(apiKey?: string, cacheTTL: number = 300): PriceService {
  const baseUrl = 'https://api.coingecko.com/api/v3';
  
  // stdTTL: standard time to live for each cache entry (default 5 minutes)
  // checkperiod: automatic check interval for expired cache entries
  const cache = new NodeCache({ 
    stdTTL: cacheTTL, 
    checkperiod: cacheTTL * 0.2,
    useClones: false
  });

  return {
    async getPrice(tokenId: string): Promise<number> {
      const cachedPrice = cache.get<number>(tokenId);
      if (cachedPrice !== undefined) {
        logger.info({ tokenId, price: cachedPrice }, 'PriceService cache hit');
        return cachedPrice;
      }

      logger.info({ tokenId }, 'PriceService cache miss, fetching from CoinGecko');
      
      try {
        const headers: Record<string, string> = {};
        
        if (apiKey) {
          headers['x-cg-pro-api-key'] = apiKey;
        }

        const response = await axios.get(`${baseUrl}/simple/price`, {
          params: {
            ids: tokenId,
            vs_currencies: 'usd',
          },
          headers,
          timeout: 10000,
        });

        const price = response.data[tokenId]?.usd;

        if (typeof price !== 'number') {
          throw new Error(`Price not found for token: ${tokenId}`);
        }

        cache.set(tokenId, price);
        logger.info({ tokenId, price }, 'PriceService cached price');

        return price;
      } catch (error) {
        if (axios.isAxiosError(error)) {
          if (error.response?.status === 429) {
            logger.error({ tokenId, status: 429 }, 'PriceService rate limit exceeded');
          }
          throw new Error(`CoinGecko API error: ${error.message}`);
        }
        throw error;
      }
    },

    clearCache(): void {
      cache.flushAll();
      logger.info('PriceService cache cleared');
    },

    getCacheStats(): { keys: number; hits: number; misses: number; ksize: number; vsize: number } {
      return {
        keys: cache.keys().length,
        hits: cache.getStats().hits,
        misses: cache.getStats().misses,
        ksize: cache.getStats().ksize,
        vsize: cache.getStats().vsize,
      };
    }
  };
}

export function createPriceService(type: string, config: { tokenId?: string; apiKey?: string }): PriceService {
  switch (type.toLowerCase()) {
    case 'coingecko':
      return createCoinGeckoPriceService(config.apiKey);
    default:
      throw new Error(`Unsupported price service type: ${type}`);
  }
}

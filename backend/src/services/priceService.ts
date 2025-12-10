import axios from 'axios';
import NodeCache from 'node-cache';
import logger from '../helpers/logger.js';

/**
 * Interface for price service providers
 * Allows for easy extension to other price sources beyond CoinGecko
 */
export interface IPriceService {
  /**
   * Get the current price for a token
   * @param tokenId - The token identifier (implementation-specific)
   * @returns The current price in USD
   */
  getPrice(tokenId: string): Promise<number>;
}

/**
 * CoinGecko implementation of the price service with caching
 */
export class CoinGeckoPriceService implements IPriceService {
  private readonly baseUrl = 'https://api.coingecko.com/api/v3';
  private readonly apiKey?: string;
  private readonly cache: NodeCache;

  constructor(apiKey?: string, cacheTTL: number = 300) {
    this.apiKey = apiKey;
    // Initialize cache with TTL in seconds (default 5 minutes = 300 seconds)
    // stdTTL: standard time to live for each cache entry
    // checkperiod: automatic check interval for expired cache entries
    this.cache = new NodeCache({ 
      stdTTL: cacheTTL, 
      checkperiod: cacheTTL * 0.2, // Check for expired entries every 20% of TTL
      useClones: false // Faster performance, since we're storing primitive numbers
    });
  }

  async getPrice(tokenId: string): Promise<number> {
    // Check cache first
    const cachedPrice = this.cache.get<number>(tokenId);
    if (cachedPrice !== undefined) {
      logger.info({ tokenId, price: cachedPrice }, 'PriceService cache hit');
      return cachedPrice;
    }

    // Cache miss, fetch from CoinGecko
    logger.info({ tokenId }, 'PriceService cache miss, fetching from CoinGecko');
    
    try {
      const headers: Record<string, string> = {};
      
      if (this.apiKey) {
        headers['x-cg-pro-api-key'] = this.apiKey;
      }

      const response = await axios.get(`${this.baseUrl}/simple/price`, {
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

      // Store in cache
      this.cache.set(tokenId, price);
      logger.info({ tokenId, price }, 'PriceService cached price');

      return price;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        // Log rate limit errors specifically
        if (error.response?.status === 429) {
          logger.error({ tokenId, status: 429 }, 'PriceService rate limit exceeded');
        }
        throw new Error(`CoinGecko API error: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Clear the price cache (useful for testing or manual refresh)
   */
  clearCache(): void {
    this.cache.flushAll();
    logger.info('PriceService cache cleared');
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { keys: number; hits: number; misses: number; ksize: number; vsize: number } {
    return {
      keys: this.cache.keys().length,
      hits: this.cache.getStats().hits,
      misses: this.cache.getStats().misses,
      ksize: this.cache.getStats().ksize,
      vsize: this.cache.getStats().vsize,
    };
  }
}

/**
 * Factory function to create price service instances
 */
export function createPriceService(type: string, config: { tokenId?: string; apiKey?: string }): IPriceService {
  switch (type.toLowerCase()) {
    case 'coingecko':
      return new CoinGeckoPriceService(config.apiKey);
    default:
      throw new Error(`Unsupported price service type: ${type}`);
  }
}


import fs from 'fs';
import yaml from 'js-yaml';
import type { AppConfig } from '../types/config.js';

export class ConfigLoader {
  private static instance: AppConfig | null = null;

  static load(configPath?: string): AppConfig {
    if (this.instance) {
      return this.instance;
    }

    const path = configPath || process.env.CONFIG_PATH || './config.yaml';

    try {
      const fileContents = fs.readFileSync(path, 'utf8');
      const config = yaml.load(fileContents) as AppConfig;

      // Validate required fields
      this.validate(config);

      this.instance = config;
      return config;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to load configuration: ${error.message}`);
      }
      throw error;
    }
  }

  private static validate(config: AppConfig): void {
    const errors: string[] = [];

    // Validate database config
    if (!config.database) {
      errors.push('database configuration is required');
    } else {
      if (!config.database.host) errors.push('database.host is required');
      if (!config.database.port) errors.push('database.port is required');
      if (!config.database.database) errors.push('database.database is required');
      if (!config.database.user) errors.push('database.user is required');
      if (!config.database.password) errors.push('database.password is required');
    }

    // Validate API keys
    if (!config.apiKeys || !Array.isArray(config.apiKeys) || config.apiKeys.length === 0) {
      errors.push('at least one API key is required');
    }

    // Validate Ada threshold
    if (typeof config.adaThreshold !== 'number' || config.adaThreshold < 0) {
      errors.push('adaThreshold must be a positive number');
    }

    // Validate nodes
    if (!config.nodes || !Array.isArray(config.nodes) || config.nodes.length === 0) {
      errors.push('at least one node configuration is required');
    } else {
      config.nodes.forEach((node, index) => {
        if (!node.address) {
          errors.push(`node[${index}].address is required`);
        }
        if (!node.pair || typeof node.pair !== 'string' || node.pair.trim() === '') {
          errors.push(`node[${index}].pair must be a non-empty string`);
        }
      });
    }

    // Validate reward address
    if (!config.rewardAddress) {
      errors.push('rewardAddress is required');
    }

    // Validate token policy
    if (!config.tokenPolicy) {
      errors.push('tokenPolicy is required');
    }

    // Validate price provider
    if (!config.priceProvider) {
      errors.push('priceProvider configuration is required');
    } else {
      if (!config.priceProvider.type) {
        errors.push('priceProvider.type is required');
      }
      if (!config.priceProvider.tokenId) {
        errors.push('priceProvider.tokenId is required');
      }
    }

    if (errors.length > 0) {
      throw new Error(`Configuration validation failed:\n- ${errors.join('\n- ')}`);
    }
  }

  static get config(): AppConfig {
    if (!this.instance) {
      throw new Error('Configuration not loaded. Call ConfigLoader.load() first.');
    }
    return this.instance;
  }
}


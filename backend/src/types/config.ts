export interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
}

export interface NodeConfig {
  address: string;
  pair: string;
}

export interface PriceProviderConfig {
  type: string;
  tokenId: string;
  apiKey?: string;
}

export interface AppConfig {
  database: DatabaseConfig;
  apiKeys: string[];
  adaThreshold: number;
  nodes: NodeConfig[];
  rewardAddress: string;
  tokenPolicy: string;
  priceProvider: PriceProviderConfig;
}


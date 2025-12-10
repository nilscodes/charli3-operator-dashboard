export interface NodeData {
  address: string;
  pair: string;
  currentBalance: string;
  lifetimeReceived: string;
  lifetimeSpent: string;
  isBelowThreshold: boolean;
  threshold: string;
}

export interface NodesResponse {
  nodes: NodeData[];
  adaThreshold: string;
}

export interface BalanceInfo {
  address: string;
  currentBalance: string;
  lifetimeReceived: string;
  lifetimeSpent: string;
}

export interface Transaction {
  txHash: string;
  blockTime: string;
  value: string;
  txIndex: number;
}

export interface TransactionStats {
  count: number;
  totalSpent: string;
  totalReceived: string;
}

export interface TransactionsResponse {
  address: string;
  fromDate?: string;
  toDate?: string;
  transactions: Transaction[];
  stats: TransactionStats;
}

export interface RewardBalanceResponse {
  address: string;
  policyId: string;
  balance: string;
}

export interface PriceResponse {
  tokenId: string;
  price: number;
  currency: string;
  provider: string;
  timestamp: string;
}


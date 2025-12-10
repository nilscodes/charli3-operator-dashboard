export interface BalanceResult {
  address: string;
  currentBalance: string;
  lifetimeReceived: string;
  lifetimeSpent: string;
}

export interface TokenBalanceResult {
  address: string;
  policyId: string;
  quantity: string;
}

export interface TransactionResult {
  txHash: string;
  blockTime: Date;
  value: string;
  txIndex: number;
}

export interface TransactionHistoryQuery {
  address: string;
  fromDate?: Date;
  toDate?: Date;
}


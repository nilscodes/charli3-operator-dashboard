/**
 * Convert lovelace to ADA
 */
export function lovelaceToAda(lovelace: string | number): number {
  const value = typeof lovelace === 'string' ? BigInt(lovelace) : BigInt(lovelace);
  return Number(value) / 1_000_000;
}

/**
 * Format ADA amount with comma separators
 */
export function formatAda(lovelace: string | number, decimals: number = 2): string {
  const ada = lovelaceToAda(lovelace);
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(ada);
}

/**
 * Format token amount with comma separators
 */
export function formatTokenAmount(amount: string | number, decimals: number = 0): string {
  const value = typeof amount === 'string' ? Number(amount) : amount;
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

/**
 * Format USD amount
 */
export function formatUsd(amount: number, decimals: number = 2): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(amount);
}

/**
 * Truncate address for display
 */
export function truncateAddress(address: string, prefixLength: number = 10, suffixLength: number = 8): string {
  if (address.length <= prefixLength + suffixLength) {
    return address;
  }
  return `${address.slice(0, prefixLength)}...${address.slice(-suffixLength)}`;
}

/**
 * Format date to readable string
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}


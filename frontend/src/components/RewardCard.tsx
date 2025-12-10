import {
  Card,
  CardBody,
  CardHeader,
  Heading,
  VStack,
  HStack,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Text,
  Spinner,
  Box,
} from '@chakra-ui/react';
import { useQuery } from '@/hooks/useQuery';
import { apiClient } from '@/services/api';
import { formatTokenAmount, formatUsd, truncateAddress } from '@/utils/format';

export function RewardCard() {
  const {
    data: balanceData,
    isLoading: balanceLoading,
    error: balanceError,
  } = useQuery(
    ['reward-balance'],
    () => apiClient.getRewardBalance(),
    { refetchInterval: 30000 }
  );

  const {
    data: priceData,
    isLoading: priceLoading,
    error: priceError,
  } = useQuery(
    ['token-price'],
    () => apiClient.getTokenPrice(),
    { refetchInterval: 60000 }
  );

  const isLoading = balanceLoading || priceLoading;
  const error = balanceError || priceError;

  const tokenAmount = balanceData ? Number(balanceData.balance) : 0;
  const tokenPrice = priceData?.price || 0;
  const totalValue = tokenAmount * tokenPrice;

  return (
    <Card variant="outline" size="lg">
      <CardHeader>
        <Heading size="md">Reward Address</Heading>
      </CardHeader>
      <CardBody>
        {error && (
          <Text color="red.500">Failed to load reward data</Text>
        )}
        
        {isLoading && (
          <HStack justify="center" py={6}>
            <Spinner />
          </HStack>
        )}

        {!isLoading && !error && balanceData && (
          <VStack align="stretch" spacing={4}>
            <Box>
              <Text fontSize="xs" color="gray.500" mb={1}>
                Address
              </Text>
              <Text fontSize="sm" fontFamily="mono">
                {truncateAddress(balanceData.address, 15, 10)}
              </Text>
            </Box>

            <Stat>
              <StatLabel>Token Balance</StatLabel>
              <StatNumber>{formatTokenAmount(tokenAmount)}</StatNumber>
              {priceData && (
                <StatHelpText>
                  ≈ {formatUsd(totalValue)} @ {formatUsd(tokenPrice)}/token
                </StatHelpText>
              )}
            </Stat>

            {priceData && (
              <Box pt={2} borderTopWidth={1}>
                <Text fontSize="xs" color="gray.500">
                  Price from {priceData.provider} • Updated{' '}
                  {new Date(priceData.timestamp).toLocaleTimeString()}
                </Text>
              </Box>
            )}
          </VStack>
        )}
      </CardBody>
    </Card>
  );
}


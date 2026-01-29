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
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Divider,
  useColorModeValue,
} from '@chakra-ui/react';
import { useQuery } from '@/hooks/useQuery';
import { apiClient } from '@/services/api';
import { formatTokenAmount, formatUsd } from '@/utils/format';
import { BlurredAddress } from './BlurredAddress';
import { usePrivacy } from '@/contexts/PrivacyContext';

export function RewardCard() {
  const textColor = useColorModeValue('gray.500', 'gray.400');
  const { privacyMode } = usePrivacy();
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

  const {
    data: breakdownData,
    isLoading: breakdownLoading,
    error: breakdownError,
  } = useQuery(
    ['reward-breakdown'],
    () => apiClient.getRewardBreakdown(),
    { refetchInterval: 30000 }
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
              <Text fontSize="xs" color={textColor} mb={1}>
                Address
              </Text>
              <BlurredAddress address={balanceData.address} prefixLength={15} suffixLength={10} />
            </Box>

            <Stat>
              <StatLabel>C3 Token Balance</StatLabel>
              <StatNumber>{formatTokenAmount(tokenAmount)}</StatNumber>
              {priceData && (
                <StatHelpText>
                  ≈ {formatUsd(totalValue)} @ {formatUsd(tokenPrice, 4)}/token
                </StatHelpText>
              )}
            </Stat>

            {breakdownData && breakdownData.feeds.length > 0 && (
              <Box>
                <Divider my={4} />
                <Heading size="sm" mb={3}>Rewards by Feed</Heading>
                {breakdownLoading ? (
                  <HStack justify="center" py={4}>
                    <Spinner size="sm" />
                  </HStack>
                ) : breakdownError ? (
                  <Text fontSize="sm" color="red.500">Failed to load breakdown</Text>
                ) : (
                  <Box overflowX="auto">
                    <Table size="sm" variant="simple">
                      <Thead>
                        <Tr>
                          <Th>Feed Pair</Th>
                          <Th isNumeric>C3 Earned</Th>
                          <Th isNumeric>Transactions</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {breakdownData.feeds.map((feed) => (
                          <Tr key={feed.oracleScriptAddress}>
                            <Td 
                              fontWeight="medium"
                              style={{
                                filter: privacyMode ? 'blur(6px)' : 'none',
                                transition: 'filter 0.2s',
                              }}
                            >
                              {feed.pair}
                            </Td>
                            <Td isNumeric>{formatTokenAmount(Number(feed.tokenAmountFormatted))}</Td>
                            <Td isNumeric>{feed.transactionCount}</Td>
                          </Tr>
                        ))}
                      </Tbody>
                    </Table>
                  </Box>
                )}
              </Box>
            )}

            {priceData && (
              <Box pt={2} borderTopWidth={1}>
                <Text fontSize="xs" color={textColor}>
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


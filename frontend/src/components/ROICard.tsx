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
  Divider,
  useColorModeValue,
} from '@chakra-ui/react';
import { useQuery } from '@/hooks/useQuery';
import { apiClient } from '@/services/api';
import { formatAda, formatUsd, formatTokenAmount } from '@/utils/format';

export function ROICard() {
  const textColor = useColorModeValue('gray.500', 'gray.400');
  const profitBg = useColorModeValue('green.50', 'green.900');
  const lossBg = useColorModeValue('red.50', 'red.900');
  const neutralBg = useColorModeValue('gray.50', 'gray.700');
  
  const {
    data: roiData,
    isLoading,
    error,
  } = useQuery(
    ['roi-summary'],
    () => apiClient.getROISummary(),
    { refetchInterval: 60000 }
  );

  const isProfit = roiData ? roiData.roi.netProfitUsd > 0 : false;
  const isBreakEven = roiData ? Math.abs(roiData.roi.netProfitUsd) < 0.01 : false;

  return (
    <Card variant="outline" size="lg">
      <CardHeader>
        <Heading size="md">ROI Summary</Heading>
      </CardHeader>
      <CardBody>
        {error && (
          <Text color="red.500">Failed to load ROI data</Text>
        )}
        
        {isLoading && (
          <HStack justify="center" py={6}>
            <Spinner />
          </HStack>
        )}

        {!isLoading && !error && roiData && (
          <VStack align="stretch" spacing={4}>
            <Box>
              <Text fontSize="sm" fontWeight="semibold" color={textColor} mb={2}>
                Total Operating Costs
              </Text>
              <Stat>
                <StatLabel fontSize="xs">Transaction Fees</StatLabel>
                <StatNumber fontSize="2xl">
                  {formatUsd(roiData.costs.totalFeesUsd)}
                </StatNumber>
                <StatHelpText>
                  ₳ {formatAda(roiData.costs.totalFeesLovelace, 2)} 
                  {' • '}
                  ${roiData.costs.adaPriceUsd.toFixed(4)}/ADA
                </StatHelpText>
              </Stat>
            </Box>

            <Divider />

            <Box>
              <Text fontSize="sm" fontWeight="semibold" color={textColor} mb={2}>
                Total Revenue
              </Text>
              <Stat>
                <StatLabel fontSize="xs">Reward Token Value</StatLabel>
                <StatNumber fontSize="2xl">
                  {formatUsd(roiData.revenue.totalRevenueUsd)}
                </StatNumber>
                <StatHelpText>
                  {formatTokenAmount(roiData.revenue.tokenBalance)} tokens
                  {' • '}
                  {formatUsd(roiData.revenue.tokenPriceUsd)}/token
                </StatHelpText>
              </Stat>
            </Box>

            <Divider />

            <Box
              p={4}
              borderRadius="md"
              bg={isBreakEven ? neutralBg : (isProfit ? profitBg : lossBg)}
            >
              <VStack spacing={3} align="stretch">
                <Stat>
                  <StatLabel fontSize="xs">Net Profit/Loss</StatLabel>
                  <StatNumber 
                    fontSize="2xl" 
                    color={isBreakEven ? undefined : (isProfit ? 'green.500' : 'red.500')}
                  >
                    {isProfit ? '+' : ''}{formatUsd(roiData.roi.netProfitUsd)}
                  </StatNumber>
                </Stat>

                <Stat>
                  <StatLabel fontSize="xs">Profit Margin</StatLabel>
                  <StatNumber 
                    fontSize="3xl" 
                    color={isBreakEven ? undefined : (isProfit ? 'green.500' : 'red.500')}
                  >
                    {isProfit ? '+' : ''}{roiData.roi.profitMarginPercent.toFixed(2)}%
                  </StatNumber>
                  <StatHelpText fontSize="xs">
                    {isProfit 
                      ? 'Your nodes are profitable!'
                      : isBreakEven 
                        ? 'Breaking even'
                        : 'Operating at a loss'}
                  </StatHelpText>
                </Stat>
              </VStack>
            </Box>

            <Box pt={2} borderTopWidth={1}>
              <Text fontSize="xs" color={textColor}>
                Updated{' '}
                {new Date(roiData.timestamp).toLocaleTimeString()}
              </Text>
            </Box>
          </VStack>
        )}
      </CardBody>
    </Card>
  );
}

import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  HStack,
  Button,
  Card,
  CardBody,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Spinner,
  Alert,
  AlertIcon,
  Input,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  IconButton,
  Tooltip as ChakraTooltip,
  useColorModeValue,
} from '@chakra-ui/react';
import { FiEye, FiEyeOff, FiSun, FiMoon } from 'react-icons/fi';
import { useParams, useNavigate } from 'react-router-dom';
import { useState, useMemo } from 'react';
import { useQuery } from '@/hooks/useQuery';
import { apiClient } from '@/services/api';
import { formatAda, formatDate, truncateAddress } from '@/utils/format';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format, subDays } from 'date-fns';
import { usePrivacy } from '@/contexts/PrivacyContext';
import { useTheme } from '@/hooks/useTheme';

export function NodeDetail() {
  const { address } = useParams<{ address: string }>();
  const navigate = useNavigate();
  const { privacyMode, togglePrivacy } = usePrivacy();
  const { isDark, toggleColorMode } = useTheme();
  
  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const textColor = useColorModeValue('gray.600', 'gray.400');
  const statBgBlue = useColorModeValue('blue.50', 'blue.900');
  const statBgGreen = useColorModeValue('green.50', 'green.900');
  const statBgOrange = useColorModeValue('orange.50', 'orange.900');

  const [fromDate, setFromDate] = useState<string>(
    format(subDays(new Date(), 30), 'yyyy-MM-dd')
  );
  const [toDate, setToDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));

  const { data: nodesData } = useQuery(
    ['nodes'],
    () => apiClient.getNodes()
  );

  const { data: balanceData, isLoading: balanceLoading } = useQuery(
    ['node-balance', address!],
    () => apiClient.getNodeBalance(address!),
    { enabled: !!address }
  );

  const currentNode = useMemo(() => {
    return nodesData?.nodes.find(node => node.address === address);
  }, [nodesData, address]);

  const { data: txData, isLoading: txLoading, error: txError } = useQuery(
    ['node-transactions', address!, fromDate, toDate],
    () => apiClient.getNodeTransactions(
      address!,
      new Date(fromDate),
      new Date(toDate)
    ),
    { enabled: !!address }
  );

  const chartData = useMemo(() => {
    if (!txData?.transactions) return [];

    // Group transaction fees by day and sort by timestamp for correct chart display
    const grouped = txData.transactions.reduce((acc, tx) => {
      const date = format(new Date(tx.blockTime), 'MMM dd');
      const timestamp = new Date(tx.blockTime).getTime();
      if (!acc[date]) {
        acc[date] = { date, fees: 0, timestamp };
      }
      acc[date].fees += Number(tx.value);
      return acc;
    }, {} as Record<string, { date: string; fees: number; timestamp: number }>);

    return Object.values(grouped)
      .sort((a, b) => a.timestamp - b.timestamp)
      .map(item => ({
        date: item.date,
        fees: item.fees / 1_000_000,
      }));
  }, [txData]);

  if (!address) {
    return (
      <Container maxW="container.xl" py={8}>
        <Alert status="error">
          <AlertIcon />
          No address specified
        </Alert>
      </Container>
    );
  }

  return (
    <Box minH="100vh" bg={bgColor} py={8}>
      <Container maxW="container.xl">
        <VStack align="stretch" spacing={8}>
          <HStack justify="space-between">
            <Button size="sm" onClick={() => navigate('/')}>
              ← Back to Dashboard
            </Button>
            <HStack spacing={2}>
              <ChakraTooltip label={privacyMode ? 'Show addresses & pairs' : 'Hide addresses & pairs'} fontSize="xs">
                <IconButton
                  aria-label="Toggle privacy mode"
                  icon={privacyMode ? <FiEyeOff /> : <FiEye />}
                  size="sm"
                  variant="ghost"
                  onClick={togglePrivacy}
                />
              </ChakraTooltip>
              <ChakraTooltip label={isDark ? 'Light mode' : 'Dark mode'} fontSize="xs">
                <IconButton
                  aria-label="Toggle theme"
                  icon={isDark ? <FiSun /> : <FiMoon />}
                  size="sm"
                  variant="ghost"
                  onClick={toggleColorMode}
                />
              </ChakraTooltip>
            </HStack>
          </HStack>

          <Box>
            <Heading 
              size="lg" 
              mb={2}
              style={{
                filter: privacyMode ? 'blur(10px)' : 'none',
                transition: 'filter 0.2s',
              }}
            >
              {currentNode?.pair || 'Node Details'}
            </Heading>
            <Text 
              fontSize="sm" 
              color={textColor} 
              fontFamily="mono"
              style={{
                filter: privacyMode ? 'blur(4px)' : 'none',
                transition: 'filter 0.2s',
              }}
            >
              {address}
            </Text>
            {currentNode && (
              <HStack spacing={4} mt={2} fontSize="sm" color={textColor}>
                {currentNode.startDate && (
                  <Text>
                    Active Since: <Text as="span" fontWeight="medium">{format(new Date(currentNode.startDate), 'MMM dd, yyyy')}</Text>
                  </Text>
                )}
                {currentNode.endDate && (
                  <Text>
                    Active Until: <Text as="span" fontWeight="medium">{format(new Date(currentNode.endDate), 'MMM dd, yyyy')}</Text>
                  </Text>
                )}
              </HStack>
            )}
          </Box>

          {balanceLoading && (
            <HStack justify="center" py={6}>
              <Spinner />
            </HStack>
          )}

          {balanceData && (
            <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6}>
              <Card>
                <CardBody>
                  <Stat>
                    <StatLabel>Current Balance</StatLabel>
                    <StatNumber color="green.500">
                      ₳ {formatAda(balanceData.currentBalance)}
                    </StatNumber>
                  </Stat>
                </CardBody>
              </Card>

              <Card>
                <CardBody>
                  <Stat>
                    <StatLabel>Lifetime Received</StatLabel>
                    <StatNumber>₳ {formatAda(balanceData.lifetimeReceived)}</StatNumber>
                  </Stat>
                </CardBody>
              </Card>

              <Card>
                <CardBody>
                  <Stat>
                    <StatLabel>Transaction Fees</StatLabel>
                    <StatNumber>₳ {formatAda(balanceData.lifetimeSpent)}</StatNumber>
                  </Stat>
                </CardBody>
              </Card>
            </SimpleGrid>
          )}

          <Card>
            <CardBody>
              <VStack align="stretch" spacing={4}>
                <Heading size="md">Transaction History</Heading>

                <HStack spacing={4}>
                  <Box>
                    <Text fontSize="sm" mb={1}>
                      From Date
                    </Text>
                    <Input
                      type="date"
                      value={fromDate}
                      onChange={(e) => setFromDate(e.target.value)}
                      size="sm"
                    />
                  </Box>
                  <Box>
                    <Text fontSize="sm" mb={1}>
                      To Date
                    </Text>
                    <Input
                      type="date"
                      value={toDate}
                      onChange={(e) => setToDate(e.target.value)}
                      size="sm"
                    />
                  </Box>
                </HStack>

                {txData?.stats && (
                  <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
                    <Box p={3} bg={statBgBlue} borderRadius="md">
                      <Text fontSize="xs" color={textColor}>
                        Total Transactions
                      </Text>
                      <Text fontSize="2xl" fontWeight="bold">
                        {txData.stats.count}
                      </Text>
                    </Box>
                    <Box p={3} bg={statBgGreen} borderRadius="md">
                      <Text fontSize="xs" color={textColor}>
                        Total Received
                      </Text>
                      <Text fontSize="2xl" fontWeight="bold">
                        ₳ {formatAda(txData.stats.totalReceived)}
                      </Text>
                    </Box>
                    <Box p={3} bg={statBgOrange} borderRadius="md">
                      <Text fontSize="xs" color={textColor}>
                        Total Fees
                      </Text>
                      <Text fontSize="2xl" fontWeight="bold">
                        ₳ {formatAda(txData.stats.totalSpent)}
                      </Text>
                    </Box>
                  </SimpleGrid>
                )}

                {chartData.length > 0 && (
                  <Box h="300px" mt={4}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis label={{ value: 'Fees (ADA)', angle: -90, position: 'insideLeft' }} />
                        <Tooltip />
                        <Line type="monotone" dataKey="fees" stroke="#3182ce" strokeWidth={2} name="Fees" />
                      </LineChart>
                    </ResponsiveContainer>
                  </Box>
                )}

                {txError && (
                  <Alert status="error">
                    <AlertIcon />
                    Failed to load transaction history
                  </Alert>
                )}

                {txLoading && (
                  <HStack justify="center" py={6}>
                    <Spinner />
                  </HStack>
                )}

                {txData?.transactions && txData.transactions.length > 0 && (
                  <Box overflowX="auto">
                    <Table size="sm">
                      <Thead>
                        <Tr>
                          <Th>Transaction Hash</Th>
                          <Th>Date & Time</Th>
                          <Th isNumeric>Fee (ADA)</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {txData.transactions.map((tx) => (
                          <Tr key={`${tx.txHash}-${tx.txIndex}`}>
                            <Td 
                              fontFamily="mono" 
                              fontSize="sm"
                              style={{
                                filter: privacyMode ? 'blur(4px)' : 'none',
                                transition: 'filter 0.2s',
                              }}
                            >
                              {truncateAddress(tx.txHash, 8, 8)}
                            </Td>
                            <Td fontSize="sm">{formatDate(tx.blockTime)}</Td>
                            <Td isNumeric fontWeight="semibold">
                              ₳ {formatAda(tx.value)}
                            </Td>
                          </Tr>
                        ))}
                      </Tbody>
                    </Table>
                  </Box>
                )}

                {txData?.transactions && txData.transactions.length === 0 && (
                  <Text color="gray.500" textAlign="center" py={6}>
                    No transactions found for the selected date range
                  </Text>
                )}
              </VStack>
            </CardBody>
          </Card>
        </VStack>
      </Container>
    </Box>
  );
}

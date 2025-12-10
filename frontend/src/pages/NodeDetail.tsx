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
} from '@chakra-ui/react';
import { useParams, useNavigate } from 'react-router-dom';
import { useState, useMemo } from 'react';
import { useQuery } from '@/hooks/useQuery';
import { apiClient } from '@/services/api';
import { formatAda, formatDate, truncateAddress } from '@/utils/format';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format, subDays } from 'date-fns';

export function NodeDetail() {
  const { address } = useParams<{ address: string }>();
  const navigate = useNavigate();
  
  const [fromDate, setFromDate] = useState<string>(
    format(subDays(new Date(), 30), 'yyyy-MM-dd')
  );
  const [toDate, setToDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));

  const { data: balanceData, isLoading: balanceLoading } = useQuery(
    ['node-balance', address!],
    () => apiClient.getNodeBalance(address!),
    { enabled: !!address }
  );

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

    // Group transactions by day
    const grouped = txData.transactions.reduce((acc, tx) => {
      const date = format(new Date(tx.blockTime), 'MMM dd');
      if (!acc[date]) {
        acc[date] = { date, value: 0 };
      }
      acc[date].value += Number(tx.value);
      return acc;
    }, {} as Record<string, { date: string; value: number }>);

    return Object.values(grouped).map(item => ({
      date: item.date,
      ada: item.value / 1_000_000,
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
    <Box minH="100vh" bg="gray.50" py={8}>
      <Container maxW="container.xl">
        <VStack align="stretch" spacing={8}>
          <HStack>
            <Button size="sm" onClick={() => navigate('/')}>
              ← Back to Dashboard
            </Button>
          </HStack>

          <Box>
            <Heading size="lg" mb={2}>
              Node Details
            </Heading>
            <Text fontSize="sm" color="gray.600" fontFamily="mono">
              {address}
            </Text>
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
                    <StatLabel>Lifetime Spent</StatLabel>
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
                    <Box p={3} bg="blue.50" borderRadius="md">
                      <Text fontSize="xs" color="gray.600">
                        Total Transactions
                      </Text>
                      <Text fontSize="2xl" fontWeight="bold">
                        {txData.stats.count}
                      </Text>
                    </Box>
                    <Box p={3} bg="green.50" borderRadius="md">
                      <Text fontSize="xs" color="gray.600">
                        Total Received
                      </Text>
                      <Text fontSize="2xl" fontWeight="bold">
                        ₳ {formatAda(txData.stats.totalReceived)}
                      </Text>
                    </Box>
                    <Box p={3} bg="orange.50" borderRadius="md">
                      <Text fontSize="xs" color="gray.600">
                        Total Spent
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
                        <YAxis />
                        <Tooltip />
                        <Line type="monotone" dataKey="ada" stroke="#3182ce" strokeWidth={2} />
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
                          <Th isNumeric>Amount (ADA)</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {txData.transactions.map((tx) => (
                          <Tr key={`${tx.txHash}-${tx.txIndex}`}>
                            <Td fontFamily="mono" fontSize="sm">
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


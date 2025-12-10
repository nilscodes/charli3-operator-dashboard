import {
  Box,
  Container,
  Heading,
  SimpleGrid,
  Text,
  VStack,
  HStack,
  Button,
  Spinner,
  Alert,
  AlertIcon,
} from '@chakra-ui/react';
import { NodeCard } from '@/components/NodeCard';
import { RewardCard } from '@/components/RewardCard';
import { useQuery } from '@/hooks/useQuery';
import { apiClient } from '@/services/api';

export function Dashboard() {
  const { data, isLoading, error, refetch } = useQuery(
    ['nodes'],
    () => apiClient.getNodes(),
    { refetchInterval: 30000 }
  );

  return (
    <Box minH="100vh" bg="gray.50" py={8}>
      <Container maxW="container.xl">
        <VStack align="stretch" spacing={8}>
          <HStack justify="space-between" align="center">
            <Box>
              <Heading size="lg" mb={2}>
                Charli3 Oracle Dashboard
              </Heading>
              <Text color="gray.600">Monitor your oracle node addresses and balances</Text>
            </Box>
            <Button size="sm" onClick={refetch} isLoading={isLoading}>
              Refresh
            </Button>
          </HStack>

          {error && (
            <Alert status="error">
              <AlertIcon />
              Failed to load dashboard data. Please try again.
            </Alert>
          )}

          {isLoading && !data && (
            <HStack justify="center" py={12}>
              <Spinner size="xl" />
            </HStack>
          )}

          {data && (
            <>
              <Box>
                <Heading size="md" mb={4}>
                  Oracle Nodes
                </Heading>
                <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
                  {data.nodes.map((node) => (
                    <NodeCard key={node.address} node={node} />
                  ))}
                </SimpleGrid>
              </Box>

              <Box>
                <Heading size="md" mb={4}>
                  Rewards
                </Heading>
                <Box maxW="md">
                  <RewardCard />
                </Box>
              </Box>
            </>
          )}
        </VStack>
      </Container>
    </Box>
  );
}


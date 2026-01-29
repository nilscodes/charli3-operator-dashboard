import {
  Box,
  Container,
  Heading,
  SimpleGrid,
  Text,
  VStack,
  HStack,
  Button,
  IconButton,
  Spinner,
  Alert,
  AlertIcon,
  Tooltip,
  useColorModeValue,
} from '@chakra-ui/react';
import { FiEye, FiEyeOff, FiSun, FiMoon } from 'react-icons/fi';
import { NodeCard } from '@/components/NodeCard';
import { RewardCard } from '@/components/RewardCard';
import { ROICard } from '@/components/ROICard';
import { useQuery } from '@/hooks/useQuery';
import { apiClient } from '@/services/api';
import { usePrivacy } from '@/contexts/PrivacyContext';
import { useTheme } from '@/hooks/useTheme';

export function Dashboard() {
  const { data, isLoading, error, refetch } = useQuery(
    ['nodes'],
    () => apiClient.getNodes(),
    { refetchInterval: 600000 }
  );

  const { privacyMode, togglePrivacy } = usePrivacy();
  const { isDark, toggleColorMode } = useTheme();

  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const textColor = useColorModeValue('gray.600', 'gray.400');

  return (
    <Box minH="100vh" bg={bgColor} py={8}>
      <Container maxW="container.xl">
        <VStack align="stretch" spacing={8}>
          <HStack justify="space-between" align="center">
            <Box>
              <Heading size="lg" mb={2}>
                Charli3 Oracle Dashboard
              </Heading>
              <Text color={textColor}>Monitor your oracle node addresses and balances</Text>
            </Box>
            <HStack spacing={2}>
              <Tooltip label={privacyMode ? 'Show addresses & pairs' : 'Hide addresses & pairs'} fontSize="xs">
                <IconButton
                  aria-label="Toggle privacy mode"
                  icon={privacyMode ? <FiEyeOff /> : <FiEye />}
                  size="sm"
                  variant="ghost"
                  onClick={togglePrivacy}
                />
              </Tooltip>
              <Tooltip label={isDark ? 'Light mode' : 'Dark mode'} fontSize="xs">
                <IconButton
                  aria-label="Toggle theme"
                  icon={isDark ? <FiSun /> : <FiMoon />}
                  size="sm"
                  variant="ghost"
                  onClick={toggleColorMode}
                />
              </Tooltip>
              <Button size="sm" onClick={refetch} isLoading={isLoading}>
                Refresh
              </Button>
            </HStack>
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
                  Rewards & ROI
                </Heading>
                <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
                  <RewardCard />
                  <ROICard />
                </SimpleGrid>
              </Box>
            </>
          )}
        </VStack>
      </Container>
    </Box>
  );
}


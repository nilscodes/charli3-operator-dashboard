import {
  Box,
  Card,
  CardBody,
  Heading,
  Text,
  VStack,
  HStack,
  Badge,
  Button,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Alert,
  AlertIcon,
} from '@chakra-ui/react';
import { NodeData } from '@/types/api';
import { formatAda, truncateAddress } from '@/utils/format';
import { useNavigate } from 'react-router-dom';

interface NodeCardProps {
  node: NodeData;
}

export function NodeCard({ node }: NodeCardProps) {
  const navigate = useNavigate();

  const handleViewDetails = () => {
    navigate(`/node/${node.address}`);
  };

  return (
    <Card variant="outline" size="lg">
      <CardBody>
        <VStack align="stretch" spacing={4}>
          <HStack justify="space-between" align="start">
            <Box>
              <Heading size="sm" mb={1}>
                {truncateAddress(node.address)}
              </Heading>
              <Text fontSize="xs" color="gray.500" fontFamily="mono">
                {node.address}
              </Text>
            </Box>
          </HStack>

          {node.isBelowThreshold && (
            <Alert status="warning" borderRadius="md">
              <AlertIcon />
              Balance below threshold
            </Alert>
          )}

          <Box>
            <Badge colorScheme="blue">{node.pair}</Badge>
          </Box>

          <VStack align="stretch" spacing={3}>
            <Stat>
              <StatLabel>Current Balance</StatLabel>
              <StatNumber color={node.isBelowThreshold ? 'orange.500' : 'green.500'}>
                ₳ {formatAda(node.currentBalance)}
              </StatNumber>
              <StatHelpText>
                Threshold: ₳ {formatAda(node.threshold)}
              </StatHelpText>
            </Stat>

            <HStack spacing={4}>
              <Box flex={1}>
                <Text fontSize="xs" color="gray.500">
                  Lifetime Received
                </Text>
                <Text fontWeight="semibold">₳ {formatAda(node.lifetimeReceived)}</Text>
              </Box>
              <Box flex={1}>
                <Text fontSize="xs" color="gray.500">
                  Lifetime Spent
                </Text>
                <Text fontWeight="semibold">₳ {formatAda(node.lifetimeSpent)}</Text>
              </Box>
            </HStack>
          </VStack>

          <Button size="sm" colorScheme="blue" onClick={handleViewDetails}>
            View Details
          </Button>
        </VStack>
      </CardBody>
    </Card>
  );
}


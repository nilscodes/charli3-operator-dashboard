import {
  Box,
  Card,
  CardBody,
  Heading,
  Text,
  VStack,
  HStack,
  Button,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Alert,
  AlertIcon,
  Badge,
  Divider,
  useColorModeValue,
} from '@chakra-ui/react';
import { NodeData } from '@/types/api';
import { formatAda, formatTokenAmount } from '@/utils/format';
import { useNavigate } from 'react-router-dom';
import { BlurredAddress } from './BlurredAddress';
import { usePrivacy } from '@/contexts/PrivacyContext';

interface NodeCardProps {
  node: NodeData;
}

export function NodeCard({ node }: NodeCardProps) {
  const navigate = useNavigate();
  const { privacyMode } = usePrivacy();
  const textColor = useColorModeValue('gray.500', 'gray.400');

  const handleViewDetails = () => {
    navigate(`/node/${node.address}`);
  };

  return (
    <Card variant="outline" size="lg">
      <CardBody>
        <VStack align="stretch" spacing={4}>
          <Box>
            <Heading 
              size="md" 
              mb={2}
              style={{
                filter: privacyMode ? 'blur(8px)' : 'none',
                transition: 'filter 0.2s',
              }}
            >
              {node.pair}
            </Heading>
            <BlurredAddress address={node.address} />
          </Box>

          {node.isBelowThreshold && (
            <Alert status="warning" borderRadius="md">
              <AlertIcon />
              Balance below threshold
            </Alert>
          )}

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

            <Divider />

            <Box>
              <Text fontSize="sm" fontWeight="semibold" color={textColor} mb={3}>
                Rewards & ROI
              </Text>
              
              <VStack spacing={3} align="stretch">
                <Box>
                  <HStack justify="space-between" mb={1}>
                    <Text fontSize="xs" color={textColor}>
                      Actual
                    </Text>
                    <Badge 
                      colorScheme={node.roiPercent >= 0 ? 'green' : 'red'}
                      fontSize="xs"
                      px={2}
                      py={0.5}
                    >
                      {node.roiPercent >= 0 ? '+' : ''}{node.roiPercent.toFixed(2)}% ROI
                    </Badge>
                  </HStack>
                  <HStack spacing={4}>
                    <Box flex={1}>
                      <Text fontSize="xs" color={textColor}>
                        C3 Earned
                      </Text>
                      <Text fontWeight="semibold" fontSize="sm">{formatTokenAmount(Number(node.rewardTokensEarned))}</Text>
                    </Box>
                    <Box flex={1}>
                      <Text fontSize="xs" color={textColor}>
                        Value
                      </Text>
                      <Text fontWeight="semibold" fontSize="sm">₳ {formatAda((Number(node.rewardValueAda) * 1_000_000).toString())}</Text>
                    </Box>
                  </HStack>
                </Box>

                {node.estimatedRoiPercent !== 0 && Number(node.estimatedRewardTokens) !== Number(node.rewardTokensEarned) && (
                  <Box>
                    <HStack justify="space-between" mb={1}>
                      <Text fontSize="xs" color={textColor}>
                        Estimated (incl. unpaid)
                      </Text>
                      <Badge 
                        colorScheme={node.estimatedRoiPercent >= 0 ? 'blue' : 'orange'}
                        fontSize="xs"
                        px={2}
                        py={0.5}
                        variant="subtle"
                      >
                        {node.estimatedRoiPercent >= 0 ? '+' : ''}{node.estimatedRoiPercent.toFixed(2)}% ROI
                      </Badge>
                    </HStack>
                    <HStack spacing={4}>
                      <Box flex={1}>
                        <Text fontSize="xs" color={textColor}>
                          Total C3
                        </Text>
                        <Text fontWeight="semibold" fontSize="sm" color="blue.500">
                          {formatTokenAmount(Number(node.estimatedRewardTokens))}
                        </Text>
                      </Box>
                      <Box flex={1}>
                        <Text fontSize="xs" color={textColor}>
                          Unpaid
                        </Text>
                        <Text fontWeight="semibold" fontSize="sm" color="blue.500">
                          +{formatTokenAmount(Number(node.estimatedRewardTokens) - Number(node.rewardTokensEarned))}
                        </Text>
                      </Box>
                    </HStack>
                  </Box>
                )}
              </VStack>
            </Box>

            <Divider />

            <HStack spacing={4}>
              <Box flex={1}>
                <Text fontSize="xs" color={textColor}>
                  Lifetime Received
                </Text>
                <Text fontWeight="semibold">₳ {formatAda(node.lifetimeReceived)}</Text>
              </Box>
              <Box flex={1}>
                <Text fontSize="xs" color={textColor}>
                  Transaction Fees
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

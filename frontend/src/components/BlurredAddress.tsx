import {
  HStack,
  Text,
  IconButton,
  useToast,
  Tooltip,
} from '@chakra-ui/react';
import { FiCopy } from 'react-icons/fi';
import { usePrivacy } from '@/contexts/PrivacyContext';
import { truncateAddress } from '@/utils/format';

interface BlurredAddressProps {
  address: string;
  prefixLength?: number;
  suffixLength?: number;
}

export function BlurredAddress({
  address,
  prefixLength = 10,
  suffixLength = 8,
}: BlurredAddressProps) {
  const { privacyMode } = usePrivacy();
  const toast = useToast();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(address);
      toast({
        title: 'Address copied',
        status: 'success',
        duration: 2000,
        isClosable: true,
      });
    } catch (err) {
      toast({
        title: 'Failed to copy',
        status: 'error',
        duration: 2000,
        isClosable: true,
      });
    }
  };

  const truncated = truncateAddress(address, prefixLength, suffixLength);
  
  // Extract the "addr1" prefix (first 5 characters) to always show unblurred
  const prefix = truncated.substring(0, 5);
  const rest = truncated.substring(5);

  return (
    <HStack spacing={2}>
      <HStack spacing={0} fontFamily="mono" fontSize="sm">
        <Text>{prefix}</Text>
        <Text
          style={{
            filter: privacyMode ? 'blur(4px)' : 'none',
            transition: 'filter 0.2s',
          }}
        >
          {rest}
        </Text>
      </HStack>
      <Tooltip label="Copy full address" fontSize="xs">
        <IconButton
          aria-label="Copy address"
          icon={<FiCopy />}
          size="xs"
          variant="ghost"
          onClick={handleCopy}
        />
      </Tooltip>
    </HStack>
  );
}

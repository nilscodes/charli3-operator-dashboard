import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Input,
  FormControl,
  FormLabel,
  FormErrorMessage,
  Text,
  VStack,
} from '@chakra-ui/react';
import { useState } from 'react';
import { apiClient } from '@/services/api';

interface ApiKeyModalProps {
  isOpen: boolean;
  onSuccess: () => void;
}

export function ApiKeyModal({ isOpen, onSuccess }: ApiKeyModalProps) {
  const [apiKey, setApiKey] = useState('');
  const [error, setError] = useState('');
  const [isValidating, setIsValidating] = useState(false);

  const handleSubmit = async () => {
    if (!apiKey.trim()) {
      setError('API key is required');
      return;
    }

    setIsValidating(true);
    setError('');

    try {
      // Store the API key
      apiClient.setApiKey(apiKey);

      // Test the API key by making a request
      await apiClient.getNodes();

      // If successful, call onSuccess
      onSuccess();
    } catch (err) {
      // Clear the invalid API key
      apiClient.clearApiKey();
      setError('Invalid API key. Please try again.');
    } finally {
      setIsValidating(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={() => {}} closeOnOverlayClick={false} closeOnEsc={false}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Authentication Required</ModalHeader>
        <ModalBody>
          <VStack spacing={4} align="stretch">
            <Text fontSize="sm" color="gray.600">
              Please enter your API key to access the Charli3 Dashboard.
            </Text>
            <FormControl isInvalid={!!error}>
              <FormLabel>API Key</FormLabel>
              <Input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Enter your API key"
                autoFocus
              />
              {error && <FormErrorMessage>{error}</FormErrorMessage>}
            </FormControl>
          </VStack>
        </ModalBody>
        <ModalFooter>
          <Button
            colorScheme="blue"
            onClick={handleSubmit}
            isLoading={isValidating}
            loadingText="Validating..."
          >
            Submit
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}


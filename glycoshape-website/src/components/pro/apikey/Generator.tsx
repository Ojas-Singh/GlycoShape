import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import {
  VStack,
  HStack,
  FormControl,
  FormLabel,
  FormErrorMessage,
  Input,
  Select,
  Checkbox,
  CheckboxGroup,
  Button,
  Text,
  Box,
  Alert,
  AlertIcon,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  useToast
} from '@chakra-ui/react';
import { useAuthenticatedFetch } from '../hooks/useAuthenticatedFetch';
import { getApiUrl, API_CONFIG } from '../config/api';

interface GeneratorFormData {
  key_name: string;
  pricing_tier: string;
  rate_limit_per_minute: number;
  allowed_endpoints: string[];
  initial_credits?: number;
}

interface APIKeyGeneratorProps {
  onSuccess: () => void;
}

const availableEndpoints = [
  'glycan-search',
  'conformational-analysis',
  'molecular-dynamics',
  'structure-prediction',
  'binding-affinity',
  'all-endpoints'
];

const APIKeyGenerator: React.FC<APIKeyGeneratorProps> = ({ onSuccess }) => {
  const authenticatedFetch = useAuthenticatedFetch();
  const [loading, setLoading] = useState(false);
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [selectedEndpoints, setSelectedEndpoints] = useState<string[]>([]);
  const toast = useToast();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    setValue
  } = useForm<GeneratorFormData>({
    defaultValues: {
      pricing_tier: 'free',
      rate_limit_per_minute: 10,
      allowed_endpoints: []
    }
  });

  const pricingTier = watch('pricing_tier');

  const onSubmit = async (data: GeneratorFormData) => {
    setLoading(true);
    
    try {
      const keyData = {
        ...data,
        allowed_endpoints: selectedEndpoints.includes('all-endpoints') ? 
          availableEndpoints.filter(e => e !== 'all-endpoints') : 
          selectedEndpoints
      };

      const response = await authenticatedFetch(getApiUrl(API_CONFIG.ENDPOINTS.API_KEYS.GENERATE), {
        method: 'POST',
        body: JSON.stringify(keyData)
      });

      if (response.ok) {
        const result = await response.json();
        setGeneratedKey(result.api_key_data.api_key);
        
        toast({
          title: 'API Key Generated',
          description: 'Your API key has been generated successfully. Make sure to copy it now!',
          status: 'success',
          duration: 10000,
          isClosable: true
        });
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to generate API key');
      }
    } catch (error: any) {
      toast({
        title: 'Generation failed',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true
      });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast({
        title: 'Copied to clipboard',
        description: 'API key has been copied to your clipboard.',
        status: 'success',
        duration: 3000,
        isClosable: true
      });
    });
  };

  const handleComplete = () => {
    setGeneratedKey(null);
    onSuccess();
  };

  if (generatedKey) {
    return (
      <VStack spacing={6}>
        <Alert status="success">
          <AlertIcon />
          <VStack align="start" spacing={1}>
            <Text fontWeight="bold">API Key Generated Successfully!</Text>
            <Text fontSize="sm">
              Make sure to copy this key now. For security reasons, it won't be shown again.
            </Text>
          </VStack>
        </Alert>

        <Box p={4} bg="gray.50" borderRadius="md" w="full">
          <Text fontSize="sm" color="gray.600" mb={2}>Your API Key:</Text>
          <HStack>
            <Input
              value={generatedKey}
              isReadOnly
              bg="white"
              fontFamily="mono"
              fontSize="sm"
            />
            <Button onClick={() => copyToClipboard(generatedKey)}>
              Copy
            </Button>
          </HStack>
        </Box>

        <Alert status="warning">
          <AlertIcon />
          <Text fontSize="sm">
            Store this key securely. You won't be able to see it again once you close this dialog.
          </Text>
        </Alert>

        <Button colorScheme="blue" onClick={handleComplete}>
          Done
        </Button>
      </VStack>
    );
  }

  return (
    <Box as="form" onSubmit={handleSubmit(onSubmit)}>
      <VStack spacing={6}>
        <FormControl isInvalid={!!errors.key_name}>
          <FormLabel>Key Name</FormLabel>
          <Input
            {...register('key_name')}
            placeholder="e.g., My Research Project API Key"
          />
          <FormErrorMessage>
            {errors.key_name?.message}
          </FormErrorMessage>
        </FormControl>

        <FormControl isInvalid={!!errors.pricing_tier}>
          <FormLabel>Pricing Tier</FormLabel>
          <Select {...register('pricing_tier')}>
            <option value="free">Free (Limited)</option>
            <option value="pay_per_use">Pay Per Use</option>
            <option value="unlimited">Unlimited (Subscription Required)</option>
          </Select>
          <FormErrorMessage>
            {errors.pricing_tier?.message}
          </FormErrorMessage>
        </FormControl>

        {pricingTier === 'pay_per_use' && (
          <FormControl isInvalid={!!errors.initial_credits}>
            <FormLabel>Initial Credits</FormLabel>
            <NumberInput min={1} max={10000}>
              <NumberInputField 
                {...register('initial_credits', { valueAsNumber: true })}
                placeholder="Enter initial credits"
              />
              <NumberInputStepper>
                <NumberIncrementStepper />
                <NumberDecrementStepper />
              </NumberInputStepper>
            </NumberInput>
            <FormErrorMessage>
              {errors.initial_credits?.message}
            </FormErrorMessage>
            <Text fontSize="sm" color="gray.600" mt={1}>
              Each credit allows one API request. You can add more credits later.
            </Text>
          </FormControl>
        )}

        <FormControl isInvalid={!!errors.rate_limit_per_minute}>
          <FormLabel>Rate Limit (requests per minute)</FormLabel>
          <NumberInput min={1} max={1000}>
            <NumberInputField 
              {...register('rate_limit_per_minute', { valueAsNumber: true })}
            />
            <NumberInputStepper>
              <NumberIncrementStepper />
              <NumberDecrementStepper />
            </NumberInputStepper>
          </NumberInput>
          <FormErrorMessage>
            {errors.rate_limit_per_minute?.message}
          </FormErrorMessage>
        </FormControl>

        <FormControl>
          <FormLabel>Allowed Endpoints</FormLabel>
          <CheckboxGroup
            value={selectedEndpoints}
            onChange={(values) => {
              setSelectedEndpoints(values as string[]);
              setValue('allowed_endpoints', values as string[]);
            }}
          >
            <VStack align="start" spacing={2}>
              {availableEndpoints.map((endpoint) => (
                <Checkbox key={endpoint} value={endpoint}>
                  {endpoint.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </Checkbox>
              ))}
            </VStack>
          </CheckboxGroup>
          {selectedEndpoints.length === 0 && (
            <Text fontSize="sm" color="red.500" mt={1}>
              Please select at least one endpoint
            </Text>
          )}
        </FormControl>

        <Alert status="info">
          <AlertIcon />
          <VStack align="start" spacing={1}>
            <Text fontSize="sm">
              <strong>Pricing Information:</strong>
            </Text>
            <Text fontSize="sm">
              • Free: 100 requests/month, basic endpoints only<br/>
              • Pay Per Use: $0.01 per request, all endpoints<br/>
              • Unlimited: All features, requires active subscription
            </Text>
          </VStack>
        </Alert>

        <HStack w="full" justify="flex-end">
          <Button
            type="submit"
            colorScheme="blue"
            isLoading={loading}
            loadingText="Generating..."
            isDisabled={selectedEndpoints.length === 0}
          >
            Generate API Key
          </Button>
        </HStack>
      </VStack>
    </Box>
  );
};

export default APIKeyGenerator;

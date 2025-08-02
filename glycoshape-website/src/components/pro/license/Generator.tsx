import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import {
  VStack,
  HStack,
  FormControl,
  FormLabel,
  FormErrorMessage,
  Select,
  CheckboxGroup,
  Checkbox,
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
  useToast,
  Code,
  Input
} from '@chakra-ui/react';
import { useAuthenticatedFetch } from '../hooks/useAuthenticatedFetch';
import { getApiUrl, API_CONFIG } from '../config/api';

const schema = yup.object({
  license_type: yup.string().required('License type is required'),
  max_activations: yup.number().min(1).max(100).required('Max activations is required'),
  tools: yup.array().min(1, 'At least one tool must be selected').required()
});

interface GeneratorFormData {
  license_type: string;
  max_activations: number;
  tools: string[];
}

interface LicenseGeneratorProps {
  onSuccess: () => void;
}

const availableTools = [
  'GlycoShape-Desktop',
  'GlycoShape-CLI',
  'Structure-Predictor',
  'Conformational-Analyzer',
  'MD-Simulator',
  'Binding-Affinity-Calculator'
];

const LicenseGenerator: React.FC<LicenseGeneratorProps> = ({ onSuccess }) => {
  const authenticatedFetch = useAuthenticatedFetch();
  const [loading, setLoading] = useState(false);
  const [generatedLicense, setGeneratedLicense] = useState<string | null>(null);
  const [selectedTools, setSelectedTools] = useState<string[]>([]);
  const toast = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue
  } = useForm<GeneratorFormData>({
    resolver: yupResolver(schema),
    defaultValues: {
      license_type: 'academic_perpetual',
      max_activations: 1,
      tools: []
    }
  });

  const onSubmit = async (data: GeneratorFormData) => {
    setLoading(true);
    
    try {
      const licenseData = {
        ...data,
        tools: selectedTools
      };

      const response = await authenticatedFetch(getApiUrl(API_CONFIG.ENDPOINTS.LICENSES.GENERATE), {
        method: 'POST',
        body: JSON.stringify(licenseData)
      });

      if (response.ok) {
        const result = await response.json();
        setGeneratedLicense(result.license_key);
        
        toast({
          title: 'License Generated',
          description: 'Your software license has been generated successfully!',
          status: 'success',
          duration: 10000,
          isClosable: true
        });
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to generate license');
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
        description: 'License key has been copied to your clipboard.',
        status: 'success',
        duration: 3000,
        isClosable: true
      });
    });
  };

  const handleComplete = () => {
    setGeneratedLicense(null);
    onSuccess();
  };

  if (generatedLicense) {
    return (
      <VStack spacing={6}>
        <Alert status="success">
          <AlertIcon />
          <VStack align="start" spacing={1}>
            <Text fontWeight="bold">License Generated Successfully!</Text>
            <Text fontSize="sm">
              Your software license is ready to use. Copy the license key and use it to activate your software.
            </Text>
          </VStack>
        </Alert>

        <Box p={4} bg="gray.50" borderRadius="md" w="full">
          <Text fontSize="sm" color="gray.600" mb={2}>Your License Key:</Text>
          <HStack>
            <Input
              value={generatedLicense}
              isReadOnly
              bg="white"
              fontFamily="mono"
              fontSize="sm"
            />
            <Button onClick={() => copyToClipboard(generatedLicense)}>
              Copy
            </Button>
          </HStack>
        </Box>

        <Alert status="info">
          <AlertIcon />
          <VStack align="start" spacing={1}>
            <Text fontSize="sm" fontWeight="bold">Installation Instructions:</Text>
            <Text fontSize="sm">
              1. Download the software from your account dashboard<br/>
              2. Install the software on your machine<br/>
              3. Enter this license key when prompted<br/>
              4. The software will activate automatically
            </Text>
          </VStack>
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
        <FormControl isInvalid={!!errors.license_type}>
          <FormLabel>License Type</FormLabel>
          <Select {...register('license_type')}>
            <option value="academic_perpetual">Academic Perpetual</option>
            <option value="industry_onsite">Industry On-Site</option>
          </Select>
          <FormErrorMessage>
            {errors.license_type?.message}
          </FormErrorMessage>
          <Text fontSize="sm" color="gray.600" mt={1}>
            Academic licenses are free for educational institutions. 
            Industry licenses require an active subscription.
          </Text>
        </FormControl>

        <FormControl isInvalid={!!errors.max_activations}>
          <FormLabel>Maximum Activations</FormLabel>
          <NumberInput min={1} max={100}>
            <NumberInputField 
              {...register('max_activations', { valueAsNumber: true })}
            />
            <NumberInputStepper>
              <NumberIncrementStepper />
              <NumberDecrementStepper />
            </NumberInputStepper>
          </NumberInput>
          <FormErrorMessage>
            {errors.max_activations?.message}
          </FormErrorMessage>
          <Text fontSize="sm" color="gray.600" mt={1}>
            Number of machines that can use this license simultaneously.
          </Text>
        </FormControl>

        <FormControl isInvalid={!!errors.tools}>
          <FormLabel>Licensed Tools</FormLabel>
          <CheckboxGroup
            value={selectedTools}
            onChange={(values) => {
              setSelectedTools(values as string[]);
              setValue('tools', values as string[]);
            }}
          >
            <VStack align="start" spacing={3}>
              {availableTools.map((tool) => (
                <Checkbox key={tool} value={tool}>
                  <VStack align="start" spacing={0}>
                    <Text>{tool}</Text>
                    <Text fontSize="xs" color="gray.600">
                      {getToolDescription(tool)}
                    </Text>
                  </VStack>
                </Checkbox>
              ))}
            </VStack>
          </CheckboxGroup>
          <FormErrorMessage>
            {errors.tools?.message}
          </FormErrorMessage>
        </FormControl>

        <Alert status="warning">
          <AlertIcon />
          <VStack align="start" spacing={1}>
            <Text fontSize="sm">
              <strong>Important:</strong>
            </Text>
            <Text fontSize="sm">
              • Academic licenses are limited to educational use only<br/>
              • Commercial use requires an Industry license<br/>
              • Each license can be activated on the specified number of machines<br/>
              • Licenses can be revoked but not transferred
            </Text>
          </VStack>
        </Alert>

        <HStack w="full" justify="flex-end">
          <Button
            type="submit"
            colorScheme="blue"
            isLoading={loading}
            loadingText="Generating..."
            isDisabled={selectedTools.length === 0}
          >
            Generate License
          </Button>
        </HStack>
      </VStack>
    </Box>
  );
};

const getToolDescription = (tool: string): string => {
  const descriptions: Record<string, string> = {
    'GlycoShape-Desktop': 'Full desktop application with GUI',
    'GlycoShape-CLI': 'Command-line interface for automation',
    'Structure-Predictor': 'Glycan structure prediction module',
    'Conformational-Analyzer': 'Conformational analysis tools',
    'MD-Simulator': 'Molecular dynamics simulation engine',
    'Binding-Affinity-Calculator': 'Protein-glycan binding affinity calculator'
  };
  return descriptions[tool] || '';
};

export default LicenseGenerator;

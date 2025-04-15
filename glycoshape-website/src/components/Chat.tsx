// App.tsx - Main application component
import React, { useState, useRef, useEffect } from 'react';
import {
  Box, 
  Flex, 
  Input, 
  Button, 
  Text, 
  useColorMode,
  useColorModeValue,
  IconButton,
  Heading,
  Spinner,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  FormControl,
  FormLabel,
  VStack,
  HStack,
  ChakraProvider,
  extendTheme,
  useToast
} from '@chakra-ui/react';
import { MoonIcon, SunIcon, AttachmentIcon, SettingsIcon } from '@chakra-ui/icons';
import MolstarViewer from './MolstarViewer';

// Define types
interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  attachment?: string | null;
}

interface FileAttachment {
  name: string;
  content: string | ArrayBuffer | null;
  type: string;
}

// Claude Chat Component
const ClaudeChat: React.FC<{ 
  apiKey: string;
  onLoadProtein: (pdbId: string) => void;
}> = ({ apiKey, onLoadProtein }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [fileAttachment, setFileAttachment] = useState<FileAttachment | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const toast = useToast();

  // Move all color mode values to the top level of the component
  const userMessageBg = useColorModeValue('blue.100', 'blue.700');
  const systemMessageBg = useColorModeValue('gray.200', 'gray.600');
  const assistantMessageBg = useColorModeValue('gray.100', 'gray.700');
  const chatBg = useColorModeValue('gray.50', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  // Scroll to bottom of chat when messages change
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  // Initialize with a system message
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([{
        role: 'system',
        content: "Welcome! I can help you analyze proteins. You can ask me to load a protein by saying 'fetch [PDB ID]' (e.g., 'fetch 1ccn').",
        timestamp: new Date().toISOString()
      }]);
    }
  }, []);

  // Check for protein load commands in the user input
  const checkForProteinCommand = (text: string): boolean => {
    const fetchMatch = text.match(/fetch\s+(\w+)/i);
    if (fetchMatch && fetchMatch[1]) {
      const pdbId = fetchMatch[1];
      onLoadProtein(pdbId);
      return true;
    }
    return false;
  };

  const handleSendMessage = async () => {
    if (!input.trim() && !fileAttachment) return;
    
    const userMessage: ChatMessage = {
      role: 'user',
      content: input,
      timestamp: new Date().toISOString(),
      attachment: fileAttachment ? fileAttachment.name : null
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    // Check for protein load command
    const isProteinCommand = checkForProteinCommand(input);
    
    // If it's a protein command, add a system message and don't call Claude API
    if (isProteinCommand) {
      const pdbId = input.match(/fetch\s+(\w+)/i)?.[1] || '';
      setMessages(prev => [...prev, {
        role: 'system',
        content: `Loading protein ${pdbId}...`,
        timestamp: new Date().toISOString()
      }]);
      setIsLoading(false);
      setFileAttachment(null);
      return;
    }
    
    try {
      // Real Claude API call
      const response = await callClaudeAPI(input, fileAttachment, apiKey);
      
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: response,
        timestamp: new Date().toISOString()
      }]);
    } catch (error) {
      console.error('Error sending message to Claude:', error);
      toast({
        title: "API Error",
        description: "Could not connect to Claude API. Please check your API key.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      
      setMessages(prev => [...prev, {
        role: 'system',
        content: 'Error communicating with Claude API. Please check your API key and try again.',
        timestamp: new Date().toISOString()
      }]);
    } finally {
      setIsLoading(false);
      setFileAttachment(null);
    }
  };

  // Actual Claude API call implementation
  const callClaudeAPI = async (
    message: string, 
    file: FileAttachment | null, 
    key: string
  ): Promise<string> => {
    if (!key) {
      throw new Error('No API key provided');
    }

    // Create conversation history from previous messages
    const conversationHistory = messages
      .filter(msg => msg.role !== 'system')
      .map(msg => ({ role: msg.role, content: msg.content }));

    // Prepare content for the message
    let messageContent: Array<any> = [{ type: "text", text: message }];
    
    // Add file attachment if present
    if (file && file.content && typeof file.content === 'string') {
      // Handle file attachment based on type
      if (file.type.startsWith('image/')) {
        messageContent.push({
          type: "image",
          source: {
            type: "base64",
            media_type: file.type,
            data: file.content.split(',')[1] // Remove the data:image/jpeg;base64, prefix
          }
        });
      }
    }

    // Add new user message
    const payload = {
      model: "claude-3-7-sonnet-20240307",
      max_tokens: 2048,
      messages: [
        ...conversationHistory,
        { 
          role: "user", 
          content: messageContent
        }
      ]
    };

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': key,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Claude API error details:", errorData);
        throw new Error(`Claude API error: ${errorData.error?.message || response.statusText}`);
      }

      const data = await response.json();
      return data.content[0].text;
    } catch (error) {
      console.error('Claude API call failed:', error);
      throw error;
    }
  };

  const handleFileAttach = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      
      reader.onload = (event) => {
        setFileAttachment({
          name: file.name,
          content: event.target?.result || null,
          type: file.type
        });
      };
      
      reader.readAsDataURL(file);
    }
  };

  return (
    <Box h="100%" display="flex" flexDirection="column">
      <Box 
        ref={chatContainerRef}
        flex="1" 
        overflowY="auto" 
        p={4} 
        bg={chatBg}
      >
        {messages.map((msg, idx) => (
          <Box 
            key={idx}
            mb={4}
            alignSelf={msg.role === 'user' ? 'flex-end' : 'flex-start'}
            maxW="80%"
          >
            <Box
              bg={msg.role === 'user' 
                ? userMessageBg
                : msg.role === 'system'
                ? systemMessageBg
                : assistantMessageBg}
              p={3}
              borderRadius="lg"
            >
              {msg.attachment && (
                <Box mb={2} p={2} bg="gray.100" borderRadius="md">
                  <Text fontSize="sm"><AttachmentIcon mr={2} />File: {msg.attachment}</Text>
                </Box>
              )}
              <Text whiteSpace="pre-wrap">{msg.content}</Text>
            </Box>
            <Text fontSize="xs" color="gray.500" mt={1}>
              {new Date(msg.timestamp).toLocaleTimeString()}
            </Text>
          </Box>
        ))}
        {isLoading && (
          <Flex justify="center" my={4}>
            <Spinner size="md" color="blue.500" />
          </Flex>
        )}
      </Box>
      
      <Box p={4} borderTop="1px solid" borderColor={borderColor}>
        {fileAttachment && (
          <Box mb={2} p={2} bg="gray.100" borderRadius="md" display="flex" alignItems="center">
            <Text fontSize="sm" flex="1"><AttachmentIcon mr={2} />{fileAttachment.name}</Text>
            <IconButton 
              aria-label="Remove file" 
              icon={<CloseIcon />} 
              size="xs"
              onClick={() => setFileAttachment(null)}
            />
          </Box>
        )}
        <Flex>
          <input
            type="file"
            ref={fileInputRef}
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />
          <IconButton
            aria-label="Attach file"
            icon={<AttachmentIcon />}
            onClick={handleFileAttach}
            mr={2}
          />
          <Input 
            placeholder="Ask about proteins or type 'fetch [PDB ID]'..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') handleSendMessage();
            }}
            flex="1"
          />
          <Button 
            colorScheme="blue" 
            ml={2} 
            onClick={handleSendMessage}
            isLoading={isLoading}
          >
            Send
          </Button>
        </Flex>
      </Box>
    </Box>
  );
};

// Missing CloseIcon component from above
const CloseIcon: React.FC = () => (
  <svg width="12px" height="12px" viewBox="0 0 24 24">
    <path 
      fill="currentColor" 
      d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"
    />
  </svg>
);

// Settings Component
const SettingsModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  apiKey: string;
  setApiKey: (key: string) => void;
}> = ({ isOpen, onClose, apiKey, setApiKey }) => {
  const [tempApiKey, setTempApiKey] = useState<string>(apiKey);
  
  const handleSave = () => {
    setApiKey(tempApiKey);
    onClose();
  };
  
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Settings</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <FormControl>
            <FormLabel>Claude API Key</FormLabel>
            <Input 
              type="password" 
              value={tempApiKey} 
              onChange={(e) => setTempApiKey(e.target.value)}
              placeholder="Enter your Claude API key"
            />
          </FormControl>
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={onClose}>
            Cancel
          </Button>
          <Button colorScheme="blue" onClick={handleSave}>
            Save
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

// Main App Component
const App: React.FC = () => {
  const { colorMode, toggleColorMode } = useColorMode();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [proteinPdbId, setProteinPdbId] = useState<string>('1ccn'); // Default protein
  const [apiKey, setApiKey] = useState<string>('');
  const toast = useToast();
  
  // Define theme
  const theme = extendTheme({
    config: {
      initialColorMode: 'dark',
      useSystemColorMode: false,
    },
  });

  const handleLoadProtein = (pdbId: string) => {
    setProteinPdbId(pdbId);
    toast({
      title: "Protein Loaded",
      description: `Loaded protein with PDB ID: ${pdbId}`,
      status: "success",
      duration: 3000,
      isClosable: true,
    });
  };

  return (
    <ChakraProvider theme={theme}>
      <Box minH="100vh" bg={useColorModeValue('gray.50', 'gray.900')}>
        <Flex 
          as="header" 
          align="center" 
          justify="space-between" 
          p={4} 
          bg={useColorModeValue('white', 'gray.800')} 
          borderBottomWidth="1px"
          borderColor={useColorModeValue('gray.200', 'gray.700')}
        >
          <Heading size="md">GlycoShape Copilot</Heading>
          <HStack>
            <IconButton
              aria-label="Toggle color mode"
              icon={colorMode === 'light' ? <MoonIcon /> : <SunIcon />}
              onClick={toggleColorMode}
            />
            <IconButton
              aria-label="Settings"
              icon={<SettingsIcon />}
              onClick={onOpen}
            />
          </HStack>
        </Flex>

        <Flex h="calc(100vh - 73px)" direction={{ base: 'column', lg: 'row' }}>
          <Box 
            flex="3" 
            p={4} 
            borderRightWidth={{ base: '0', lg: '1px' }}
            borderBottomWidth={{ base: '1px', lg: '0' }}
            borderColor={useColorModeValue('gray.200', 'gray.700')}
            h={{ base: '50%', lg: '100%' }}
          >
            <MolstarViewer
              urls={[
                { url: `https://files.rcsb.org/download/${proteinPdbId}.pdb`, format: 'pdb' },
              ]}
              backgroundColor={useColorModeValue("#FCFBF9", "#222")}
            />
          </Box>
          <Box 
            flex="2" 
            h={{ base: '50%', lg: '100%' }}
            maxW={{ base: '100%', lg: '500px' }}
          >
            <ClaudeChat apiKey={apiKey} onLoadProtein={handleLoadProtein} />
          </Box>
        </Flex>

        <SettingsModal 
          isOpen={isOpen} 
          onClose={onClose} 
          apiKey={apiKey} 
          setApiKey={setApiKey} 
        />
      </Box>
    </ChakraProvider>
  );
};

export default App;
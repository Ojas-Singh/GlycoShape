import React, { useState, useRef, useEffect, useCallback } from 'react';
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
  VStack,
  HStack,
  ChakraProvider,
  extendTheme,
  useToast,
  Icon,
  Tooltip,
  Collapse,
  useClipboard,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Image,
  Code,
} from '@chakra-ui/react';
import { MoonIcon, SunIcon, AttachmentIcon, CloseIcon, CopyIcon, CheckIcon } from '@chakra-ui/icons';
import MolstarApp from './MolstarApp';
import Latex from 'react-latex-next';
import 'katex/dist/katex.min.css';
import ReactMarkdown, { Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark, oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';

// Define types
interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  attachment?: {
    name: string;
    content: string | null;
    type: string | null;
    isImage?: boolean;
    isText?: boolean;
    isCSV?: boolean;
    isJSON?: boolean;
  } | null;
  id?: string;
}

interface FileAttachment {
  name: string;
  content: string | ArrayBuffer | null;
  previewContent: string | null;
  type?: string;
  isImage?: boolean;
  isText?: boolean;
  isCSV?: boolean;
  isJSON?: boolean;
}

// --- Define outside component if they don't use hooks ---
const latexDelimiters = [
  { left: '$$', right: '$$', display: true },
  { left: '$', right: '$', display: false },
  { left: '\\(', right: '\\)', display: false },
  { left: '\\[', right: '\\]', display: true },
];

// --- System Prompt Definition ---
const SYSTEM_PROMPT = 
`You are GlycoShape Copilot, an expert assistant specializing in protein structures, glycosylation, and bioinformatics.
- **IMPORTANT:** When the user asks to load, fetch, or view a protein using a PDB ID (e.g., "fetch 1aqg", "load 2hhd"), ALWAYS include the special command <load_protein>XXXX</load_protein> somewhere in your response, where XXXX is the 4-character PDB ID in uppercase. This tag will be processed by the system but won't be displayed to the user. You dont need to explain the things about the protein just explain what you did.

`;
// --- End System Prompt Definition ---

// Backend Chat Component
const BackendChat: React.FC<{
  onLoadProtein: (pdbId: string) => void;
  chatApiEndpoint: string;
}> = ({ onLoadProtein, chatApiEndpoint }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [fileAttachment, setFileAttachment] = useState<FileAttachment | null>(null);
  const [thinkingVisible, setThinkingVisible] = useState<{ [key: string]: boolean }>({});
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<HTMLInputElement>(null);
  const { isOpen: isModalOpen, onOpen: openModal, onClose: closeModal } = useDisclosure();
  const [modalContent, setModalContent] = useState<ChatMessage['attachment']>(null);

  // --- Color mode values (ALL hooks called unconditionally here) ---
  const userMessageBg = useColorModeValue('blue.100', 'blue.600');
  const assistantMessageBg = useColorModeValue('gray.100', 'gray.700');
  const chatBg = useColorModeValue('gray.50', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const inputBg = useColorModeValue('white', 'gray.700');
  const attachmentBg = useColorModeValue('blackAlpha.100', 'whiteAlpha.100');
  const attachmentTextColor = useColorModeValue('gray.600', 'gray.400');
  const inputAttachmentBg = useColorModeValue('gray.100', 'gray.600');
  const thinkingBg = useColorModeValue('whiteAlpha.500', 'blackAlpha.300');
  const welcomeHeadingColor = useColorModeValue('gray.600', 'gray.400');
  const welcomeTextColor = useColorModeValue('gray.500', 'gray.500');

  // --- Custom Renderers ---
  const MarkdownParagraph: React.FC<React.PropsWithChildren<{}>> = ({ children }) => {
    const contentAsString = React.Children.toArray(children).map(child => {
        if (typeof child === 'string') {
            return child;
        }
        if (React.isValidElement(child) && typeof child.props.children === 'string') {
            return child.props.children;
        }
        return '';
    }).join('');

    return (
      <Text as="p" mb={2}>
        <Latex delimiters={latexDelimiters}>{contentAsString}</Latex>
      </Text>
    );
  };

  const CodeBlock: React.FC<any> = ({ node, inline, className, children, ...props }) => {
    const { hasCopied, onCopy } = useClipboard(String(children).replace(/\n$/, ''));
    const match = /language-(\w+)/.exec(className || '');
    const language = match ? match[1] : undefined;
    const codeStyle = useColorModeValue(oneLight, oneDark);
    const inlineBg = useColorModeValue('gray.100', 'gray.700');

    return !inline ? (
      <Box position="relative" my={4} className="code-block">
        <SyntaxHighlighter style={codeStyle} language={language} PreTag="div" {...props}>
          {String(children).replace(/\n$/, '')}
        </SyntaxHighlighter>
        <Tooltip label={hasCopied ? 'Copied!' : 'Copy code'} placement="top">
          <IconButton
            aria-label="Copy code"
            icon={hasCopied ? <CheckIcon /> : <CopyIcon />}
            size="sm"
            position="absolute"
            top="0.5rem"
            right="0.5rem"
            onClick={onCopy}
            variant="ghost"
            colorScheme={hasCopied ? 'green' : 'gray'}
          />
        </Tooltip>
      </Box>
    ) : (
      <Text as="code" px={1} py={0.5} bg={inlineBg} borderRadius="sm" fontSize="sm" fontFamily="monospace" {...props}>
        {children}
      </Text>
    );
  };

  const markdownComponents: Components = {
    p: MarkdownParagraph,
    code: CodeBlock,
  };

  // Scroll to bottom
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const handlePaste = useCallback(
    (event: ClipboardEvent) => {
      if (isLoading) return;

      const items = event.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const blob = items[i].getAsFile();
          if (!blob) continue;

          const reader = new FileReader();
          reader.onload = (loadEvent) => {
            const dataUrl = loadEvent.target?.result as string;
            const fileType = blob.type.split('/')[1] || 'png';
            const fileName = `pasted_image_${Date.now()}.${fileType}`;

            setFileAttachment({
              name: fileName,
              content: dataUrl,
              previewContent: dataUrl,
              type: blob.type,
              isImage: true,
              isText: false,
              isCSV: false,
              isJSON: false,
            });
            toast({ title: 'Image Pasted', status: 'info', duration: 2000 });
          };
          reader.onerror = (error) => {
            console.error('Error reading pasted image:', error);
            toast({ title: 'Paste Error', description: 'Could not read pasted image.', status: 'error' });
          };
          reader.readAsDataURL(blob);

          event.preventDefault();
          return;
        }
      }
    },
    [isLoading, toast]
  );

  useEffect(() => {
    const currentInput = chatInputRef.current;
    if (currentInput) {
      currentInput.addEventListener('paste', handlePaste);
    }

    return () => {
      if (currentInput) {
        currentInput.removeEventListener('paste', handlePaste);
      }
    };
  }, [handlePaste]);

  const processLoadProteinCommands = useCallback(
    (content: string, shouldLoad: boolean = false): { processedContent: string; pdbIdLoaded: string | null } => {
      const loadRegex = /<load_protein>([A-Za-z0-9]{4})<\/load_protein>/g;
      let match;
      let pdbIdLoaded: string | null = null;

      if ((match = loadRegex.exec(content)) !== null) {
        pdbIdLoaded = match[1].toUpperCase();

        if (pdbIdLoaded && shouldLoad) {
          onLoadProtein(pdbIdLoaded);

          toast({
            title: 'Loading Protein',
            description: `Displaying structure for PDB ID: ${pdbIdLoaded}`,
            status: 'info',
            duration: 2000,
            isClosable: true,
          });
        }
      }

      const processedContent = content.replace(loadRegex, '');

      return { processedContent, pdbIdLoaded };
    },
    [onLoadProtein, toast]
  );

  const parseMessageContent = (content: string) => {
    const { processedContent } = processLoadProteinCommands(content, false);

    const thinkRegex = /<think>(.*?)<\/think>/s;
    const match = processedContent.match(thinkRegex);
    if (match && match[1] !== undefined) {
      const thinkContent = match[1].trim();
      const parts = processedContent.split(match[0]);
      return { before: parts[0] || '', thinking: thinkContent, after: parts[1] || '' };
    }
    return { before: processedContent, thinking: null, after: '' };
  };

  const openAttachmentModal = (attachmentData: ChatMessage['attachment']) => {
    if (attachmentData) {
      setModalContent(attachmentData);
      openModal();
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim() && !fileAttachment) return;

    const userMessageContent = input;
    const currentAttachment = fileAttachment;

    const userMessageForUI: ChatMessage = {
      role: 'user',
      content: userMessageContent,
      timestamp: new Date().toISOString(),
      attachment: currentAttachment
        ? {
            name: currentAttachment.name,
            content: currentAttachment.previewContent,
            type: currentAttachment.type || null,
            isImage: currentAttachment.isImage,
            isText: currentAttachment.isText,
            isCSV: currentAttachment.isCSV,
            isJSON: currentAttachment.isJSON,
          }
        : null,
    };

    const updatedMessages = [...messages, userMessageForUI];
    setMessages(updatedMessages);
    setInput('');
    setFileAttachment(null);

    setIsLoading(true);

    const assistantMessageId = Date.now().toString();
    setMessages((prev) => [
      ...prev,
      {
        role: 'assistant',
        content: '...',
        timestamp: new Date().toISOString(),
        id: assistantMessageId,
      } as ChatMessage & { id: string },
    ]);

    try {
      const initialSystemMessage = messages.find((msg) => msg.role === 'system');
      const historyMessages = updatedMessages.filter((msg) => msg.role === 'user' || msg.role === 'assistant');

      const messagesForApi = historyMessages.map((msg) => {
        if (msg === userMessageForUI && currentAttachment?.isImage && typeof currentAttachment.content === 'string') {
          const contentPayload: any[] = [{ type: 'text', text: msg.content }];
          contentPayload.push({
            type: 'image_url',
            image_url: {
              url: currentAttachment.content,
            },
          });
          return { role: msg.role, content: contentPayload };
        }
        if (msg === userMessageForUI && currentAttachment && typeof currentAttachment.content === 'string' && !currentAttachment.isImage) {
          const fileInfo = `\n\n--- Attached File: ${currentAttachment.name} ---\n${currentAttachment.content.substring(0, 1000)}...\n--- End Attached File ---`;
          return { role: msg.role, content: msg.content + fileInfo };
        }
        return { role: msg.role, content: msg.content };
      });

      const finalApiMessages = [{ role: 'system', content: SYSTEM_PROMPT }, ...messagesForApi];

      const payload = {
        model: 'local',
        messages: finalApiMessages,
        temperature: 0.6,
        max_tokens: 1024,
        stream: true,
      };

      const response = await fetch(chatApiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        let errorMsg = `API request failed with status ${response.status}`;
        try {
          const errorData = await response.json();
          console.error('LM Studio Error Response:', errorData);
          errorMsg = errorData.error?.message || errorData.detail || JSON.stringify(errorData) || errorMsg;
        } catch (parseError) {
          console.error('Failed to parse error response body.');
        }
        setMessages((prev) => prev.filter((msg) => (msg as any).id !== assistantMessageId));
        throw new Error(errorMsg);
      }

      if (!response.body) {
        throw new Error('Response body is null');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulatedContent = '';
      let firstChunk = true;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n').filter((line) => line.trim() !== '');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const jsonStr = line.substring(6).trim();
            if (jsonStr === '[DONE]') {
              continue;
            }
            try {
              const parsed = JSON.parse(jsonStr);
              const delta = parsed.choices?.[0]?.delta?.content;

              if (delta) {
                if (firstChunk) {
                  accumulatedContent = delta;
                  firstChunk = false;
                } else {
                  accumulatedContent += delta;
                }

                const { processedContent } = processLoadProteinCommands(accumulatedContent, false);

                setMessages((prev) =>
                  prev.map((msg) =>
                    (msg as any).id === assistantMessageId ? { ...msg, content: processedContent } : msg
                  )
                );
              }
            } catch (e) {
              console.error('Failed to parse stream chunk:', jsonStr, e);
            }
          }
        }
      }

      const { processedContent, pdbIdLoaded } = processLoadProteinCommands(accumulatedContent, true);

      setMessages((prev) =>
        prev.map((msg) => {
          if ((msg as any).id === assistantMessageId) {
            const { id, ...rest } = msg as any;
            return { ...rest, content: processedContent };
          }
          return msg;
        })
      );
    } catch (error: any) {
      console.error('Error handling stream or sending message:', error);
      toast({
        title: 'Chat Error',
        description: error.message || 'Could not connect or process stream.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      setMessages((prev) => prev.filter((msg) => (msg as any).id !== assistantMessageId));
      setMessages((prev) => [
        ...prev,
        {
          role: 'system',
          content: `Error: ${error.message || 'Failed to get response.'}`,
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsLoading(false);
      chatInputRef.current?.focus();
    }
  };

  const handleFileAttach = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      const fileType = file.type;
      const isImage = fileType.startsWith('image/');
      const isText = fileType.startsWith('text/');
      const isCSV = fileType === 'text/csv' || file.name.endsWith('.csv');
      const isJSON = fileType === 'application/json' || file.name.endsWith('.json');

      reader.onload = (event) => {
        const result = event.target?.result;
        setFileAttachment({
          name: file.name,
          content: result || null,
          previewContent: typeof result === 'string' ? result : null,
          type: fileType,
          isImage: isImage,
          isText: isText || isCSV || isJSON,
          isCSV: isCSV,
          isJSON: isJSON,
        });
      };

      reader.onerror = (error) => {
        console.error('File reading error:', error);
        toast({ title: 'File Error', description: 'Could not read the selected file.', status: 'error' });
      };

      if (isImage) {
        reader.readAsDataURL(file);
      } else if (isText || isCSV || isJSON) {
        reader.readAsText(file);
      } else {
        setFileAttachment({
          name: file.name,
          content: null,
          previewContent: null,
          type: fileType,
          isImage: false,
          isText: false,
        });
      }
    }
  };

  const removeAttachment = () => {
    setFileAttachment(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const toggleThinking = (messageKey: string) => {
    setThinkingVisible((prev) => ({ ...prev, [messageKey]: !prev[messageKey] }));
  };

  return (
    <Flex direction="column" h="100%" bg={chatBg}>
      <Box ref={chatContainerRef} flex="1" overflowY="auto" p={4} position="relative">
        {messages.length === 0 && !isLoading ? (
          <Flex
            position="absolute"
            top="0"
            left="0"
            right="0"
            bottom="0"
            align="center"
            justify="center"
            direction="column"
            textAlign="center"
            p={4}
            pointerEvents="none"
          >
            <Heading size="lg" mb={2} color={welcomeHeadingColor}>
              GlycoShape Copilot
            </Heading>
            <Text fontSize="xl" color={welcomeTextColor}>
              What can I help with?
            </Text>
            <Text fontSize="sm" color="gray.500" mt={4}>
              (You can ask about proteins, paste images, or type 'fetch [PDB ID]')
            </Text>
          </Flex>
        ) : (
          <VStack spacing={4} align="stretch">
            {messages.map((msg, idx) => {
              if (msg.role === 'system') {
                return null;
              }

              if (msg.content === '...' && (msg as any).id) {
                return null;
              }

              const messageKey = `${msg.role}-${idx}`;
              const parsedContent = parseMessageContent(msg.content || '');
              const isThinkingVisible = thinkingVisible[messageKey] || false;

              return (
                <Flex key={idx} justify={msg.role === 'user' ? 'flex-end' : 'flex-start'}>
                  <Box
                    maxW={{ base: '90%', md: '80%' }}
                    bg={msg.role === 'user' ? userMessageBg : assistantMessageBg}
                    px={4}
                    py={2}
                    borderRadius="lg"
                    boxShadow="sm"
                    className="chat-message-content"
                  >
                    {msg.attachment && (
                      <Button
                        variant="link"
                        size="sm"
                        onClick={() => openAttachmentModal(msg.attachment)}
                        mb={2}
                        p={0}
                        height="auto"
                        _hover={{ textDecoration: 'none' }}
                        w="full"
                      >
                        <HStack spacing={2} p={2} bg={attachmentBg} borderRadius="md" w="full">
                          <AttachmentIcon boxSize="1em" />
                          <Text fontSize="sm" noOfLines={1} title={msg.attachment.name}>
                            File: {msg.attachment.name}
                          </Text>
                        </HStack>
                      </Button>
                    )}

                    {parsedContent.before && (
                      <Box className="markdown-container">
                        <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                          {parsedContent.before.trim()}
                        </ReactMarkdown>
                      </Box>
                    )}

                    {parsedContent.thinking && (
                      <Box my={2}>
                        <Button
                          size="xs"
                          variant="outline"
                          onClick={() => toggleThinking(messageKey)}
                          mb={1}
                        >
                          {isThinkingVisible ? 'Hide' : 'Show'} Thinking...
                        </Button>
                        <Collapse in={isThinkingVisible} animateOpacity>
                          <Box p={2} borderWidth="1px" borderRadius="md" borderColor={borderColor} bg={thinkingBg}>
                            <Box className="markdown-container" fontSize="sm" fontStyle="italic">
                              <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                                {parsedContent.thinking}
                              </ReactMarkdown>
                            </Box>
                          </Box>
                        </Collapse>
                      </Box>
                    )}

                    {parsedContent.after && (
                      <Box className="markdown-container">
                        <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                          {parsedContent.after.trim()}
                        </ReactMarkdown>
                      </Box>
                    )}

                    <Text fontSize="xs" color={attachmentTextColor} mt={1} textAlign="right">
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                  </Box>
                </Flex>
              );
            })}
            {isLoading && messages.length > 0 && (
              <Flex justify="center" my={4}>
                <Spinner size="md" color="blue.500" />
              </Flex>
            )}
          </VStack>
        )}
      </Box>

      <Box p={4} borderTop="1px solid" borderColor={borderColor}>
        {fileAttachment && (
          <HStack mb={2} p={2} bg={inputAttachmentBg} borderRadius="md" justify="space-between">
            <HStack spacing={2} overflow="hidden" align="center">
              {fileAttachment.isImage && typeof fileAttachment.previewContent === 'string' ? (
                <img
                  src={fileAttachment.previewContent}
                  alt="Pasted preview"
                  style={{ maxHeight: '40px', maxWidth: '100px', borderRadius: '4px' }}
                />
              ) : (
                <AttachmentIcon />
              )}
              <Text fontSize="sm" isTruncated title={fileAttachment.name}>
                {fileAttachment.name}
              </Text>
            </HStack>
            <Tooltip label="Remove attachment" placement="top">
              <IconButton
                aria-label="Remove file"
                icon={<CloseIcon />}
                size="xs"
                variant="ghost"
                onClick={removeAttachment}
              />
            </Tooltip>
          </HStack>
        )}
        <Flex align="center">
          <input type="file" ref={fileInputRef} style={{ display: 'none' }} onChange={handleFileChange} />
          <Tooltip label="Attach file" placement="top">
            <IconButton
              aria-label="Attach file"
              icon={<AttachmentIcon />}
              onClick={handleFileAttach}
              mr={2}
              variant="ghost"
              isDisabled={isLoading}
            />
          </Tooltip>
          <Input
            ref={chatInputRef}
            placeholder="Ask about proteins, type 'fetch [PDB ID]', or paste an image..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            flex="1"
            bg={inputBg}
            isDisabled={isLoading}
            mr={2}
            borderRadius="full"
          />
          <Tooltip label="Send message" placement="top">
            <IconButton
              aria-label="Send message"
              icon={<Icon as={PaperPlane} />}
              colorScheme="blue"
              onClick={handleSendMessage}
              isLoading={isLoading}
              isDisabled={!input.trim() && !fileAttachment}
              borderRadius="full"
            />
          </Tooltip>
        </Flex>
      </Box>

      <Modal isOpen={isModalOpen} onClose={closeModal} size="xl" isCentered scrollBehavior="inside">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader  title={modalContent?.name} fontSize="lg" fontWeight="bold" textAlign="center">
            {modalContent?.name || 'Attachment'}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {modalContent?.isImage && typeof modalContent.content === 'string' ? (
              <Image src={modalContent.content} alt={modalContent.name} maxW="100%" />
            ) : modalContent?.isJSON && typeof modalContent.content === 'string' ? (
              <Code as="pre" whiteSpace="pre-wrap" wordBreak="break-all" p={3} bg={inputBg} borderRadius="md" w="full">
                {(() => {
                  try {
                    return JSON.stringify(JSON.parse(modalContent.content), null, 2);
                  } catch (e) {
                    return modalContent.content;
                  }
                })()}
              </Code>
            ) : modalContent?.isCSV && typeof modalContent.content === 'string' ? (
              <Code as="pre" whiteSpace="pre-wrap" wordBreak="break-all" p={3} bg={inputBg} borderRadius="md" w="full">
                {modalContent.content}
              </Code>
            ) : modalContent?.isText && typeof modalContent.content === 'string' ? (
              <Code as="pre" whiteSpace="pre-wrap" wordBreak="break-all" p={3} bg={inputBg} borderRadius="md" w="full">
                {modalContent.content}
              </Code>
            ) : (
              <Text color="gray.500">Preview not available for this file type ({modalContent?.type || 'unknown'}).</Text>
            )}
          </ModalBody>
          <ModalFooter>
            <Button onClick={closeModal}>Close</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Flex>
  );
};

const App: React.FC = () => {
  const { colorMode, toggleColorMode } = useColorMode();
  const [proteinPdbId, setProteinPdbId] = useState<string>('');
  const toast = useToast();
  const chatApiEndpoint = 'http://localhost:1234/v1/chat/completions';

  const theme = extendTheme({
    config: {
      initialColorMode: 'dark',
      useSystemColorMode: false,
    },
    styles: {
      global: (props: any) => ({
        body: {
          bg: props.colorMode === 'light' ? 'gray.50' : 'gray.900',
        },
      }),
    },
  });

  const handleLoadProtein = useCallback(
    (pdbId: string) => {
      setProteinPdbId(pdbId);
      toast({
        title: 'Protein Loaded',
        description: `Displaying structure for PDB ID: ${pdbId}`,
        status: 'success',
        duration: 3000,
        isClosable: true,
        position: 'top',
      });
    },
    [toast]
  );

  const molstarUrls = React.useMemo(
    () => [
      { url: `https://files.rcsb.org/download/${proteinPdbId}.cif`, format: 'cif', isBinary: false },
    ],
    [proteinPdbId]
  );

  return (
    <ChakraProvider theme={theme}>
      <Flex direction="column" minH="100vh" bg={useColorModeValue('gray.50', 'gray.900')}>
        <Flex
          as="header"
          align="center"
          justify="space-between"
          p={3}
          bg={useColorModeValue('white', 'gray.800')}
          borderBottomWidth="1px"
          borderColor={useColorModeValue('gray.200', 'gray.700')}
          boxShadow="sm"
        >
          <Heading
            size="md"
            fontWeight="semibold"
            as="a"
            href="/chat"
            _hover={{ textDecoration: 'underline', cursor: 'pointer' }}
          >
            GlycoShape Copilot
          </Heading>
          <HStack>
            <Tooltip label={`Switch to ${colorMode === 'light' ? 'Dark' : 'Light'} Mode`} placement="bottom">
              <IconButton
                aria-label="Toggle color mode"
                icon={colorMode === 'light' ? <MoonIcon /> : <SunIcon />}
                onClick={toggleColorMode}
                variant="ghost"
              />
            </Tooltip>
          </HStack>
        </Flex>

        <Flex flex="1" direction={{ base: 'column', lg: 'row' }} overflow="hidden">
          <Box
            flex={{ base: '1', lg: '3' }}
            p={4}
            borderRightWidth={{ base: '0', lg: '1px' }}
            borderBottomWidth={{ base: '1px', lg: '0' }}
            borderColor={useColorModeValue('gray.200', 'gray.700')}
            h={{ base: '50vh', lg: 'auto' }}
            minH={{ base: '300px', lg: 'auto' }}
            position="relative"
          >
            <MolstarApp
              key={proteinPdbId}
              urls={[{ url: `https://files.rcsb.org/download/${proteinPdbId}.pdb`, format: 'pdb' }]}
              backgroundColor={useColorModeValue('#FFFFFF', '#1A202C')}
            />
          </Box>

          <Box
            flex={{ base: '1', lg: '2' }}
            h={{ base: 'calc(100vh - 50vh - 61px)', lg: 'calc(100vh - 61px)' }}
            maxW={{ base: '100%', lg: '60%' }}
            minW={{ base: '100%', lg: '350px' }}
          >
            <BackendChat onLoadProtein={handleLoadProtein} chatApiEndpoint={chatApiEndpoint} />
          </Box>
        </Flex>
      </Flex>
    </ChakraProvider>
  );
};

const PaperPlane = (props: any) => (
  <svg viewBox="0 0 24 24" fill="currentColor" height="1em" width="1em" {...props}>
    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
  </svg>
);

export default App;
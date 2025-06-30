import React, { useState, useRef, useEffect, useCallback, isValidElement, Fragment } from 'react';
import {
  Box,
  Flex,
  Input,
  Button,
  Text,
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
  useDisclosure,
  Image,
  Code,
  Alert,
  AlertIcon,
  AlertDescription,
} from '@chakra-ui/react';
import { ChevronUpIcon, ChevronDownIcon, AttachmentIcon, CloseIcon, CopyIcon, CheckIcon, ExternalLinkIcon } from '@chakra-ui/icons';
import Latex from 'react-latex-next';
import 'katex/dist/katex.min.css';
import ReactMarkdown, { Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { v4 as uuidv4 } from 'uuid';

// --- Constants ---
const API_BASE_URL = 'http://localhost:5001';
const CHAT_API_ENDPOINT = `${API_BASE_URL}/api/chat`;

// --- Interfaces ---
interface CodeOutput {
  stdout: string;
  stderr: string;
  code?: string;
}

interface PlotInfo {
  url: string;
  alt: string;
}

interface MolViewSpecInfo {
  molviewspec: any;
  filename: string;
}

interface PdbInfo {
  url: string;
  filename: string;
}

interface ToolStatus {
  name: string;
  status: 'running' | 'finished' | 'error';
}

interface ChatMessage {
  role: 'user' | 'assistant' | 'system' | 'tool_info';
  content: string; // Unified content field
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
  id?: string; // Unique ID for assistant messages during streaming
  codeOutput?: CodeOutput | null;
  plotInfo?: PlotInfo | null;
  pdbInfo?: PdbInfo | null;
  molViewSpecInfo?: MolViewSpecInfo | null;
  toolStatus?: ToolStatus | null;
  isError?: boolean;
  startTime?: number; // Track when the message started
  // New field to track chronological order of events
  events?: Array<{
    id: string;
    type: 'text' | 'code_output' | 'plot' | 'pdb' | 'molviewspec' | 'tool_start' | 'tool_end';
    content: any;
    timestamp: number;
    duration?: number; // For tracking how long something took
    status?: 'in_progress' | 'completed' | 'error';
  }>;
}

interface FileAttachment {
  file: File;
  name: string;
  previewContent: string | null;
  type?: string;
  isImage?: boolean;
  isText?: boolean;
  isCSV?: boolean;
  isJSON?: boolean;
}

// --- Helper Components & Functions ---
const PaperPlane = (props: any) => (
  <svg viewBox="0 0 24 24" fill="currentColor" height="1em" width="1em" {...props}>
    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
  </svg>
);

// --- Main Chat Component ---
const BackendChat: React.FC<{
  onMolViewSpecUpdate?: (molviewspec: any, filename: string) => void;
}> = ({ onMolViewSpecUpdate }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [fileAttachment, setFileAttachment] = useState<FileAttachment | null>(null);
  const [codeOutputVisible, setCodeOutputVisible] = useState<{ [key: string]: boolean }>({});
  const [sessionId, setSessionId] = useState<string | null>(null);
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<HTMLInputElement>(null);
  const { isOpen: isModalOpen, onOpen: openModal, onClose: closeModal } = useDisclosure();
  const [modalContent, setModalContent] = useState<ChatMessage['attachment']>(null);
  const [pdbPreviewContent, setPdbPreviewContent] = useState<string | null>(null);
  const [isPdbPreviewOpen, setIsPdbPreviewOpen] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const newSessionId = uuidv4();
    console.log("Generated Session ID:", newSessionId);
    setSessionId(newSessionId);
  }, []);

  const userMessageBg = 'blue.100';
  const assistantMessageBg = 'gray.100';
  const toolInfoMessageBg = 'purple.50';
  const errorMessageBg = 'red.100';
  const chatBg = 'gray.50';
  const borderColor = 'gray.200';
  const inputBg = 'white';
  const attachmentBg = 'blackAlpha.100';
  const attachmentTextColor = 'gray.600';
  const inputAttachmentBg = 'gray.100';
  const welcomeHeadingColor = 'gray.600';
  const welcomeTextColor = 'gray.500';
  const codeStyle = oneLight;
  const inlineCodeBg = 'gray.100';
  const codeOutputBg = 'gray.50';
  const codeBlockHeaderBg = 'gray.100';
  const stderrColor = "red.600";
  const stderrCodeColor = "red.600";

  const MarkdownParagraph: React.FC<React.PropsWithChildren<{}>> = ({ children }) => {
    const latexDelimiters = [
      { left: '$$', right: '$$', display: true }, { left: '$', right: '$', display: false },
      { left: '\\(', right: '\\)', display: false }, { left: '\\[', right: '\\]', display: true }
    ];
    if (children == null) return null;
    return (
      <Box as="p" mb={2}>
        {(() => {
          if (typeof children === 'string') {
            return <Latex delimiters={latexDelimiters}>{children}</Latex>;
          }
          if (Array.isArray(children)) {
            return children.map((child, index) => {
              if (typeof child === 'string') {
                return <Latex key={index} delimiters={latexDelimiters}>{child}</Latex>;
              } else if (isValidElement(child)) {
                return <Fragment key={index}>{child}</Fragment>;
              }
              return null;
            });
          }
          if (isValidElement(children)) { return children; }
          console.warn("MarkdownParagraph received unexpected children type:", children);
          return children as React.ReactNode;
        })()}
      </Box>
    );
  };

  const CodeBlock: React.FC<any> = ({ node, inline, className, children, ...props }) => {
    const content = String(children).replace(/\n$/, '');
    const containsNewlines = content.includes('\n');
    const isCodeBlock = containsNewlines || (className && className.startsWith('language-'));
    const effectiveInline = !isCodeBlock;
    const { hasCopied, onCopy } = useClipboard(content);
    const match = /language-(\w+)/.exec(className || '');
    const language = match ? match[1] : 'plaintext';

    if (effectiveInline) {
      return (
        <Code display="inline-block" verticalAlign="baseline" px={1} py={0.5}
              bg={inlineCodeBg} borderRadius="sm" fontSize="sm" fontFamily="monospace" {...props}>
          {children}
        </Code>
      );
    } else {
      return (
        <Box position="relative" my={4} className="code-block" bg={codeOutputBg} borderRadius="md" overflow="hidden" borderWidth="1px" borderColor={borderColor}>
           <HStack px={3} py={1} bg={codeBlockHeaderBg} borderBottomWidth="1px" borderColor={borderColor} justifyContent="space-between">
              <Text fontSize="xs" color="gray.500" textTransform="uppercase">{language}</Text>
               <Tooltip label={hasCopied ? 'Copied!' : 'Copy code'} placement="top">
                <IconButton aria-label="Copy code" icon={hasCopied ? <CheckIcon /> : <CopyIcon />}
                            size="xs" onClick={onCopy} variant="ghost" colorScheme={hasCopied ? 'green' : 'gray'}/>
              </Tooltip>
           </HStack>
          <SyntaxHighlighter style={codeStyle} language={language} PreTag="div" {...props}
                           customStyle={{ margin: 0, padding: '1rem', fontSize: '0.875rem', backgroundColor: 'transparent' }}
                           wrapLongLines={false} codeTagProps={{ style: { fontFamily: 'monospace' } }}>
            {content}
          </SyntaxHighlighter>
        </Box>
      );
    }
  };
  
  const markdownComponents: Components = {
    p: MarkdownParagraph,
    code: CodeBlock,
  };

  // Component to render chronological events with timeline
  const EventRenderer: React.FC<{ 
    event: any; 
    messageKey: string; 
    onMolViewSpecUpdate?: (molviewspec: any, filename: string) => void;
    isLast?: boolean;
  }> = ({ event, messageKey, onMolViewSpecUpdate, isLast = false }) => {
    const getEventIcon = (type: string, status?: string) => {
      switch (type) {
        case 'text':
          return <Box w="8px" h="8px" bg="blue.400" borderRadius="full" />;
        case 'code_output':
          return <Box w="8px" h="8px" bg="purple.400" borderRadius="full" />;
        case 'plot':
          return <Box w="8px" h="8px" bg="green.400" borderRadius="full" />;
        case 'pdb':
          return <Box w="8px" h="8px" bg="orange.400" borderRadius="full" />;
        case 'molviewspec':
          return <Box w="8px" h="8px" bg="teal.400" borderRadius="full" />;
        case 'tool_start':
          return status === 'in_progress' ? 
            <Spinner size="xs" color="yellow.500" /> : 
            <Box w="8px" h="8px" bg="yellow.400" borderRadius="full" />;
        case 'tool_end':
          return <CheckIcon w="8px" h="8px" color="green.500" />;
        default:
          return <Box w="8px" h="8px" bg="gray.400" borderRadius="full" />;
      }
    };

    const formatDuration = (duration?: number) => {
      if (!duration) return '';
      const seconds = Math.round(duration / 1000);
      return ` • Worked for ${seconds}s`;
    };

    return (
      <HStack align="flex-start" spacing={3} mb={2}>
        {/* Timeline dot and line */}
        <VStack spacing={0} align="center" pt="6px">
          {getEventIcon(event.type, event.status)}
          {!isLast && (
            <Box w="2px" h="20px" bg="gray.200" mt={1} />
          )}
        </VStack>

        {/* Event content */}
        <Box flex="1" minW="0">
          {event.type === 'text' && (
            <Box className="markdown-container">
              <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                {event.content}
              </ReactMarkdown>
            </Box>
          )}

          {event.type === 'code_output' && (
            <Box>
              <HStack 
                spacing={2} 
                mb={2} 
                align="center" 
                cursor="pointer"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  toggleCodeOutput(`${messageKey}-${event.id}`);
                }}
                _hover={{ bg: "gray.100" }}
                borderRadius="sm"
                p={1}
                mx={-1}
              >
                <Text fontSize="xs" fontWeight="bold" color="purple.600">
                  Code Execution
                </Text>
                {event.duration && (
                  <Text fontSize="xs" color="gray.500">
                    {formatDuration(event.duration)}
                  </Text>
                )}
                <Box 
                  as="span"
                  display="flex"
                  alignItems="center"
                  ml="auto"
                >
                  {codeOutputVisible[`${messageKey}-${event.id}`] ? <ChevronUpIcon /> : <ChevronDownIcon />}
                </Box>
              </HStack>

              {/* Always show a preview of the code */}
              {event.content.code && (
                <Box mb={2} bg={codeOutputBg} borderRadius="md" borderWidth="1px" borderColor={borderColor}>
                  <HStack px={3} py={1} bg={codeBlockHeaderBg} borderBottomWidth="1px" borderColor={borderColor} justifyContent="space-between">
                    <Text fontSize="xs" color="gray.500" textTransform="uppercase">python</Text>
                    <Text fontSize="xs" color="gray.500">
                      {codeOutputVisible[`${messageKey}-${event.id}`] ? 'Full Code' : 'Preview'}
                    </Text>
                  </HStack>
                  <Box p={3}>
                    <Code as="pre" fontSize="sm" fontFamily="monospace" whiteSpace="pre-wrap" bg="transparent">
                      {codeOutputVisible[`${messageKey}-${event.id}`] 
                        ? event.content.code 
                        : event.content.code.split('\n').slice(0, 3).join('\n') + 
                          (event.content.code.split('\n').length > 3 ? '\n...' : '')
                      }
                    </Code>
                  </Box>
                </Box>
              )}

              <Collapse in={codeOutputVisible[`${messageKey}-${event.id}`]} animateOpacity unmountOnExit>
                <Box>
                  {(event.content.stdout || event.content.stderr) && (
                    <Text fontSize="sm" fontWeight="bold" mb={2}>Output:</Text>
                  )}
                  {event.content.stdout && (
                    <Box mb={event.content.stderr ? 2 : 0}>
                      <Text fontSize="xs" color="gray.500" mb={1}>STDOUT:</Text>
                      <Code as="pre" p={3} bg={codeOutputBg} borderRadius="md" whiteSpace="pre-wrap" 
                            wordBreak="break-all" fontSize="sm" w="full" borderWidth="1px" borderColor={borderColor}>
                        {event.content.stdout}
                      </Code>
                    </Box>
                  )}
                  {event.content.stderr && (
                    <Box>
                      <Text fontSize="xs" color={stderrColor} mb={1}>STDERR:</Text>
                      <Code as="pre" p={3} bg={codeOutputBg} borderRadius="md" whiteSpace="pre-wrap" 
                            wordBreak="break-all" fontSize="sm" w="full" color={stderrCodeColor} 
                            borderWidth="1px" borderColor={borderColor}>
                        {event.content.stderr}
                      </Code>
                    </Box>
                  )}
                  {!event.content.stdout && !event.content.stderr && (
                    <Text fontSize="sm" fontStyle="italic" color="gray.500">(No output)</Text>
                  )}
                </Box>
              </Collapse>
            </Box>
          )}

          {event.type === 'plot' && (
            <Box>
              <HStack spacing={2} mb={2} align="center">
                <Text fontSize="sm" fontWeight="bold" color="green.600">Generated Plot</Text>
                {event.duration && (
                  <Text fontSize="xs" color="gray.500">
                    {formatDuration(event.duration)}
                  </Text>
                )}
              </HStack>
              <Box textAlign="center">
                <Image 
                  src={event.content.url} 
                  alt={event.content.alt || 'Generated Plot'} 
                  maxW="80%" 
                  mx="auto" 
                  borderRadius="md"
                  boxShadow="sm" 
                  borderWidth="1px" 
                  borderColor={borderColor} 
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} 
                />
                <Button 
                  as="a" 
                  href={event.content.url} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  size="xs" 
                  variant="outline" 
                  mt={2} 
                  leftIcon={<ExternalLinkIcon />}
                >
                  Open Plot
                </Button>
              </Box>
            </Box>
          )}

          {event.type === 'pdb' && (
            <Box p={3} borderWidth="1px" borderRadius="md" borderColor={borderColor} bg="blue.50">
              <HStack justifyContent="space-between" mb={2} wrap="wrap">
                <HStack>
                  <Text fontSize="sm" fontWeight="bold">Generated Structure</Text>
                  {event.duration && (
                    <Text fontSize="xs" color="gray.500">
                      {formatDuration(event.duration)}
                    </Text>
                  )}
                </HStack>
                <Button 
                  as="a" 
                  href={event.content.url} 
                  download={event.content.filename} 
                  size="sm" 
                  colorScheme="blue" 
                  leftIcon={<ExternalLinkIcon />} 
                  flexShrink={0}
                >
                  Download File
                </Button>
              </HStack>
              <Text fontSize="sm" mb={1} wordBreak="break-all">File: {event.content.filename}</Text>
              <HStack spacing={2} mt={2}>
                <Button 
                  size="xs" 
                  variant="outline"
                  onClick={() => openPdbPreview(event.content.url, event.content.filename)}
                >
                  Preview File
                </Button>
              </HStack>
            </Box>
          )}

          {event.type === 'molviewspec' && (
            <Box p={3} borderWidth="1px" borderRadius="md" borderColor={borderColor} bg="green.50">
              <HStack justifyContent="space-between" mb={2} wrap="wrap">
                <HStack>
                  <Text fontSize="sm" fontWeight="bold">Interactive Molecular View</Text>
                  {event.duration && (
                    <Text fontSize="xs" color="gray.500">
                      {formatDuration(event.duration)}
                    </Text>
                  )}
                </HStack>
              </HStack>
              <Text fontSize="sm" mb={1} wordBreak="break-all">Structure: {event.content.filename}</Text>
              <HStack spacing={2} mt={2}>
                {onMolViewSpecUpdate && (
                  <Button 
                    size="xs" 
                    colorScheme="teal" 
                    onClick={() => { 
                      if (onMolViewSpecUpdate && event.content?.molviewspec) {
                        onMolViewSpecUpdate(event.content.molviewspec, event.content.filename);
                      }
                    }}
                  >
                    View in 3D
                  </Button>
                )}
              </HStack>
            </Box>
          )}

          {event.type === 'tool_start' && (
            <HStack spacing={2} align="center">
              <Text fontSize="sm" color="yellow.600">
                🔧 Running: {event.content.name}...
              </Text>
              {event.status === 'in_progress' && <Spinner size="xs" color="yellow.500" />}
            </HStack>
          )}

          {event.type === 'tool_end' && (
            <HStack spacing={2} align="center">
              <Text fontSize="sm" color="green.600">
                ✅ Completed: {event.content.name}
              </Text>
              {event.duration && (
                <Text fontSize="xs" color="gray.500">
                  {formatDuration(event.duration)}
                </Text>
              )}
            </HStack>
          )}
        </Box>
      </HStack>
    );
  };

  useEffect(() => {
    // Simple fallback: only load molviewspec from the very latest finalized message
    // if no streaming is active and it hasn't been loaded during streaming
    if (isLoading) {
      return; // Don't run while streaming is active
    }
    
    const latestMessage = messages[messages.length - 1];
    if (latestMessage && 
        latestMessage.molViewSpecInfo?.molviewspec && 
        latestMessage.role === 'assistant' && 
        !latestMessage.id && // finalized message
        onMolViewSpecUpdate) {
      console.log("Fallback: Loading MolViewSpec from latest finalized message:", latestMessage.molViewSpecInfo.filename);
      onMolViewSpecUpdate(latestMessage.molViewSpecInfo.molviewspec, latestMessage.molViewSpecInfo.filename);
    }
  }, [messages, onMolViewSpecUpdate, isLoading]);

  useEffect(() => {
    const chatContainer = chatContainerRef.current;
    if (chatContainer) {
      const isScrolledToBottom = chatContainer.scrollHeight - chatContainer.scrollTop <= chatContainer.clientHeight + 100;
      if (isScrolledToBottom || isLoading) {
        chatContainer.scrollTo({ top: chatContainer.scrollHeight, behavior: 'smooth' });
      }
    }
  }, [messages, messages[messages.length - 1]?.content, isLoading]); // Removed thinkingContent dependency

  const handlePaste = useCallback(
    (event: ClipboardEvent) => {
      if (isLoading || fileAttachment) return;
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
            setFileAttachment({ file: blob, name: fileName, previewContent: dataUrl, type: blob.type, isImage: true });
            toast({ title: 'Image Pasted', status: 'info', duration: 2000 });
          };
          reader.onerror = (error) => {
            console.error('Error reading pasted image:', error);
            toast({ title: 'Paste Error', description: 'Could not read pasted image.', status: 'error' });
          };
          reader.readAsDataURL(blob);
          event.preventDefault(); return;
        }
      }
    }, [isLoading, toast, fileAttachment]
  );

  useEffect(() => {
    const currentInput = chatInputRef.current;
    if (currentInput) currentInput.addEventListener('paste', handlePaste);
    return () => { if (currentInput) currentInput.removeEventListener('paste', handlePaste); };
  }, [handlePaste]);

  const openAttachmentModal = (attachmentData: ChatMessage['attachment']) => {
    if (attachmentData) { setModalContent(attachmentData); openModal(); }
  };

  const openPdbPreview = async (url: string, filename: string) => {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch file: ${response.statusText}`);
      }
      const content = await response.text();
      setPdbPreviewContent(content);
      setIsPdbPreviewOpen(true);
    } catch (error) {
      console.error('Error fetching PDB file:', error);
      toast({
        title: 'Error',
        description: 'Failed to load file content for preview.',
        status: 'error',
        duration: 3000,
      });
    }
  };

  const closePdbPreview = () => {
    setIsPdbPreviewOpen(false);
    setPdbPreviewContent(null);
  };

  const handleSendMessage = async () => {
    if (!input.trim() && !fileAttachment) return;
    if (!sessionId) {
      toast({ title: 'Session Error', description: 'Session ID is not available.', status: 'error', duration: 5000, isClosable: true });
      return;
    }

    const userMessageContent = input;
    const currentAttachment = fileAttachment;
    const userMessageForUI: ChatMessage = {
      role: 'user', content: userMessageContent, timestamp: new Date().toISOString(),
      attachment: currentAttachment ? {
        name: currentAttachment.name, content: currentAttachment.previewContent, type: currentAttachment.type || null,
        isImage: currentAttachment.isImage, isText: currentAttachment.isText, isCSV: currentAttachment.isCSV, isJSON: currentAttachment.isJSON,
      } : null,
    };

    const messagesWithUser = [...messages, userMessageForUI];
    setMessages(messagesWithUser);
    setInput('');
    setFileAttachment(null);
    setIsLoading(true);
    abortControllerRef.current = new AbortController();

    const assistantMessageId = `assistant-${Date.now()}`;
    const messageStartTime = Date.now();
    setMessages((prev) => [
      ...prev,
      {
        role: 'assistant', content: '', timestamp: new Date().toISOString(), id: assistantMessageId,
        codeOutput: null, plotInfo: null, pdbInfo: null, molViewSpecInfo: null,
        events: [], // Initialize empty events array
        startTime: messageStartTime, // Track when this message started
      } as ChatMessage,
    ]);

    const historyMessages = messagesWithUser
        .filter(msg => msg.role === 'user' || msg.role === 'assistant')
        .map(({ role, content }) => ({ role, content }));

    const apiPayload = {
      messages: historyMessages,
      stream: true, sessionId: sessionId,
    };

    const formData = new FormData();
    formData.append('jsonData', JSON.stringify(apiPayload));
    if (currentAttachment) {
      formData.append('file', currentAttachment.file, currentAttachment.name);
    }

    try {
      const response = await fetch(CHAT_API_ENDPOINT, {
        method: 'POST', body: formData, signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        let errorMsg = `API request failed with status ${response.status} ${response.statusText}`;
        try { const errorData = await response.json(); errorMsg = `${errorMsg}: ${errorData.error || JSON.stringify(errorData)}`; }
        catch (parseError) { try { const textError = await response.text(); errorMsg = `${errorMsg}: ${textError}`; } catch (textErr) {} }
        setMessages((prev) => prev.filter((msg) => msg.id !== assistantMessageId));
        throw new Error(errorMsg);
      }
      if (!response.body) {
        setMessages((prev) => prev.filter((msg) => msg.id !== assistantMessageId));
        throw new Error('Response body is null');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      const processSSEBuffer = () => {
        let mainContentDeltaAccumulator = '';
        let processedChars = 0;
        let currentPos = 0;
        const currentTime = Date.now();

        while (currentPos < buffer.length) {
            const newlineIndex = buffer.indexOf('\n', currentPos);
            if (newlineIndex === -1) break; // Incomplete line, wait for more data

            const line = buffer.substring(currentPos, newlineIndex).trim();
            const consumedLength = newlineIndex - currentPos + 1; // +1 for the newline itself

            if (line.startsWith('data: ')) {
                const jsonStr = line.substring(5).trim();
                if (jsonStr === '[DONE]') {
                    console.log("Received [DONE] signal.");
                } else {
                    try {
                        const parsedEvent = JSON.parse(jsonStr);
                        if (parsedEvent.type === 'text_delta' && parsedEvent.content) {
                          mainContentDeltaAccumulator += parsedEvent.content;
                          // Add text content to events chronologically
                          setMessages(prev => prev.map(m => {
                            if (m.id === assistantMessageId) {
                              const newEvents = [...(m.events || [])];
                              const lastEvent = newEvents[newEvents.length - 1];
                              if (lastEvent && lastEvent.type === 'text') {
                                // Replace the last event with a new one containing the appended text
                                const updatedEvent = { ...lastEvent, content: lastEvent.content + parsedEvent.content };
                                newEvents[newEvents.length - 1] = updatedEvent;
                              } else {
                                // Create a new text event if the last event wasn't text
                                newEvents.push({
                                  id: `text-${Date.now()}-${Math.random()}`,
                                  type: 'text',
                                  content: parsedEvent.content,
                                  timestamp: currentTime
                                });
                              }
                              return { ...m, events: newEvents };
                            }
                            return m;
                          }));
                      } else if (parsedEvent.type === 'code_output') {
                          setMessages(prev => prev.map(m => {
                            if (m.id === assistantMessageId) {
                              const newEvents = [...(m.events || [])];
                              const eventDuration = m.startTime ? currentTime - m.startTime : undefined;
                              newEvents.push({
                                id: `code-${Date.now()}-${Math.random()}`,
                                type: 'code_output',
                                content: { stdout: parsedEvent.stdout || '', stderr: parsedEvent.stderr || '', code: parsedEvent.code },
                                timestamp: currentTime,
                                duration: eventDuration
                              });
                              return { ...m, codeOutput: { stdout: parsedEvent.stdout || '', stderr: parsedEvent.stderr || '', code: parsedEvent.code }, events: newEvents };
                            }
                            return m;
                          }));
                      } else if (parsedEvent.type === 'display_plot') {
                          setMessages(prev => prev.map(m => {
                            if (m.id === assistantMessageId) {
                              const newEvents = [...(m.events || [])];
                              const plotData = { url: `${API_BASE_URL}${parsedEvent.url}`, alt: parsedEvent.alt || 'Generated Plot' };
                              const eventDuration = m.startTime ? currentTime - m.startTime : undefined;
                              newEvents.push({
                                id: `plot-${Date.now()}-${Math.random()}`,
                                type: 'plot',
                                content: plotData,
                                timestamp: currentTime,
                                duration: eventDuration
                              });
                              return { ...m, plotInfo: plotData, events: newEvents };
                            }
                            return m;
                          }));
                      } else if (parsedEvent.type === 'load_pdb') {
                          setMessages(prev => prev.map(m => {
                            if (m.id === assistantMessageId) {
                              const newEvents = [...(m.events || [])];
                              const pdbData = { url: `${API_BASE_URL}${parsedEvent.url}`, filename: parsedEvent.filename };
                              const eventDuration = m.startTime ? currentTime - m.startTime : undefined;
                              newEvents.push({
                                id: `pdb-${Date.now()}-${Math.random()}`,
                                type: 'pdb',
                                content: pdbData,
                                timestamp: currentTime,
                                duration: eventDuration
                              });
                              return { ...m, pdbInfo: pdbData, events: newEvents };
                            }
                            return m;
                          }));
                      } else if (parsedEvent.type === 'molviewspec_update') {
                          try {
                            // Validate that molviewspec is properly serializable
                            if (parsedEvent.molviewspec && typeof parsedEvent.molviewspec === 'object') {
                              setMessages(prev => prev.map(m => {
                                if (m.id === assistantMessageId) {
                                  const newEvents = [...(m.events || [])];
                                  const molviewspecData = { molviewspec: parsedEvent.molviewspec, filename: parsedEvent.filename };
                                  const eventDuration = m.startTime ? currentTime - m.startTime : undefined;
                                  newEvents.push({
                                    id: `molviewspec-${Date.now()}-${Math.random()}`,
                                    type: 'molviewspec',
                                    content: molviewspecData,
                                    timestamp: currentTime,
                                    duration: eventDuration
                                  });
                                  return { ...m, molViewSpecInfo: molviewspecData, events: newEvents };
                                }
                                return m;
                              }));
                              
                              // Immediately trigger the viewer update during streaming
                              if (onMolViewSpecUpdate && parsedEvent.molviewspec && parsedEvent.filename) {
                                console.log("Immediately loading MolViewSpec during streaming:", parsedEvent.filename);
                                try {
                                  onMolViewSpecUpdate(parsedEvent.molviewspec, parsedEvent.filename);
                                  console.log("Successfully loaded MolViewSpec during streaming");
                                } catch (error) {
                                  console.error("Error loading MolViewSpec during streaming:", error);
                                }
                              }
                            } else {
                              console.error('Invalid molviewspec data received:', parsedEvent);
                              toast({ title: 'MolViewSpec Error', description: 'Received invalid molecular visualization data', status: 'warning', duration: 3000 });
                            }
                          } catch (error) {
                            console.error('Error processing molviewspec update:', error);
                            toast({ title: 'MolViewSpec Error', description: 'Failed to process molecular visualization data', status: 'error', duration: 5000 });
                          }
                      } else if (parsedEvent.type === 'tool_start') {
                          setMessages(prev => prev.map(m => {
                            if (m.id === assistantMessageId) {
                              const newEvents = [...(m.events || [])];
                              newEvents.push({
                                id: `tool-start-${Date.now()}-${Math.random()}`,
                                type: 'tool_start',
                                content: { name: parsedEvent.name },
                                timestamp: currentTime,
                                status: 'in_progress' as const
                              });
                              return { ...m, events: newEvents };
                            }
                            return m;
                          }));
                      } else if (parsedEvent.type === 'tool_end') {
                          setMessages(prev => prev.map(m => {
                            if (m.id === assistantMessageId) {
                              const newEvents = [...(m.events || [])];
                              // Find the corresponding tool_start event to calculate duration
                              const toolStartEvent = newEvents.find(e => 
                                e.type === 'tool_start' && e.content.name === parsedEvent.name
                              );
                              const toolDuration = toolStartEvent ? currentTime - toolStartEvent.timestamp : undefined;
                              
                              // Update the tool_start event status
                              const updatedEvents = newEvents.map(e => 
                                e.type === 'tool_start' && e.content.name === parsedEvent.name
                                  ? { ...e, status: 'completed' as const, duration: toolDuration }
                                  : e
                              );
                              
                              // Add tool_end event
                              updatedEvents.push({
                                id: `tool-end-${Date.now()}-${Math.random()}`,
                                type: 'tool_end',
                                content: { name: parsedEvent.name },
                                timestamp: currentTime,
                                duration: toolDuration,
                                status: 'completed' as const
                              });
                              
                              return { ...m, events: updatedEvents };
                            }
                            return m;
                          }));
                      } else if (parsedEvent.type === 'error') {
                          console.error("Backend Stream Error:", parsedEvent.message);
                          
                          // Check if it's a molviewspec serialization error
                          if (parsedEvent.message && parsedEvent.message.includes('Object of type State is not JSON serializable')) {
                            toast({ 
                              title: 'MolViewSpec Generation Error', 
                              description: 'The molecular visualization could not be generated due to a serialization issue. Please try again.', 
                              status: 'warning', 
                              duration: 5000, 
                              isClosable: true 
                            });
                          } else {
                            toast({ 
                              title: 'Backend Error', 
                              description: parsedEvent.message || 'An unknown error occurred.', 
                              status: 'error', 
                              duration: 5000, 
                              isClosable: true 
                            });
                          }
                          
                          const errorSystemMessage: ChatMessage = { // Ensure this also conforms
                              id: `error-${Date.now()}`, 
                              role: 'system', 
                              content: `Error: ${parsedEvent.message}`, 
                              timestamp: new Date().toISOString(), 
                              isError: true 
                          };
                          setMessages(prev => [...prev, errorSystemMessage]);
                      }
                    } catch (e) { console.error('Failed to parse SSE data line:', jsonStr, e); }
                }
            } else if (line !== '') { // Non-empty, non-data line
                 console.warn("Received non-data SSE line:", line);
            }
            // else: empty line, often used as SSE message separator, just consume.

            processedChars += consumedLength;
            currentPos += consumedLength;
        }

        buffer = buffer.substring(processedChars); // Keep unprocessed part of the buffer
        return { mainContentDelta: mainContentDeltaAccumulator };
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          buffer += decoder.decode(); // Flush any remaining bytes from decoder
          const { mainContentDelta: finalMainDelta } = processSSEBuffer(); // Process final buffer content
          if (finalMainDelta) {
            // Don't update the main content field since we're using events for chronological display
            // setMessages(prev => prev.map(m => m.id === assistantMessageId ? { ...m, content: (m.content || '') + finalMainDelta } : m));
          }
          console.log("Stream finished");
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const { mainContentDelta } = processSSEBuffer();

        if (mainContentDelta) {
          // Don't update the main content field since we're using events for chronological display
          // setMessages(prev => prev.map(m => m.id === assistantMessageId ? { ...m, content: (m.content || '') + mainContentDelta } : m));
        }
      }

      setMessages(prevMessages =>
        prevMessages.map(msg => {
          if (msg.id === assistantMessageId) {
            const { id, ...finalizedMsg } = msg; // Remove id but keep events
            return {
              ...finalizedMsg,
              // Ensure content is properly set from events for consistency
              content: finalizedMsg.events
                ?.filter(e => e.type === 'text')
                .map(e => e.content)
                .join('') || ''
            };
          }
          return msg;
        })
      );

    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log('Fetch aborted');
        toast({ title: 'Request Cancelled', status: 'info', duration: 2000 });
        setMessages((prev) => prev.filter((msg) => msg.id !== assistantMessageId));
      } else {
        console.error('Error handling stream or sending message:', error);
        toast({ title: 'Chat Error', description: error.message || 'Failed to communicate with the server.', status: 'error', duration: 5000, isClosable: true });
        setMessages((prev) => prev.filter((msg) => msg.id !== assistantMessageId));
        setMessages((prev) => [...prev, { role: 'system', content: `Error: ${error.message || 'Failed to get response.'}`, timestamp: new Date().toISOString(), isError: true }]);
      }
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      const fileType = file.type;
      const isImage = fileType.startsWith('image/');
      const isText = fileType.startsWith('text/') || /\.(pdb|cif|py|txt|md)$/i.test(file.name);
      const isCSV = fileType === 'text/csv' || file.name.endsWith('.csv');
      const isJSON = fileType === 'application/json' || file.name.endsWith('.json');

      reader.onload = (event) => {
        const result = event.target?.result;
        setFileAttachment({ file, name: file.name, previewContent: typeof result === 'string' ? result : null, type: fileType, isImage, isText, isCSV, isJSON });
      };
      reader.onerror = (error) => {
        console.error('File reading error:', error);
        toast({ title: 'File Error', description: 'Could not read the selected file.', status: 'error' });
      };

      if (isImage) reader.readAsDataURL(file);
      else if (isText || isCSV || isJSON) reader.readAsText(file.slice(0, 10 * 1024));
      else setFileAttachment({ file, name: file.name, previewContent: null, type: fileType });
    }
    if (e.target) e.target.value = '';
  };

  const handleFileAttach = () => fileInputRef.current?.click();
  const removeAttachment = () => {
    setFileAttachment(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };
  const toggleCodeOutput = (messageKey: string) => setCodeOutputVisible((prev) => ({ ...prev, [messageKey]: !prev[messageKey] }));
  const cancelRequest = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      console.log("Request cancellation initiated.");
    }
  };

  return (
    <Flex direction="column" h="100%" bg={chatBg}>
      <Box ref={chatContainerRef} flex="1" overflowY="auto" p={4} position="relative">
        {messages.length === 0 && !isLoading ? (
          <Flex position="absolute" top="0" left="0" right="0" bottom="0" align="center" justify="center" direction="column" textAlign="center" p={4} pointerEvents="none">
            <Heading size="lg" mb={2} color={welcomeHeadingColor}>GlycoShape Copilot</Heading>
            <Text fontSize="xl" color={welcomeTextColor}>What can I help with?</Text>
            <Text fontSize="sm" color="gray.500" mt={4}>(Ask about proteins, use tools, upload files, or paste images)</Text>
          </Flex>
        ) : (
          <VStack spacing={4} align="stretch">
            {messages.map((msg, idx) => {
              const messageKey = `${msg.role}-${msg.timestamp}-${idx}${msg.id ? `-${msg.id}` : ''}`;
              if (msg.role === 'system' && !msg.isError) return null;

              const isEmptyPlaceholder = msg.role === 'assistant' && msg.id &&
                                        (!msg.events || msg.events.length === 0) && isLoading;
              if (isEmptyPlaceholder) return null;

              let msgBg = assistantMessageBg, justify = 'flex-start';
              if (msg.role === 'user') { msgBg = userMessageBg; justify = 'flex-end'; }
              else if (msg.role === 'tool_info') { msgBg = msg.toolStatus?.status === 'error' ? errorMessageBg : toolInfoMessageBg; }
              else if (msg.isError && msg.role === 'system') { msgBg = errorMessageBg; }

              return (
                <Flex key={messageKey} justify={justify} w="100%">
                  <Box maxW={{ base: '90%', md: '80%' }} bg={msgBg} px={4} py={2} borderRadius="lg" boxShadow="sm"
                       className="chat-message-content" w={msg.role === 'assistant' ? { base: '90%', md: '80%' } : 'auto'}>
                    
                    {msg.role === 'user' && msg.attachment && (
                      <Button variant="link" size="sm" onClick={() => openAttachmentModal(msg.attachment)} mb={2}
                              p={0} height="auto" _hover={{ textDecoration: 'none' }} w="full" display="block" textAlign="left">
                        <HStack spacing={2} p={2} bg={attachmentBg} borderRadius="md" w="full">
                          <AttachmentIcon boxSize="1em" />
                          <Text fontSize="sm" noOfLines={1} title={msg.attachment.name}>Attached: {msg.attachment.name}</Text>
                        </HStack>
                      </Button>
                    )}

                    {/* Render Content Chronologically */}
                    {msg.role === 'assistant' && msg.events && msg.events.length > 0 ? (
                      // For assistant messages with events, render chronologically with timeline
                      <Box>
                        {msg.events.map((event, idx) => (
                          <EventRenderer 
                            key={event.id || `event-${idx}`} 
                            event={event} 
                            messageKey={messageKey}
                            onMolViewSpecUpdate={onMolViewSpecUpdate}
                            isLast={idx === msg.events!.length - 1}
                          />
                        ))}
                      </Box>
                    ) : msg.role === 'assistant' && msg.id ? (
                      // For streaming assistant messages without events yet, show nothing (events will populate)
                      null
                    ) : (
                      // For non-assistant messages or finalized messages, render content normally
                      msg.content && msg.content.trim() && (
                        <Box className="markdown-container">
                          <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                            {msg.content}
                          </ReactMarkdown>
                        </Box>
                      )
                    )}

                    {msg.role === 'tool_info' && msg.toolStatus && (
                         <HStack spacing={2} align="center" mt={1}>
                            {msg.toolStatus.status === 'running' && <Spinner size="xs" />}
                            {msg.toolStatus.status === 'finished' && <CheckIcon color="green.500" />}
                            {msg.toolStatus.status === 'error' && <Icon as={CloseIcon} color="red.500" />}
                            <Text fontSize="sm" fontStyle="italic" color={attachmentTextColor}>{msg.content}</Text>
                         </HStack>
                    )}
                    {msg.role === 'system' && msg.isError && (
                         <Alert status="error" variant="subtle" mt={2} borderRadius="md">
                            <AlertIcon /><AlertDescription fontSize="sm">{msg.content}</AlertDescription>
                         </Alert>
                    )}

                    {msg.role !== 'tool_info' && !(msg.role === 'system' && msg.isError) && (
                        <Text fontSize="xs" color={attachmentTextColor} mt={1} textAlign="right">
                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </Text>
                    )}
                  </Box>
                </Flex>
              );
            })}
            {/* Simplified Loading indicator */}
            {isLoading && messages.some(msg => msg.id && msg.role === 'assistant') && (
                 <Flex justify="center" my={4}>
                    <HStack>
                        <Spinner size="sm" color="blue.500" />
                        <Text fontSize="sm" color="gray.500">Assistant is responding...</Text>
                        <Button size="xs" variant="outline" onClick={cancelRequest} colorScheme="red" isDisabled={!abortControllerRef.current}>
                            Cancel
                        </Button>
                    </HStack>
                 </Flex>
            )}
          </VStack>
        )}
      </Box>

      <Box p={4} borderTop="1px solid" borderColor={borderColor}>
        {fileAttachment && (
          <HStack mb={2} p={2} bg={inputAttachmentBg} borderRadius="md" justify="space-between">
            <HStack spacing={2} overflow="hidden" align="center" maxW="calc(100% - 40px)">
              {fileAttachment.isImage && typeof fileAttachment.previewContent === 'string' ? (
                <img src={fileAttachment.previewContent} alt="Preview" style={{ maxHeight: '32px', maxWidth: '80px', borderRadius: '4px', objectFit: 'cover' }} />
              ) : ( <AttachmentIcon /> )}
              <Text fontSize="sm" isTruncated title={fileAttachment.name}>{fileAttachment.name}</Text>
            </HStack>
            <Tooltip label="Remove attachment" placement="top">
              <IconButton aria-label="Remove file" icon={<CloseIcon boxSize={2.5}/>} size="xs" variant="ghost" onClick={removeAttachment} isRound />
            </Tooltip>
          </HStack>
        )}
        <Flex align="center">
          <input type="file" ref={fileInputRef} style={{ display: 'none' }} onChange={handleFileChange} accept="image/*, text/*, .pdb, .cif, .py, .csv, .json, .md" />
          <Tooltip label="Attach file" placement="top">
            <IconButton aria-label="Attach file" icon={<AttachmentIcon />} onClick={handleFileAttach} mr={2} variant="ghost" isDisabled={isLoading || !!fileAttachment} />
          </Tooltip>
          <Input ref={chatInputRef} placeholder="Ask about proteins, analyze data, or generate structures..." value={input}
                 onChange={(e) => setInput(e.target.value)}
                 onKeyPress={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); if (!isLoading) handleSendMessage(); }}}
                 flex="1" bg={inputBg} isDisabled={isLoading} mr={2} borderRadius="full" size="md" />
          <Tooltip label={isLoading ? "Cancel Request" : "Send message"} placement="top">
             {isLoading ? (
                  <IconButton aria-label="Cancel request" icon={<CloseIcon />} colorScheme="red" onClick={cancelRequest}
                              isLoading={false} isDisabled={!abortControllerRef.current} borderRadius="full" size="md" />
             ) : (
                 <IconButton aria-label="Send message" icon={<Icon as={PaperPlane} />} colorScheme="blue" onClick={handleSendMessage}
                              isLoading={false} isDisabled={isLoading || (!input.trim() && !fileAttachment)} borderRadius="full" size="md" />
             )}
          </Tooltip>
        </Flex>
      </Box>

      <Modal isOpen={isModalOpen} onClose={closeModal} size="xl" isCentered scrollBehavior="inside">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader title={modalContent?.name} isTruncated>{modalContent?.name || 'Attachment'}</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            {modalContent?.isImage && typeof modalContent.content === 'string' ? (
              <Image src={modalContent.content} alt={modalContent.name || 'Image attachment'} maxW="100%" mx="auto" display="block"/>
            ) : modalContent?.isJSON && typeof modalContent.content === 'string' ? (
              <Code as="pre" whiteSpace="pre-wrap" wordBreak="break-all" p={3} bg={inputBg} borderRadius="md" maxH="60vh" overflowY="auto" borderWidth="1px" borderColor={borderColor}>
                {(() => { try { return JSON.stringify(JSON.parse(modalContent.content), null, 2); } catch (e) { return modalContent.content; }})()}
              </Code>
            ) : (modalContent?.isText || modalContent?.isCSV) && typeof modalContent.content === 'string' ? (
               <Code as="pre" whiteSpace="pre-wrap" wordBreak="break-all" p={3} bg={inputBg} borderRadius="md" maxH="60vh" overflowY="auto" borderWidth="1px" borderColor={borderColor}>{modalContent.content}</Code>
            ) : ( <Text color="gray.500">Preview not available for this file type ({modalContent?.type || 'unknown'}).</Text> )}
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* PDB File Preview Modal */}
      <Modal isOpen={isPdbPreviewOpen} onClose={closePdbPreview} size="xl" isCentered scrollBehavior="inside">
        <ModalOverlay />
        <ModalContent maxH="80vh">
          <ModalHeader>Structure File Preview</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            {pdbPreviewContent ? (
              <Code 
                as="pre" 
                whiteSpace="pre-wrap" 
                wordBreak="break-all" 
                p={3} 
                bg={codeOutputBg} 
                borderRadius="md" 
                maxH="60vh" 
                overflowY="auto" 
                borderWidth="1px" 
                borderColor={borderColor}
                fontSize="xs"
                fontFamily="monospace"
                lineHeight="1.2"
              >
                {pdbPreviewContent}
              </Code>
            ) : (
              <Box textAlign="center" py={8}>
                <Spinner size="lg" />
                <Text mt={2} color="gray.500">Loading file content...</Text>
              </Box>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </Flex>
  );
};


const App: React.FC = () => {
  const [molViewerRef, setMolViewerRef] = useState<any>(null);

  const theme = extendTheme({
    styles: {
      global: { 
        body: { bg: 'gray.50', color: 'gray.800', },
         '::-webkit-scrollbar': { width: '8px', height: '8px', },
        '::-webkit-scrollbar-track': { background: '#f1f1f1', },
        '::-webkit-scrollbar-thumb': { background: '#c1c1c1', borderRadius: '4px', },
        '::-webkit-scrollbar-thumb:hover': { background: '#a8a8a8', }
      },
    },
     components: {
        Code: { baseStyle: { bg: 'gray.100', px: '0.2em', py: '0.1em', borderRadius: 'sm', fontFamily: 'monospace', fontSize: '0.875em', }}
    }
  });

  const handleMolViewSpecUpdate = useCallback((molviewspec: any, filename: string) => {
    console.log(`[App] handleMolViewSpecUpdate called with filename: ${filename}`);
    if (molViewerRef && molViewerRef.plugin) {
      try {
        // Validate the molviewspec data before processing
        if (!molviewspec || typeof molviewspec !== 'object') {
          console.error('Invalid molviewspec data:', molviewspec);
          return;
        }

        // Ensure the data is properly formatted for MolViewSpec
        let mvsData;
        if (typeof molviewspec === 'string') {
          // If it's a string, try to parse it
          mvsData = (window as any).molstar.PluginExtensions.mvs.MVSData.fromMVSJ(molviewspec);
        } else {
          // If it's an object, stringify it first
          mvsData = (window as any).molstar.PluginExtensions.mvs.MVSData.fromMVSJ(JSON.stringify(molviewspec));
        }
        
        (window as any).molstar.PluginExtensions.mvs.loadMVS(molViewerRef.plugin, mvsData, { 
          sourceUrl: `data:${filename}`, 
          sanityChecks: true, 
          replaceExisting: true 
        });
      } catch (error) {
        console.error('Error loading MolViewSpec:', error);
        // You could add a toast notification here if you want to show the error to the user
      }
    } else {
      console.warn('MolViewer not initialized yet, cannot load MolViewSpec');
    }
  }, [molViewerRef]);

  useEffect(() => {
    // Load Molstar scripts dynamically
    const loadMolstar = async () => {
      // Check if Molstar is already loaded
      if ((window as any).molstar) {
        initializeViewer();
        return;
      }

      // Load CSS
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.type = 'text/css';
      // link.href = 'https://cdn.jsdelivr.net/npm/molstar@latest/build/viewer/molstar.css';
      link.href = '/viewer3/molstar.css';
      document.head.appendChild(link);

      // Load JS
      const script = document.createElement('script');
      // script.src = 'https://cdn.jsdelivr.net/npm/molstar@latest/build/viewer/molstar.js';
      script.src = '/viewer3/molstar.js';
      script.onload = () => {
        initializeViewer();
      };
      document.head.appendChild(script);
    };

    const initializeViewer = () => {
      if ((window as any).molstar) {
        (window as any).molstar.Viewer
          .create('molstar-viewer', { 
            layoutIsExpanded: false, 
            layoutShowControls: false,
            layoutShowLeftPanel: true,
          })
          .then((viewer: any) => {
            console.log('Molstar viewer initialized');
            setMolViewerRef(viewer);
          })
          .catch((error: any) => {
            console.error('Error initializing Molstar viewer:', error);
          });
      }
    };

    loadMolstar();
  }, []);
  
  return (
    <ChakraProvider theme={theme}>
      <Flex direction="column" minH="100%" maxH="100%" bg='gray.50'>
        <Flex flex="1" direction={{ base: 'column', lg: 'row' }} overflow="hidden" height="calc(100vh - 0px)">
          <Box flex={{ base: '1', lg: 3 }} p={{ base: 0.1, md: 0 }}
               borderRightWidth={{ base: '0', lg: '1px' }} borderBottomWidth={{ base: '1px', lg: '0' }}
               borderColor='gray.200' minH={{ base: '40vh', md: '50vh', lg: 'auto' }}
               position="relative" overflow="hidden">
             <Box 
               id="molstar-viewer" 
               h="100%" 
               w="100%" 
               bg="white" 
               borderRadius="md" 
               borderWidth="1px" 
               borderColor="gray.300"
               position="relative"
               zIndex={10}
             />
             {!molViewerRef && (
               <Flex 
                 position="absolute" 
                 top="0" 
                 left="0" 
                 right="0" 
                 bottom="0" 
                 align="center" 
                 justify="center" 
                 bg="white" 
                 color="gray.500"
                 borderRadius="md"
               >
                 <VStack spacing={2}>
                   <Spinner size="lg" />
                   <Text>Loading Molstar Viewer...</Text>
                 </VStack>
               </Flex>
             )}
          </Box>
          <Box flex={{ base: '1', lg: 2 }} display="flex" flexDirection="column"
               h={{ base: 'auto', lg: 'calc(100vh - 68px)' }} overflow="hidden">
            <BackendChat onMolViewSpecUpdate={handleMolViewSpecUpdate} />
          </Box>
        </Flex>
      </Flex>
    </ChakraProvider>
  );
};

export default App;
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
import MolstarApp from './MolstarApp'; 
import Latex from 'react-latex-next';
import 'katex/dist/katex.min.css';
import ReactMarkdown, { Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { v4 as uuidv4 } from 'uuid';

const SYSTEM_PROMPT = 
`You are GlycoShape Copilot, an expert assistant specializing in protein structures, glycosylation, and bioinformatics.
`;

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
  toolStatus?: ToolStatus | null;
  isError?: boolean;
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
  onLoadStructureUrl?: (url: string) => void;
}> = ({ onLoadStructureUrl }) => {
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

  useEffect(() => {
    const latestPdbMessage = [...messages].reverse()
      .find(msg => msg.pdbInfo?.url && msg.role === 'assistant' && !msg.id);
    if (latestPdbMessage?.pdbInfo?.url && onLoadStructureUrl) {
      console.log("Autoloading PDB from finalized message:", latestPdbMessage.pdbInfo.url);
      onLoadStructureUrl(latestPdbMessage.pdbInfo.url);
    }
  }, [messages, onLoadStructureUrl]);

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
    setMessages((prev) => [
      ...prev,
      {
        role: 'assistant', content: '', timestamp: new Date().toISOString(), id: assistantMessageId,
        codeOutput: null, plotInfo: null, pdbInfo: null,
      } as ChatMessage,
    ]);

    const historyMessages = messagesWithUser
        .filter(msg => msg.role === 'user' || msg.role === 'assistant')
        .map(({ role, content }) => ({ role, content }));

    const apiPayload = {
      messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...historyMessages],
      temperature: 0.7, max_tokens: 2048, stream: true, sessionId: sessionId,
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
                      } else if (parsedEvent.type === 'code_output') {
                          setMessages(prev => prev.map(m => m.id === assistantMessageId ? { ...m, codeOutput: { stdout: parsedEvent.stdout || '', stderr: parsedEvent.stderr || '', code: parsedEvent.code } } : m));
                      } else if (parsedEvent.type === 'display_plot') {
                          setMessages(prev => prev.map(m => m.id === assistantMessageId ? { ...m, plotInfo: { url: `${API_BASE_URL}${parsedEvent.url}`, alt: parsedEvent.alt || 'Generated Plot' } } : m));
                      } else if (parsedEvent.type === 'load_pdb') {
                          setMessages(prev => prev.map(m => m.id === assistantMessageId ? { ...m, pdbInfo: { url: `${API_BASE_URL}${parsedEvent.url}`, filename: parsedEvent.filename } } : m));
                      } else if (parsedEvent.type === 'tool_start') {
                          const toolStartMessage: ChatMessage = {
                            id: `tool-${parsedEvent.name}-${Date.now()}`,
                            role: 'tool_info',
                            content: `Running tool: ${parsedEvent.name}...`,
                            timestamp: new Date().toISOString(),
                            toolStatus: { name: parsedEvent.name, status: 'running' as const }, // Applied 'as const'
                            // Optional fields like attachment, codeOutput, etc., will be undefined, which is fine.
                          };
                          setMessages(prev => [...prev, toolStartMessage]);
                      } else if (parsedEvent.type === 'tool_end') {
                          setMessages(prev =>
                              prev.map((msg: ChatMessage): ChatMessage => { // Explicitly typed map callback
                                  if (msg.role === 'tool_info' && msg.toolStatus?.name === parsedEvent.name && msg.toolStatus?.status === 'running') {
                                      return {
                                          ...msg,
                                          content: `Tool finished: ${parsedEvent.name}`,
                                          toolStatus: { name: parsedEvent.name, status: 'finished' as const } // Applied 'as const'
                                      };
                                  }
                                  return msg;
                              }).filter((msg: ChatMessage) => // Explicitly typed filter callback parameter
                                  !(msg.role === 'tool_info' &&
                                    msg.toolStatus?.name === parsedEvent.name &&
                                    msg.toolStatus?.status === 'finished')
                              )
                          );
                      } else if (parsedEvent.type === 'error') {
                          console.error("Backend Stream Error:", parsedEvent.message);
                          toast({ title: 'Backend Error', description: parsedEvent.message || 'An unknown error occurred.', status: 'error', duration: 5000, isClosable: true });
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
            setMessages(prev => prev.map(m => m.id === assistantMessageId ? { ...m, content: (m.content || '') + finalMainDelta } : m));
          }
          console.log("Stream finished");
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const { mainContentDelta } = processSSEBuffer();

        if (mainContentDelta) {
          setMessages(prev => prev.map(m => m.id === assistantMessageId ? { ...m, content: (m.content || '') + mainContentDelta } : m));
        }
      }

      setMessages(prevMessages =>
        prevMessages.map(msg => {
          if (msg.id === assistantMessageId) {
            const { id, ...finalizedMsg } = msg; // Remove id
            return finalizedMsg;
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
                                        !msg.content?.trim() &&
                                        !msg.codeOutput && !msg.plotInfo && !msg.pdbInfo && isLoading;
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

                    {/* Render Main Content  */}
                    {msg.content && msg.content.trim() && (
                        <Box className="markdown-container">
                            <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                            {msg.content}
                            </ReactMarkdown>
                        </Box>
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

                    {msg.codeOutput && (
                      <Box mt={3}>
                        <HStack spacing={2} width="100%" justifyContent="space-between" minH="16px" mb={1} cursor="pointer" onClick={() => toggleCodeOutput(messageKey)}>
                          <Text fontSize="xs" fontWeight="bold" color="gray.600">Code Execution:</Text>
                          <Button size="xs" variant="ghost" height="16px" minWidth="20px" p={0}
                                  aria-label={codeOutputVisible[messageKey] ? "Collapse Code Output" : "Expand Code Output"}>
                            {codeOutputVisible[messageKey] ? <ChevronUpIcon /> : <ChevronDownIcon />}
                          </Button>
                        </HStack>
                        <Collapse in={codeOutputVisible[messageKey]} animateOpacity style={{width: '100%'}}>
                          <Box pt={2}>
                            {msg.codeOutput.code && (
                              <Box mb={3}>
                                <Text fontSize="sm" fontWeight="bold" mb={1}>Executed Code:</Text>
                                <CodeBlock className="language-python">{msg.codeOutput.code}</CodeBlock>
                              </Box>
                            )}
                            {(msg.codeOutput.stdout || msg.codeOutput.stderr) && (<Text fontSize="sm" fontWeight="bold" mb={1}>Code Output:</Text>)}
                            {msg.codeOutput.stdout && (
                              <Box mb={msg.codeOutput.stderr ? 2 : 0}>
                                <Text fontSize="xs" color="gray.500" mb={1}>STDOUT:</Text>
                                <Code as="pre" p={3} bg={codeOutputBg} borderRadius="md" whiteSpace="pre-wrap" wordBreak="break-all" fontSize="sm" w="full" borderWidth="1px" borderColor={borderColor}>{msg.codeOutput.stdout}</Code>
                              </Box>
                            )}
                            {msg.codeOutput.stderr && (
                              <Box>
                                  <Text fontSize="xs" color={stderrColor} mb={1}>STDERR:</Text>
                                  <Code as="pre" p={3} bg={codeOutputBg} borderRadius="md" whiteSpace="pre-wrap" wordBreak="break-all" fontSize="sm" w="full" color={stderrCodeColor} borderWidth="1px" borderColor={borderColor}>{msg.codeOutput.stderr}</Code>
                              </Box>
                            )}
                            {!msg.codeOutput.code && !msg.codeOutput.stdout && !msg.codeOutput.stderr && (<Text fontSize="sm" fontStyle="italic" color="gray.500">(No output)</Text>)}
                          </Box>
                        </Collapse>
                      </Box>
                    )}

                    {msg.plotInfo && msg.plotInfo.url && (
                      <Box mt={3} textAlign="center">
                        <Text fontSize="sm" fontWeight="bold" mb={2}>Generated Plot:</Text>
                        <Image src={msg.plotInfo.url} alt={msg.plotInfo.alt || 'Generated Plot'} maxW="80%" mx="auto" borderRadius="md"
                               boxShadow="sm" borderWidth="1px" borderColor={borderColor} onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                         <Button as="a" href={msg.plotInfo.url} target="_blank" rel="noopener noreferrer" size="xs" variant="outline" mt={2} leftIcon={<ExternalLinkIcon />}>Open Plot</Button>
                      </Box>
                    )}

                    {msg.pdbInfo && msg.pdbInfo.url && msg.pdbInfo.filename && (
                       <Box mt={3} p={3} borderWidth="1px" borderRadius="md" borderColor={borderColor} bg="blue.50">
                        <HStack justifyContent="space-between" mb={2} wrap="wrap">
                          <Text fontSize="sm" fontWeight="bold">Generated Structure</Text>
                          <Button as="a" href={msg.pdbInfo.url} download={msg.pdbInfo.filename} size="sm" colorScheme="blue" leftIcon={<ExternalLinkIcon />} flexShrink={0}>Download File</Button>
                        </HStack>
                        <Text fontSize="sm" mb={1} wordBreak="break-all">File: {msg.pdbInfo.filename}</Text>
                        <HStack spacing={2} mt={2}>
                          {onLoadStructureUrl && (<Button size="xs" colorScheme="teal" onClick={() => { if (onLoadStructureUrl && msg.pdbInfo?.url) onLoadStructureUrl(msg.pdbInfo.url); }}>View in 3D</Button>)}
                          <Button as="a" href={msg.pdbInfo.url} target="_blank" rel="noopener noreferrer" size="xs" variant="outline">Preview File</Button>
                        </HStack>
                       </Box>
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
    </Flex>
  );
};


const App: React.FC = () => {
  const [structureUrl, setStructureUrl] = useState<string | null>(null);

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

  const handleLoadStructureUrl = useCallback((url: string) => {
    console.log(`[App] handleLoadStructureUrl called with URL: ${url}`);
    setStructureUrl(url);
  }, []);
  
  useEffect(() => {
    console.log(`[App] structureUrl state updated to: ${structureUrl}`);
  }, [structureUrl]);

  // Dummy MolstarApp component for placeholder if not available
  const MolstarAppPlaceholder: React.FC<{ urls: any[], backgroundColor: string }> = ({ urls, backgroundColor }) => (
    <Flex align="center" justify="center" h="100%" bg={backgroundColor} borderWidth="1px" borderColor="gray.300" borderRadius="md">
      <Text color="gray.500">
        Molstar Viewer Placeholder
        {urls.length > 0 && <Text fontSize="sm">Loading: {urls[0].url}</Text>}
      </Text>
    </Flex>
  );


  const molstarUrls = React.useMemo(() => {
    if (structureUrl) {
      const format = structureUrl.toLowerCase().includes('.cif') ? 'cif' : 'pdb';
      return [{ url: structureUrl, format: format as 'cif' | 'pdb', isBinary: false }];
    }
    return [];
  }, [structureUrl]);

  return (
    <ChakraProvider theme={theme}>
      <Flex direction="column" minH="100%" maxH="100%" bg='gray.50'>
        <Flex flex="1" direction={{ base: 'column', lg: 'row' }} overflow="hidden" height="calc(100vh - 0px)"> {/* Assuming no header, adjust if header exists */}
          <Box flex={{ base: '1', lg: 3 }} p={{ base: 2, md: 4 }}
               borderRightWidth={{ base: '0', lg: '1px' }} borderBottomWidth={{ base: '1px', lg: '0' }}
               borderColor='gray.200' minH={{ base: '40vh', md: '50vh', lg: 'auto' }}
               position="relative" overflow="hidden">
             {(structureUrl || molstarUrls.length > 0) ? ( // Adjusted condition slightly
                 <MolstarApp
                    key={structureUrl /* || proteinPdbId */}
                    urls={molstarUrls}
                    backgroundColor='#FFFFFF' 
                 />
             ) : (
                <Flex h="100%" align="center" justify="center" color="gray.500">
                    <Text>Load or generate a protein structure using the chat.</Text>
                </Flex>
             )}
          </Box>
          <Box flex={{ base: '1', lg: 2 }} display="flex" flexDirection="column"
               h={{ base: 'auto', lg: 'calc(100vh - 68px)' }} overflow="hidden">
            <BackendChat onLoadStructureUrl={handleLoadStructureUrl} />
          </Box>
        </Flex>
      </Flex>
    </ChakraProvider>
  );
};

export default App;
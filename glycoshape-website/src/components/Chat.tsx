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
  attachment?: string | null;
}

interface FileAttachment {
  name: string;
  content: string | ArrayBuffer | null;
  type?: string; 
  isImage?: boolean; // Optional: to check if the file is an image
  isText?: boolean; // Optional: to check if the file is a text file
  isBinary?: boolean; // Optional: to check if the file is binary file
  isCSV?: boolean; // Optional: to check if the file is a CSV file
  isJSON?: boolean; // Optional: to check if the file is JSON file
  isPDB?: boolean; // Optional: to check if the file is PDB file
  isCIF?: boolean; // Optional: to check if the file is CIF file
}

// --- Define outside component if they don't use hooks ---
const latexDelimiters = [
    { left: '$$', right: '$$', display: true },
    { left: '$', right: '$', display: false },
    { left: '\\(', right: '\\)', display: false },
    { left: '\\[', right: '\\]', display: true }
];

// --- System Prompt Definition ---
const SYSTEM_PROMPT = `You are GlycoShape Copilot, an expert assistant specializing in protein structures, glycosylation, and bioinformatics.
You can:
- Answer questions about protein structures, PDB files, and glycosylation.
- **IMPORTANT:** When the user asks to load, fetch, or view a protein using a PDB ID (e.g., "fetch 1aqg", "load 2hhd"), ALWAYS include the special command <load_protein>XXXX</load_protein> somewhere in your response, where XXXX is the 4-character PDB ID in uppercase. This tag will be processed by the system but won't be displayed to the user. You dont need to explain the things about the protein just explain what you did.
- Don't provide makeup information or opinions. Stick to factual information and data. Tell user about what you doing for them in cheerful way
- If you don't know the answer, say "I don't know" or "I'm not sure".
- Don't provide additional information or context unless explicitly asked.
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
  const chatInputRef = useRef<HTMLInputElement>(null); // Ref for the input element

  // --- Color mode values (ALL hooks called unconditionally here) ---
  const userMessageBg = useColorModeValue('blue.100', 'blue.600');
  const systemMessageBg = useColorModeValue('gray.200', 'gray.600'); // Keep for potential future use if needed
  const assistantMessageBg = useColorModeValue('gray.100', 'gray.700');
  const chatBg = useColorModeValue('gray.50', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const inputBg = useColorModeValue('white', 'gray.700');
  const attachmentBg = useColorModeValue("blackAlpha.100", "whiteAlpha.100");
  const attachmentTextColor = useColorModeValue("gray.600", "gray.400");
  const inputAttachmentBg = useColorModeValue("gray.100", "gray.600");
  const thinkingBg = useColorModeValue("whiteAlpha.500", "blackAlpha.300");
  // Colors for the welcome text
  const welcomeHeadingColor = useColorModeValue('gray.600', 'gray.400');
  const welcomeTextColor = useColorModeValue('gray.500', 'gray.500');
  // --- End Color mode values ---

  // --- Custom Renderers ---

  const MarkdownParagraph: React.FC<React.PropsWithChildren<{}>> = ({ children }) => {
      return (
          <Text as="p" mb={2}>
              <Latex delimiters={latexDelimiters}>
                  {React.Children.toArray(children).map(child =>
                      typeof child === 'string' ? child : (child as React.ReactElement).props.children
                  ).join('')}
              </Latex>
          </Text>
      );
  };

  const CodeBlock: React.FC<any> = ({ node, inline, className, children, ...props }) => {
    const { hasCopied, onCopy } = useClipboard(String(children).replace(/\n$/, ''));
    const match = /language-(\w+)/.exec(className || '');
    const language = match ? match[1] : undefined;
    const codeStyle = useColorModeValue(oneLight, oneDark);
    const inlineBg = useColorModeValue("gray.100", "gray.700");

    return !inline ? (
      <Box position="relative" my={4} className="code-block">
        <SyntaxHighlighter style={codeStyle} language={language} PreTag="div" {...props}>
          {String(children).replace(/\n$/, '')}
        </SyntaxHighlighter>
        <Tooltip label={hasCopied ? "Copied!" : "Copy code"} placement="top">
          <IconButton
            aria-label="Copy code"
            icon={hasCopied ? <CheckIcon /> : <CopyIcon />}
            size="sm"
            position="absolute"
            top="0.5rem"
            right="0.5rem"
            onClick={onCopy}
            variant="ghost"
            colorScheme={hasCopied ? "green" : "gray"}
          />
        </Tooltip>
      </Box>
    ) : (
      <Text as="code" px={1} py={0.5} bg={inlineBg} borderRadius="sm" fontSize="sm" fontFamily="monospace" {...props}>
        {children}
      </Text>
    );
  };

  // --- Define markdownComponents HERE, after renderers are defined ---
  const markdownComponents: Components = {
      p: MarkdownParagraph,
      code: CodeBlock,
  };
  // --- End Custom Renderers ---


  // Scroll to bottom
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);


  // --- Paste Handler ---
  const handlePaste = useCallback((event: ClipboardEvent) => {
    if (isLoading) return; // Don't allow pasting while loading

    const items = event.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const blob = items[i].getAsFile();
        if (!blob) continue;

        const reader = new FileReader();
        reader.onload = (loadEvent) => {
          const dataUrl = loadEvent.target?.result as string;
          // Generate a simple name for the pasted image
          const fileType = blob.type.split('/')[1] || 'png';
          const fileName = `pasted_image_${Date.now()}.${fileType}`;

          setFileAttachment({
            name: fileName,
            content: dataUrl, // Store as Data URL string
            type: blob.type,
            isImage: true, // Mark as image
          });
          toast({ title: "Image Pasted", status: "info", duration: 2000 });
        };
        reader.onerror = (error) => {
          console.error("Error reading pasted image:", error);
          toast({ title: "Paste Error", description: "Could not read pasted image.", status: "error" });
        };
        reader.readAsDataURL(blob);

        event.preventDefault(); // Prevent default paste action if image is handled
        return; // Handle only the first image found
      }
    }
  }, [isLoading, toast]); // Add dependencies

  // Attach paste listener
  useEffect(() => {
    const currentInput = chatInputRef.current; // Or attach to document/chat container if needed
    if (currentInput) {
      currentInput.addEventListener('paste', handlePaste);
    }

    return () => {
      if (currentInput) {
        currentInput.removeEventListener('paste', handlePaste);
      }
    };
  }, [handlePaste]); // Re-attach if handlePaste changes (due to isLoading)

  // --- Update processLoadProteinCommands to separate detection from loading ---
  const processLoadProteinCommands = useCallback((content: string, shouldLoad: boolean = false): { 
    processedContent: string, 
    pdbIdLoaded: string | null 
  } => {
    // Look for the special tag format <load_protein>XXXX</load_protein>
    const loadRegex = /<load_protein>([A-Za-z0-9]{4})<\/load_protein>/g;
    let match;
    let pdbIdLoaded: string | null = null;
    
    // Find if there's a protein load command
    if ((match = loadRegex.exec(content)) !== null) {
      pdbIdLoaded = match[1].toUpperCase();
      
      // Only trigger loading if shouldLoad is true
      if (pdbIdLoaded && shouldLoad) {
        onLoadProtein(pdbIdLoaded);
        
        toast({
          title: "Loading Protein",
          description: `Displaying structure for PDB ID: ${pdbIdLoaded}`,
          status: "info",
          duration: 2000,
          isClosable: true,
        });
      }
    }
    
    // Remove the tag from display content
    const processedContent = content.replace(loadRegex, '');
    
    return { processedContent, pdbIdLoaded };
  }, [onLoadProtein, toast]);


  // --- Parse Message Content with updated logic ---
  const parseMessageContent = (content: string) => {
    // First process any protein loading commands but don't load yet
    const { processedContent } = processLoadProteinCommands(content, false);
    
    // Then process the thinking tags as before
    const thinkRegex = /<think>(.*?)<\/think>/s;
    const match = processedContent.match(thinkRegex);
    if (match && match[1] !== undefined) {
      const thinkContent = match[1].trim();
      const parts = processedContent.split(match[0]);
      return { before: parts[0] || '', thinking: thinkContent, after: parts[1] || '' };
    }
    return { before: processedContent, thinking: null, after: '' };
  };


  // --- Ensure SYSTEM_PROMPT is prepended in handleSendMessage ---
  const handleSendMessage = async () => {
    if (!input.trim() && !fileAttachment) return;

    const userMessageContent = input;
    const currentAttachment = fileAttachment; // Keep for display and API payload

    // --- Prepare message for UI ---
    const userMessageForUI: ChatMessage = {
      role: 'user',
      content: userMessageContent,
      timestamp: new Date().toISOString(),
      // Store name for UI, actual content (Data URL) will be sent to API
      attachment: currentAttachment ? currentAttachment.name : null
    };

    // Add user message to UI immediately
    const updatedMessages = [...messages, userMessageForUI];
    setMessages(updatedMessages);
    setInput('');
    setFileAttachment(null); // Clear attachment input UI

    setIsLoading(true);

    // Add a placeholder for the assistant's response
    const assistantMessageId = Date.now().toString(); // Unique ID for the streaming message
    setMessages(prev => [...prev, {
        role: 'assistant',
        content: '...', // Placeholder content
        timestamp: new Date().toISOString(),
        // Add an ID to easily find and update this message
        id: assistantMessageId
    } as ChatMessage & { id: string }]); // Type assertion for the temporary ID


    try {
      // --- Prepare payload for Multimodal API (OpenAI format) ---
      // Include relevant history + the new user message
      // Find the initial system message to include it
      const initialSystemMessage = messages.find(msg => msg.role === 'system');
      const historyMessages = updatedMessages.filter(msg => msg.role === 'user' || msg.role === 'assistant'); // Keep user/assistant history

      const messagesForApi = historyMessages.map(msg => {
          // Special handling for the *latest* user message if it has an image attachment
          if (msg === userMessageForUI && currentAttachment?.isImage && typeof currentAttachment.content === 'string') {
            const contentPayload: any[] = [{ type: "text", text: msg.content }];
            contentPayload.push({
              type: "image_url",
              image_url: {
                "url": currentAttachment.content // Send the Data URL
              }
            });
            return { role: msg.role, content: contentPayload };
          }
          // Special handling for the *latest* user message if it has a text attachment
          if (msg === userMessageForUI && currentAttachment && typeof currentAttachment.content === 'string' && !currentAttachment.isImage) {
             // Simple approach: Prepend file info to text content
             // More complex handling might involve specific formatting based on file type
             const fileInfo = `\n\n--- Attached File: ${currentAttachment.name} ---\n${currentAttachment.content.substring(0, 1000)}...\n--- End Attached File ---`;
             return { role: msg.role, content: msg.content + fileInfo };
          }
          // For other messages (history or text-only)
          return { role: msg.role, content: msg.content };
        }); // Only send role and content

      // *** Prepend the defined SYSTEM_PROMPT ***
      const finalApiMessages = [
        { role: 'system', content: SYSTEM_PROMPT }, // Ensure this is the first element
        ...messagesForApi
      ];

      const payload = {
        model: "local",
        messages: finalApiMessages, // Use the array with system prompt
        temperature: 0.6,
        max_tokens: 1024, // Adjust max_tokens as needed for vision models
        stream: true      // Add stream parameter
      };

      // --- Debugging ---
      console.log("Sending to Multimodal API (Stream):");
      console.log("Endpoint:", chatApiEndpoint);
      console.log("Payload:", JSON.stringify(payload, null, 2)); // Be careful logging large base64 strings
      // --- End Debugging ---


      const response = await fetch(chatApiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // 'Authorization': `Bearer YOUR_API_KEY` // If needed
        },
        body: JSON.stringify(payload)
      });

      // --- Debugging ---
      console.log("LM Studio Response Status:", response.status);
      // --- End Debugging ---


      if (!response.ok) {
        // Handle non-streaming error response
        let errorMsg = `API request failed with status ${response.status}`;
        try {
          const errorData = await response.json();
          console.error("LM Studio Error Response:", errorData); // Log error details
          errorMsg = errorData.error?.message || errorData.detail || JSON.stringify(errorData) || errorMsg;
        } catch (parseError) {
          console.error("Failed to parse error response body.");
        }
         // Remove the placeholder message on error
        setMessages(prev => prev.filter(msg => (msg as any).id !== assistantMessageId));
        throw new Error(errorMsg);
      }

      // Handle the stream
      if (!response.body) {
        throw new Error("Response body is null");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulatedContent = '';
      let firstChunk = true;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        // LM Studio streams data using Server-Sent Events (SSE) format
        // Each message might be prefixed with "data: " and end with "\n\n"
        const lines = chunk.split('\n').filter(line => line.trim() !== '');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const jsonStr = line.substring(6).trim(); // Remove "data: " prefix
            if (jsonStr === '[DONE]') {
              // Stream finished signal from some OpenAI-like APIs
              continue; // Or break if you are sure this is the end
            }
            try {
              const parsed = JSON.parse(jsonStr);
              const delta = parsed.choices?.[0]?.delta?.content;

              if (delta) {
                if (firstChunk) {
                  accumulatedContent = delta; // Replace placeholder on first chunk
                  firstChunk = false;
                } else {
                  accumulatedContent += delta; // Append subsequent chunks
                }

                // Only detect and process the content but DON'T LOAD yet (pass false)
                const { processedContent } = processLoadProteinCommands(
                  accumulatedContent, 
                  false // Don't load while streaming
                );
                
                // Update the specific assistant message content with processed content
                setMessages(prev => prev.map(msg =>
                  (msg as any).id === assistantMessageId
                    ? { ...msg, content: processedContent }
                    : msg
                ));
              }
            } catch (e) {
              console.error("Failed to parse stream chunk:", jsonStr, e);
              // Handle potential JSON parsing errors in the stream
            }
          }
        }
      }
      
      // When streaming is complete:
      // 1. Process content to remove tags and get PDB ID
      // 2. Pass true to actually trigger loading now
      const { processedContent, pdbIdLoaded } = processLoadProteinCommands(
        accumulatedContent, 
        true // Actually load the protein after stream completes
      );
      
      // Clean up the temporary ID after streaming is complete
      setMessages(prev => prev.map(msg => {
        if ((msg as any).id === assistantMessageId) {
          const { id, ...rest } = msg as any; // Remove the id property
          return { ...rest, content: processedContent }; // Use the processed content here
        }
        return msg;
      }))


    } catch (error: any) {
      console.error('Error handling stream or sending message:', error);
      toast({
        title: "Chat Error",
        description: error.message || "Could not connect or process stream.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
       // Remove the placeholder message on error
       setMessages(prev => prev.filter(msg => (msg as any).id !== assistantMessageId));
       // Add a system error message
      setMessages(prev => [...prev, {
        role: 'system',
        content: `Error: ${error.message || 'Failed to get response.'}`,
        timestamp: new Date().toISOString()
      }]);
    } finally {
      setIsLoading(false);
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
          type: file.type // <-- This is now allowed
        });
      };
      reader.onerror = (error) => {
        console.error("File reading error:", error);
        toast({ title: "File Error", description: "Could not read the selected file.", status: "error" });
      };
      reader.readAsDataURL(file);
    }
  };

  const removeAttachment = () => {
    setFileAttachment(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = ""; // Reset file input
    }
  };

  const toggleThinking = (messageKey: string) => {
    setThinkingVisible(prev => ({ ...prev, [messageKey]: !prev[messageKey] }));
  };


  return ( // <--- markdownComponents is defined before this return
    <Flex direction="column" h="100%" bg={chatBg}>
      {/* Chat Messages Area */}
      <Box
        ref={chatContainerRef}
        flex="1"
        overflowY="auto"
        p={4}
        position="relative" // Needed for centering the placeholder
      >
        {/* Conditional Rendering: Placeholder or Messages */}
        {messages.length === 0 && !isLoading ? (
          // Placeholder Text when chat is empty
          <Flex
            position="absolute" // Use absolute positioning to center
            top="0"
            left="0"
            right="0"
            bottom="0"
            align="center"
            justify="center"
            direction="column"
            textAlign="center"
            p={4} // Add padding
            pointerEvents="none" // Prevent interaction with the placeholder text
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
          // Render Messages List
          <VStack spacing={4} align="stretch">
            {messages.map((msg, idx) => {
              // --- Don't render system messages in the UI ---
              if (msg.role === 'system') {
                  return null; // Skip rendering system messages entirely
              }

              // Skip rendering the placeholder message if it's still there
              if (msg.content === '...' && (msg as any).id) {
                  return null;
              }

              const messageKey = `${msg.role}-${idx}`;
              const parsedContent = parseMessageContent(msg.content || '');
              const isThinkingVisible = thinkingVisible[messageKey] || false;

              return (
                <Flex key={idx} justify={msg.role === 'user' ? 'flex-end' : 'flex-start'}>
                  <Box
                      maxW={{ base: "90%", md: "80%" }} // Adjusted max width
                      // --- Fix background color logic ---
                      bg={
                        msg.role === 'user'
                        ? userMessageBg
                        // No need to check for 'system' here as they are filtered out
                        : assistantMessageBg
                      }
                      // --- End fix ---
                      px={4} py={2} borderRadius="lg" boxShadow="sm"
                      className="chat-message-content"
                    >
                      {/* Attachment rendering */}
                      {msg.attachment && (
                        <HStack spacing={2} mb={2} p={2} bg={attachmentBg} borderRadius="md">
                          <AttachmentIcon boxSize="1em" />
                          <Text fontSize="sm" noOfLines={1} title={msg.attachment}>File: {msg.attachment}</Text>
                        </HStack>
                      )}

                      {/* Render content before thinking block */}
                      {parsedContent.before && (
                        <Box className="markdown-container">
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            components={markdownComponents} // <-- Should be found now
                          >
                            {parsedContent.before.trim()}
                          </ReactMarkdown>
                        </Box>
                      )}

                      {/* Render thinking block if it exists */}
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
                             <Box
                               p={2}
                               borderWidth="1px"
                               borderRadius="md"
                               borderColor={borderColor}
                               bg={thinkingBg} >
                               {/* Render thinking content using ReactMarkdown */}
                               <Box className="markdown-container" fontSize="sm" fontStyle="italic">
                                  <ReactMarkdown
                                    remarkPlugins={[remarkGfm]}
                                    components={markdownComponents} // <-- Should be found now
                                  >
                                    {parsedContent.thinking}
                                  </ReactMarkdown>
                               </Box>
                             </Box>
                           </Collapse>
                         </Box>
                      )}

                      {/* Render content after thinking block */}
                      {parsedContent.after && (
                         <Box className="markdown-container">
                           <ReactMarkdown
                             remarkPlugins={[remarkGfm]}
                             components={markdownComponents} // <-- Should be found now
                           >
                             {parsedContent.after.trim()}
                           </ReactMarkdown>
                         </Box>
                      )}

                      {/* Timestamp */}
                      <Text fontSize="xs" color={attachmentTextColor} mt={1} textAlign="right">
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </Text>
                    </Box>
                </Flex>
              );
            })}
            {/* Loading Spinner */}
            {isLoading && messages.length > 0 && ( // Only show spinner if messages exist
               <Flex justify="center" my={4}>
                 <Spinner size="md" color="blue.500" />
               </Flex>
             )}
          </VStack>
        )}
      </Box>

      {/* Input Area */}
      <Box p={4} borderTop="1px solid" borderColor={borderColor}>
        {/* Attachment Preview */}
        {fileAttachment && (
          <HStack mb={2} p={2} bg={inputAttachmentBg} borderRadius="md" justify="space-between">
            <HStack spacing={2} overflow="hidden" align="center">
              {fileAttachment.isImage && typeof fileAttachment.content === 'string' ? (
                <img src={fileAttachment.content} alt="Pasted preview" style={{ maxHeight: '40px', maxWidth: '100px', borderRadius: '4px' }} />
              ) : (
                <AttachmentIcon />
              )}
              <Text fontSize="sm" isTruncated title={fileAttachment.name}>{fileAttachment.name}</Text>
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
           <input
            type="file"
            ref={fileInputRef}
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />
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
            ref={chatInputRef} // Assign ref to the input
            placeholder="Ask about proteins, type 'fetch [PDB ID]', or paste an image..." // Update placeholder
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
            borderRadius="full" // Modern rounded input
          />
          <Tooltip label="Send message" placement="top">
            <IconButton
              aria-label="Send message"
              icon={<Icon as={PaperPlane} />} // Using a send icon
              colorScheme="blue"
              onClick={handleSendMessage}
              isLoading={isLoading}
              isDisabled={!input.trim() && !fileAttachment}
              borderRadius="full" // Match input style
            />
          </Tooltip>
        </Flex>
      </Box>
    </Flex>
  );
};


// Main App Component (Simplified)
const App: React.FC = () => {
  const { colorMode, toggleColorMode } = useColorMode();
  const [proteinPdbId, setProteinPdbId] = useState<string>(''); // Default protein PDB ID
  const toast = useToast();
  // Update this endpoint to your LM Studio server URL + endpoint
  const chatApiEndpoint = 'http://localhost:1234/v1/chat/completions';

  // Define theme (can be customized further)
  const theme = extendTheme({
    config: {
      initialColorMode: 'dark', // Default to dark mode
      useSystemColorMode: false,
    },
    styles: {
      global: (props: any) => ({ // Use 'any' or define props type if needed
        body: {
          bg: props.colorMode === 'light' ? 'gray.50' : 'gray.900', // Set background based on color mode
        },
      }),
    },
  });

  const handleLoadProtein = useCallback((pdbId: string) => {
    setProteinPdbId(pdbId);
    toast({
      title: "Protein Loaded",
      description: `Displaying structure for PDB ID: ${pdbId}`,
      status: "success",
      duration: 3000,
      isClosable: true,
      position: "top", // Position toast nicely
    });
  }, [toast]); // Add toast dependency

  const molstarUrls = React.useMemo(() => [
    { url: `https://files.rcsb.org/download/${proteinPdbId}.cif`, format: 'cif', isBinary: false }, // Prefer CIF format
    // Fallback or alternative URLs can be added here
  ], [proteinPdbId]);

  return (
    <ChakraProvider theme={theme}>
      <Flex direction="column" minH="100vh" bg={useColorModeValue('gray.50', 'gray.900')}>
        {/* Header */}
        <Flex
          as="header"
          align="center"
          justify="space-between"
          p={3} // Reduced padding slightly
          bg={useColorModeValue('white', 'gray.800')}
          borderBottomWidth="1px"
          borderColor={useColorModeValue('gray.200', 'gray.700')}
          boxShadow="sm" // Add subtle shadow
        >
            <Heading
            size="md"
            fontWeight="semibold"
            as="a"
            href="/chat"
            _hover={{ textDecoration: "underline", cursor: "pointer" }}
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
            {/* Settings button removed as API key is handled backend */}
          </HStack>
        </Flex>

        {/* Main Content Area */}
        <Flex
          flex="1" // Take remaining height
          direction={{ base: 'column', lg: 'row' }} // Stack on mobile, row on large screens
          overflow="hidden" // Prevent content overflow issues
        >
          {/* Molstar Viewer Area */}
          <Box
            flex={{ base: '1', lg: '3' }} // Takes more space on large screens
            p={4}
            borderRightWidth={{ base: '0', lg: '1px' }}
            borderBottomWidth={{ base: '1px', lg: '0' }}
            borderColor={useColorModeValue('gray.200', 'gray.700')}
            h={{ base: '50vh', lg: 'auto' }} // Fixed height on mobile, auto on large
            minH={{ base: '300px', lg: 'auto' }} // Minimum height for viewer
            position="relative" // Needed for potential overlays or absolute elements inside
          >
            <MolstarApp  // Ensure viewer is on top
              key={proteinPdbId} // Re-mount viewer when PDB ID changes
              urls={[

                { url: `https://files.rcsb.org/download/${proteinPdbId}.pdb`, format: 'pdb' },
              ]}
              backgroundColor={useColorModeValue("#FFFFFF", "#1A202C")} // Match theme bg
            />
          </Box>

          {/* Chat Area */}
          <Box
            flex={{ base: '1', lg: '2' }} // Takes less space on large screens
            h={{ base: 'calc(100vh - 50vh - 61px)', lg: 'calc(100vh - 61px)' }} // Calculate height carefully
            maxW={{ base: '100%', lg: '60%' }} // Max width for chat on large screens
            minW={{ base: '100%', lg: '350px' }} // Min width for chat
          >
            <BackendChat
              onLoadProtein={handleLoadProtein}
              chatApiEndpoint={chatApiEndpoint}
            />
          </Box>
        </Flex>
      </Flex>
    </ChakraProvider>
  );
};

// Placeholder for PaperPlane icon if not directly available
// You might need to install @chakra-ui/icons or use a custom SVG
const PaperPlane = (props: any) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    height="1em"
    width="1em"
    {...props}
  >
    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
  </svg>
);


export default App;
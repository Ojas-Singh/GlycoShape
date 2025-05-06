import React, { useState, useRef, useEffect, useCallback, isValidElement, Fragment } from 'react'; // Import isValidElement and Fragment
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
  Divider, // Keep if needed elsewhere, not directly used in provided snippet fixes
  // CodeProps, // Import CodeProps for typing - No longer needed directly if using Chakra Code
} from '@chakra-ui/react';
import { ChevronUpIcon, ChevronDownIcon, AttachmentIcon, CloseIcon, CopyIcon, CheckIcon, ExternalLinkIcon } from '@chakra-ui/icons'; // Removed MoonIcon, SunIcon
import MolstarApp from './MolstarApp'; // Assuming MolstarApp exists
import Latex from 'react-latex-next';
import 'katex/dist/katex.min.css'; // Ensure CSS is imported
import ReactMarkdown, { Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
// Only import the light style
import { oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';

// --- System Prompt Definition ---
// const SYSTEM_PROMPT = 
// `You are GlycoShape Copilot, an expert assistant specializing in protein structures, glycosylation, and bioinformatics.
//  \\no_think
// `;

const SYSTEM_PROMPT = 
`You are GlycoShape Copilot, an expert assistant specializing in protein structures, glycosylation, and bioinformatics.
`;

// --- Constants ---
const API_BASE_URL = 'http://localhost:5001'; // Your Flask backend URL
const CHAT_API_ENDPOINT = `${API_BASE_URL}/api/chat`;
const TEMP_FILES_BASE_URL = `${API_BASE_URL}/api/temp_files/`; // Ensure this ends with a slash

// --- Interfaces ---
interface CodeOutput {
  stdout: string;
  stderr: string;
  code?: string; // Add optional code field
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
  id?: string; // Unique ID for assistant messages during streaming
  codeOutput?: CodeOutput | null; // Ensure this uses the updated interface
  plotInfo?: PlotInfo | null;
  pdbInfo?: PdbInfo | null;
  toolStatus?: ToolStatus | null;
  isError?: boolean;
  thinkingContent?: string | null; // Add this line
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
  onLoadProtein?: (pdbId: string) => void;
  onLoadStructureUrl?: (url: string) => void;
}> = ({ onLoadProtein, onLoadStructureUrl }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [fileAttachment, setFileAttachment] = useState<FileAttachment | null>(null);
  const [thinkingVisible, setThinkingVisible] = useState<{ [key: string]: boolean }>({});
  const [codeOutputVisible, setCodeOutputVisible] = useState<{ [key: string]: boolean }>({}); // <-- Add state for code output visibility
  const [isThinkingActive, setIsThinkingActive] = useState(false);
  const [isThinkingEnabled, setIsThinkingEnabled] = useState(true); // State for thinking toggle, default ON
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<HTMLInputElement>(null);
  const { isOpen: isModalOpen, onOpen: openModal, onClose: closeModal } = useDisclosure();
  const [modalContent, setModalContent] = useState<ChatMessage['attachment']>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  // Add a map to hold refs for each reasoning box
  const reasoningBoxRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  // --- Hardcoded Light Theme Color Values ---
  const userMessageBg = 'blue.100'; // Light mode blue
  const assistantMessageBg = 'gray.100'; // Light mode gray
  const toolInfoMessageBg = 'purple.50'; // Light mode purple
  const errorMessageBg = 'red.100'; // Light mode red
  const chatBg = 'gray.50'; // Light mode background
  const borderColor = 'gray.200'; // Light mode border
  const inputBg = 'white'; // Light mode input background
  const attachmentBg = 'blackAlpha.100'; // Light mode attachment preview bg
  const attachmentTextColor = 'gray.600'; // Light mode secondary text
  const inputAttachmentBg = 'gray.100'; // Light mode input attachment chip bg
  const thinkingBg = 'whiteAlpha.500'; // Light mode thinking block bg
  const thinkingBorderColor = 'blue.300'; // Light mode thinking block border color
  const welcomeHeadingColor = 'gray.600'; // Light mode welcome text
  const welcomeTextColor = 'gray.500'; // Light mode welcome text
  const codeStyle = oneLight; // Always use light syntax highlighting
  const inlineCodeBg = 'gray.100'; // Light mode inline code bg
  const codeOutputBg = 'gray.50'; // Light mode code output bg
  const codeBlockHeaderBg = 'gray.100'; // Light mode code block header bg
  const stderrColor = "red.600"; // Light mode stderr text
  const stderrCodeColor = "red.600"; // Light mode stderr code text (can be same as text)

  // --- Custom Renderers ---

  // Updated MarkdownParagraph to handle children type for Latex more robustly
  const MarkdownParagraph: React.FC<React.PropsWithChildren<{}>> = ({ children }) => {
    const latexDelimiters = [
      { left: '$$', right: '$$', display: true },
      { left: '$', right: '$', display: false },
      { left: '\\(', right: '\\)', display: false },
      { left: '\\[', right: '\\]', display: true }
    ];

    // Handle null or undefined children
    if (children == null) {
      return null; // Or <></> if preferred
    }

    // Use Box as the paragraph container instead of Text
    // Apply margin bottom directly to the Box
    return (
      <Box as="p" mb={2}>
        {(() => {
          // Handle simple string children
          if (typeof children === 'string') {
            return <Latex delimiters={latexDelimiters}>{children}</Latex>;
          }

          // Handle array children (most common case for mixed content)
          if (Array.isArray(children)) {
            return children.map((child, index) => {
              if (typeof child === 'string') {
                // Wrap string parts with Latex
                return <Latex key={index} delimiters={latexDelimiters}>{child}</Latex>;
              } else if (isValidElement(child)) {
                // Render valid React elements directly
                // Use Fragment wrapper with key for direct element rendering in map
                return <Fragment key={index}>{child}</Fragment>;
              }
              // Ignore null, undefined, boolean, etc. in arrays
              return null;
            });
          }

          // Handle single React element child
          if (isValidElement(children)) {
              // Render the element directly
              return children;
          }

          // Fallback for unknown types
          console.warn("MarkdownParagraph received unexpected children type:", children);
          return children as React.ReactNode; // Attempt to render anyway
        })()}
      </Box>
    );
  };

  const CodeBlock: React.FC<any> = ({ node, inline, className, children, ...props }) => {
    // Get the content as a string
    const content = String(children).replace(/\n$/, '');
    
    // Override the 'inline' prop based on content analysis
    // Consider code as block if it contains newlines or is enclosed in triple backticks
    const containsNewlines = content.includes('\n');
    const isCodeBlock = containsNewlines || 
                       (className && className.startsWith('language-'));
    
    // Explicitly override the inline prop
    const effectiveInline = !isCodeBlock;
    
    // Log for debugging
    // console.log(`CodeBlock: content="${content.substring(0, 20)}...", inline=${inline}, effectiveInline=${effectiveInline}`);
    
    const { hasCopied, onCopy } = useClipboard(content);
    const match = /language-(\w+)/.exec(className || '');
    const language = match ? match[1] : 'plaintext'; // Default to plaintext

    // Use hardcoded light theme values
    const currentCodeStyle = codeStyle; // Always oneLight
    const currentCodeOutputBg = codeOutputBg;
    const currentCodeBlockHeaderBg = codeBlockHeaderBg;
    const currentInlineCodeBg = inlineCodeBg; // Use the defined variable

    // --- Use our effectiveInline instead of the original inline prop ---
    if (effectiveInline) {
      // --- Render simple inline code using Chakra's Code component ---
      return (
        <Code
          display="inline-block" // <-- Force inline display
          verticalAlign="baseline" // <-- Adjust vertical alignment if needed
          px={1} // Padding for visual spacing
          py={0.5}
          bg={currentInlineCodeBg} // Background color for inline code
          borderRadius="sm"
          fontSize="sm" // Consistent font size
          fontFamily="monospace" // Monospace font
          {...props} // Pass down other props if necessary
        >
          {children}
        </Code>
      );
    } else {
      // --- Render block code with SyntaxHighlighter ---
      // This part remains unchanged
      return (
        <Box position="relative" my={4} className="code-block" bg={currentCodeOutputBg} borderRadius="md" overflow="hidden" borderWidth="1px" borderColor={borderColor}>
           <HStack px={3} py={1} bg={currentCodeBlockHeaderBg} borderBottomWidth="1px" borderColor={borderColor} justifyContent="space-between">
              <Text fontSize="xs" color="gray.500" textTransform="uppercase">{language}</Text>
               <Tooltip label={hasCopied ? 'Copied!' : 'Copy code'} placement="top">
                <IconButton
                  aria-label="Copy code"
                  icon={hasCopied ? <CheckIcon /> : <CopyIcon />}
                  size="xs"
                  onClick={onCopy}
                  variant="ghost"
                  colorScheme={hasCopied ? 'green' : 'gray'}
                />
              </Tooltip>
           </HStack>
          <SyntaxHighlighter
            style={currentCodeStyle} // Use oneLight
            language={language}
            PreTag="div"
            {...props}
            customStyle={{ margin: 0, padding: '1rem', fontSize: '0.875rem', backgroundColor: 'transparent' }} // Transparent BG, parent Box handles it
            wrapLongLines={false} // Disable line wrapping
            codeTagProps={{ style: { fontFamily: 'monospace' } }}
          >
            {content}
          </SyntaxHighlighter>
        </Box>
      );
    }
  };

  

  
  const markdownComponents: Components = {
    // Use the updated MarkdownParagraph
    p: MarkdownParagraph,
    code: CodeBlock,
    // Add other renderers as needed
  };

  // --- Auto-load PDB file when a new message with a PDB URL is received and the response is finished ---
  useEffect(() => {
    // Find the most recent assistant message with a PDB URL and no id (id is present only during streaming)
    const latestPdbMessage = [...messages]
      .reverse()
      .find(msg => msg.pdbInfo?.url && msg.role === 'assistant' && !msg.id);

    // Only load if the message is finalized (no id) and onLoadStructureUrl is available
    if (latestPdbMessage?.pdbInfo?.url && onLoadStructureUrl) {
      console.log("Autoloading PDB from finalized message:", latestPdbMessage.pdbInfo.url);
      onLoadStructureUrl(latestPdbMessage.pdbInfo.url);
    }
  }, [messages, onLoadStructureUrl]);


  // --- Helper Functions ---
  // Scroll main chat container to bottom
  useEffect(() => {
    const chatContainer = chatContainerRef.current;
    if (chatContainer) {
      const isScrolledToBottom = chatContainer.scrollHeight - chatContainer.scrollTop <= chatContainer.clientHeight + 100; // Increased threshold slightly
      // Only scroll if near the bottom OR if loading just started (to ensure initial scroll)
      if (isScrolledToBottom || isLoading) {
        chatContainer.scrollTo({
            top: chatContainer.scrollHeight,
            behavior: 'smooth' // Keep smooth scroll
        });
      }
    }
    // Trigger scroll on new messages AND content changes in the last message during streaming
  }, [messages, messages[messages.length - 1]?.content, messages[messages.length - 1]?.thinkingContent, isLoading]); // Added last message content/thinkingContent and isLoading


  // Paste handler (unchanged logic)
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

            setFileAttachment({
              file: blob,
              name: fileName,
              previewContent: dataUrl,
              type: blob.type,
              isImage: true,
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
    [isLoading, toast, fileAttachment]
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


  // Process <load_protein> tags (unchanged logic)
  const processLoadProteinCommands = useCallback(
    (content: string, shouldLoad: boolean = false): { processedContent: string; pdbIdLoaded: string | null } => {
      if (!content) return { processedContent: '', pdbIdLoaded: null }; // Handle null/undefined content
      const loadRegex = /<load_protein>([A-Za-z0-9]{4})<\/load_protein>/g;
      let pdbIdLoaded: string | null = null;
      let processedContent = content;
      let match;

      // Use a loop that doesn't modify the string during iteration if possible
      const matches = Array.from(content.matchAll(loadRegex));

      for (const match of matches) {
          const fullTag = match[0];
          const currentPdbId = match[1].toUpperCase();

          if (currentPdbId && shouldLoad) {
              // Check if onLoadProtein exists before calling it
              if (pdbIdLoaded === null && onLoadProtein) {
                  console.log("Processing <load_protein> tag for:", currentPdbId);
                  pdbIdLoaded = currentPdbId;
                  onLoadProtein(pdbIdLoaded);
              }
          }
          // Remove the tag from the content *after* checking
          processedContent = processedContent.replace(fullTag, '');
      }

      return { processedContent, pdbIdLoaded };
    },
    [onLoadProtein] // Keep dependency, but function is now optional
  );


  // --- Open Attachment Modal ---
  const openAttachmentModal = (attachmentData: ChatMessage['attachment']) => {
    if (attachmentData) {
      setModalContent(attachmentData);
      openModal();
    }
  };

  // --- Send Message Handler ---
  // *** THIS IS THE MAIN AREA OF CHANGE ***
  const handleSendMessage = async () => {
    if (!input.trim() && !fileAttachment) return;

    const userMessageContent = input;
    const currentAttachment = fileAttachment;

    // --- 1. Prepare UI Message ---
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

    // --- 2. Update UI State ---
    const messagesWithUser = [...messages, userMessageForUI];
    setMessages(messagesWithUser);
    setInput('');
    setFileAttachment(null);
    setIsLoading(true);
    setIsThinkingActive(false); // Reset thinking state at the start
    abortControllerRef.current = new AbortController();


    // --- 3. Prepare Assistant Placeholder ---
    const assistantMessageId = `assistant-${Date.now()}`;
    setMessages((prev) => [
      ...prev,
      {
        role: 'assistant',
        content: '',
        timestamp: new Date().toISOString(),
        id: assistantMessageId,
        codeOutput: null,
        plotInfo: null,
        pdbInfo: null,
        thinkingContent: '', // Initialize thinking content as empty string
      } as ChatMessage,
    ]);

    // --- 4. Prepare API Request ---
    const historyMessages = messagesWithUser
        .filter(msg => msg.role === 'user' || msg.role === 'assistant')
        .map(({ role, content }) => ({ role, content }));


    const apiPayload = {
      // Include system prompt if needed
       messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...historyMessages],
      temperature: 0.7,
      max_tokens: 2048,
      stream: true, // Ensure stream is requested
    };

    const formData = new FormData();
    formData.append('jsonData', JSON.stringify(apiPayload));

    if (currentAttachment) {
      formData.append('file', currentAttachment.file, currentAttachment.name);
    }

    // --- 5. Make API Call & Process Stream (Logic adapted from First Code) ---
    try {
      console.log("Sending request to:", CHAT_API_ENDPOINT);
      const response = await fetch(CHAT_API_ENDPOINT, {
        method: 'POST',
        body: formData,
        signal: abortControllerRef.current.signal,
      });

      console.log("Response status:", response.status);
      if (!response.ok) {
        // (Error handling remains the same as second code)
        let errorMsg = `API request failed with status ${response.status} ${response.statusText}`;
         let errorDetails = '';
        try {
            const errorData = await response.json();
            console.error('API Error Response:', errorData);
            errorDetails = errorData.error || JSON.stringify(errorData);
            errorMsg = `${errorMsg}: ${errorDetails}`;
        } catch (parseError) {
             try {
                const textError = await response.text();
                console.error('API Error Response (text):', textError);
                errorDetails = textError;
                 errorMsg = `${errorMsg}: ${errorDetails}`;
            } catch (textErr) {
                 console.error('Failed to parse error response body.');
            }
        }
        setMessages((prev) => prev.filter((msg) => msg.id !== assistantMessageId));
        setIsThinkingActive(false);
        throw new Error(errorMsg);
      }
      if (!response.body) {
        setMessages((prev) => prev.filter((msg) => msg.id !== assistantMessageId));
        setIsThinkingActive(false);
        throw new Error('Response body is null');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = ''; // Buffer for potentially incomplete SSE messages
      let currentThinkingState = false; // State for tag processing, persistent across chunks

      // --- processSSEBuffer function (Adapted from First Code) ---
      const processSSEBuffer = () => {
        let mainContentDelta = '';
        let thinkingContentDelta = '';
        let processedLines = 0; // Keep track of processed lines for buffer management

        // Process buffer line by line (SSE messages are line-based)
        let start = 0;
        let newlineIndex;
        while ((newlineIndex = buffer.indexOf('\n', start)) !== -1) {
            const line = buffer.substring(start, newlineIndex).trim(); // Get line content
            const endOfLine = newlineIndex + 1; // Position after the newline

            if (line.startsWith('data: ')) {
                const jsonStr = line.substring(5).trim(); // Get JSON part
                if (jsonStr === '[DONE]') {
                    console.log("Received [DONE] signal.");
                    processedLines += endOfLine - start; // Consume this line
                    start = endOfLine;
                    continue; // Handled, process next line
                }
                try {
                    const parsedEvent = JSON.parse(jsonStr);
                    // console.log("Parsed Event:", parsedEvent); // Debugging: Log parsed events

                    // --- Process specific event types ---
                    if (parsedEvent.type === 'text_delta' && parsedEvent.content) {
                        let delta = parsedEvent.content;
                        // console.log(`Delta: "${delta}", Thinking: ${currentThinkingState}`); // Debugging

                        // Apply tag processing logic directly to the delta
                        while (delta.length > 0) {
                            if (currentThinkingState) {
                                const endTagIndex = delta.indexOf('</think>');
                                if (endTagIndex !== -1) {
                                    const thinkingPart = delta.substring(0, endTagIndex);
                                    thinkingContentDelta += thinkingPart;
                                    // console.log(` -> Thinking += "${thinkingPart}"`); // Debug
                                    delta = delta.substring(endTagIndex + '</think>'.length);
                                    currentThinkingState = false;
                                    // console.log(` -> Exited Thinking, Remaining: "${delta}"`); // Debug
                                } else {
                                    thinkingContentDelta += delta;
                                    // console.log(` -> Thinking += "${delta}" (No end tag)`); // Debug
                                    delta = ''; // Consumed delta
                                }
                            } else { // Not thinking
                                const startTagIndex = delta.indexOf('<think>');
                                if (startTagIndex !== -1) {
                                    const mainPart = delta.substring(0, startTagIndex);
                                    mainContentDelta += mainPart;
                                    // console.log(` -> Main += "${mainPart}"`); // Debug
                                    delta = delta.substring(startTagIndex + '<think>'.length);
                                    currentThinkingState = true;
                                    // console.log(` -> Entered Thinking, Remaining: "${delta}"`); // Debug
                                } else {
                                    mainContentDelta += delta;
                                    // console.log(` -> Main += "${delta}" (No start tag)`); // Debug
                                    delta = ''; // Consumed delta
                                }
                            }
                        } // End while(delta.length > 0)
                        setIsThinkingActive(currentThinkingState); // Update global thinking state
                    }
                    // --- Handle other event types by updating message state ---
                    else if (parsedEvent.type === 'code_output') {
                        setMessages(prev => {
                            const idx = prev.findIndex(m => m.id === assistantMessageId);
                            if (idx === -1) return prev;
                            const newMsgs = [...prev];
                            newMsgs[idx] = {
                                ...newMsgs[idx],
                                codeOutput: {
                                    stdout: parsedEvent.stdout || '',
                                    stderr: parsedEvent.stderr || '',
                                    code: parsedEvent.code // Store code if provided
                                }
                            };
                            return newMsgs;
                        });
                    } else if (parsedEvent.type === 'display_plot') {
                         setMessages(prev => {
                            const idx = prev.findIndex(m => m.id === assistantMessageId);
                            if (idx === -1) return prev;
                            const newMsgs = [...prev];
                            // Construct full URL
                            const plotUrl = `${TEMP_FILES_BASE_URL}${parsedEvent.url.split('/').pop()}`;
                            newMsgs[idx] = { ...newMsgs[idx], plotInfo: { url: plotUrl, alt: parsedEvent.alt || 'Generated Plot' } };
                            return newMsgs;
                        });
                    } else if (parsedEvent.type === 'load_pdb') {
                         setMessages(prev => {
                            const idx = prev.findIndex(m => m.id === assistantMessageId);
                            if (idx === -1) return prev;
                            const newMsgs = [...prev];
                            // Construct full URL
                            const pdbUrl = `${TEMP_FILES_BASE_URL}${parsedEvent.url.split('/').pop()}`;
                            newMsgs[idx] = { ...newMsgs[idx], pdbInfo: { url: pdbUrl, filename: parsedEvent.filename } };
                            return newMsgs;
                        });
                    }
                    // --- Handle tool/error events (Logic from second code) ---
                    else if (parsedEvent.type === 'tool_start') {
                        setMessages(prev => [...prev, {
                          id: `tool-${parsedEvent.name}-${Date.now()}`,
                          role: 'tool_info',
                          content: `Running tool: ${parsedEvent.name}...`,
                          timestamp: new Date().toISOString(),
                          toolStatus: { name: parsedEvent.name, status: 'running' }
                        }]);
                    } else if (parsedEvent.type === 'tool_end') {
                         setMessages(prev => {
                            const updatedMessages = prev.map(msg => {
                                const currentToolStatus = msg.toolStatus;
                                if (msg.role === 'tool_info' && currentToolStatus?.name === parsedEvent.name && currentToolStatus?.status === 'running') {
                                    const newToolStatus: ToolStatus = { name: currentToolStatus.name, status: 'finished' };
                                    return { ...msg, content: `Tool finished: ${parsedEvent.name}`, toolStatus: newToolStatus };
                                }
                                return msg;
                            });
                            // Filter out finished immediately (adjust if needed)
                            return updatedMessages.filter(msg => !(msg.role === 'tool_info' && msg.toolStatus?.name === parsedEvent.name && msg.toolStatus?.status === 'finished'));
                         });
                    } else if (parsedEvent.type === 'error') {
                        console.error("Backend Stream Error:", parsedEvent.message);
                        toast({
                          title: 'Backend Error',
                          description: parsedEvent.message || 'An unknown error occurred.',
                          status: 'error',
                          duration: 5000,
                          isClosable: true,
                        });
                        setMessages(prev => [...prev, {
                          id: `error-${Date.now()}`,
                          role: 'system',
                          content: `Error: ${parsedEvent.message}`,
                          timestamp: new Date().toISOString(),
                          isError: true,
                        }]);
                    }

                } catch (e) {
                    console.error('Failed to parse SSE data line:', jsonStr, e);
                }
            } else if (line === '') {
                // Empty line signifies end of an SSE message group, handled by line processing
            } else {
                // Line doesn't start with 'data:' - could be a comment or invalid SSE
                console.warn("Received non-data SSE line:", line);
            }

            processedLines += endOfLine - start; // Mark these characters as processed
            start = endOfLine; // Move start for the next iteration
        } // End while(newlineIndex !== -1)

        // Remove processed lines from the buffer
        buffer = buffer.substring(processedLines);

        // Return the accumulated deltas for main and thinking content
        return { mainContentDelta, thinkingContentDelta };
      };


      // --- Stream Reading Loop (Adapted from First Code) ---
      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          // Process any final bytes left in the decoder and buffer
          buffer += decoder.decode(); // Flush decoder
          const { mainContentDelta: finalMain, thinkingContentDelta: finalThinking } = processSSEBuffer(); // Process remaining buffer
          if (finalMain || finalThinking) {
             // Update state with final deltas
             setMessages(prevMessages => {
                const msgIndex = prevMessages.findIndex(m => m.id === assistantMessageId);
                if (msgIndex === -1) return prevMessages;
                const newMessages = [...prevMessages];
                const updatedMessage = { ...newMessages[msgIndex] };
                if (finalMain) {
                    const { processedContent } = processLoadProteinCommands(finalMain, false);
                    updatedMessage.content = (updatedMessage.content || '') + processedContent;
                }
                if (finalThinking) {
                    updatedMessage.thinkingContent = (updatedMessage.thinkingContent || '') + finalThinking;
                }
                newMessages[msgIndex] = updatedMessage;
                return newMessages;
             });
          }
          console.log("Stream finished");
          break; // Exit loop
        }

        // Append new chunk to buffer
        buffer += decoder.decode(value, { stream: true });

        // Process the buffer for complete SSE lines and extract content
        const { mainContentDelta, thinkingContentDelta } = processSSEBuffer();

        // Update UI state only if text deltas were extracted
        if (mainContentDelta || thinkingContentDelta) {
          setMessages(prevMessages => {
            const msgIndex = prevMessages.findIndex(m => m.id === assistantMessageId);
            if (msgIndex === -1) return prevMessages; // Message might have been removed

            const newMessages = [...prevMessages];
            const updatedMessage = { ...newMessages[msgIndex] };

            // Initialize thinking content if somehow still null (should be init as '')
            if (updatedMessage.thinkingContent === null) {
                updatedMessage.thinkingContent = '';
            }

            // Append extracted deltas
            if (mainContentDelta) {
              const { processedContent } = processLoadProteinCommands(mainContentDelta, false); // Process load tags as they arrive
              updatedMessage.content = (updatedMessage.content || '') + processedContent;
            }
            if (thinkingContentDelta) {
              updatedMessage.thinkingContent += thinkingContentDelta;
            }

            newMessages[msgIndex] = updatedMessage;
            return newMessages;
          });
        }
      } // End while(true)

      // --- Final Processing After Stream Ends ---
      setMessages(prevMessages => {
          const finalMessages = [...prevMessages];
          const finalAssistantMsgIndex = finalMessages.findIndex(m => m.id === assistantMessageId);

          if (finalAssistantMsgIndex !== -1) {
              const finalAssistantMsg = { ...finalMessages[finalAssistantMsgIndex] };

              // Final processing of load_protein tags on the complete content
              if (finalAssistantMsg.content) {
                  const { processedContent, pdbIdLoaded } = processLoadProteinCommands(finalAssistantMsg.content, true); // Load now
                  if (pdbIdLoaded) { // Only update if a command was actually processed
                      finalAssistantMsg.content = processedContent;
                  }
              }
              
              // Log final content for verification
              // console.log("Final Assistant Content:", finalAssistantMsg.content);
              // console.log("Final Thinking Content:", finalAssistantMsg.thinkingContent);


              // Remove the temporary ID
              delete finalAssistantMsg.id;
              finalMessages[finalAssistantMsgIndex] = finalAssistantMsg;
          } else {
              console.warn("Could not find assistant message to finalize:", assistantMessageId);
          }
          return finalMessages;
      });

    } catch (error: any) {
        // Error handling from second code (already robust)
         if (error.name === 'AbortError') {
            console.log('Fetch aborted');
            toast({ title: 'Request Cancelled', status: 'info', duration: 2000 });
            setMessages((prev) => prev.filter((msg) => msg.id !== assistantMessageId));
         } else {
            console.error('Error handling stream or sending message:', error);
             toast({
                 title: 'Chat Error',
                 description: error.message || 'Failed to communicate with the server.',
                 status: 'error',
                 duration: 5000,
                 isClosable: true,
             });
            // Remove placeholder if it exists, add system error message
            setMessages((prev) => prev.filter((msg) => msg.id !== assistantMessageId));
            setMessages((prev) => [
                ...prev,
                {
                role: 'system',
                content: `Error: ${error.message || 'Failed to get response.'}`,
                timestamp: new Date().toISOString(),
                isError: true,
                },
            ]);
         }
    } finally {
      setIsLoading(false);
      setIsThinkingActive(false); // Ensure reset in finally
      abortControllerRef.current = null;
      // Optional: chatInputRef.current?.focus();
    }
  };


  // --- File Handling (unchanged logic) ---
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      const fileType = file.type;
      const isImage = fileType.startsWith('image/');
      const isText = fileType.startsWith('text/') || /\.(pdb|cif|py|txt|md)$/i.test(file.name); // Added md
      const isCSV = fileType === 'text/csv' || file.name.endsWith('.csv');
      const isJSON = fileType === 'application/json' || file.name.endsWith('.json');

      reader.onload = (event) => {
        const result = event.target?.result;
        setFileAttachment({
          file: file,
          name: file.name,
          previewContent: typeof result === 'string' ? result : null,
          type: fileType,
          isImage: isImage,
          isText: isText,
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
         // Limit preview size for large text files (e.g., first 10KB)
        const blobSlice = file.slice(0, 10 * 1024);
        reader.readAsText(blobSlice);
      } else {
        setFileAttachment({
          file: file,
          name: file.name,
          previewContent: null, // No preview for non-text/image
          type: fileType,
        });
      }
    }
    if (e.target) {
        e.target.value = ''; // Reset file input
    }
  };

  const handleFileAttach = () => {
    fileInputRef.current?.click();
  };

  const removeAttachment = () => {
    setFileAttachment(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // --- Other Handlers (unchanged logic) ---
  const toggleThinking = (messageKey: string) => {
    setThinkingVisible((prev) => ({ ...prev, [messageKey]: !prev[messageKey] }));
  };

  const toggleCodeOutput = (messageKey: string) => { // <-- Add handler for code output toggle
    setCodeOutputVisible((prev) => ({ ...prev, [messageKey]: !prev[messageKey] }));
  };

  const cancelRequest = () => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            console.log("Request cancellation initiated.");
        }
    };

  // --- Render ---
  // *** RENDER LOGIC REMAINS UNCHANGED FROM SECOND CODE ***
  return (
    <Flex direction="column" h="100%" bg={chatBg}>
      {/* Chat Messages Area */}
      <Box ref={chatContainerRef} flex="1" overflowY="auto" p={4} position="relative">
        {/* Welcome Message or Message List */}
        {messages.length === 0 && !isLoading ? (
           <Flex
                position="absolute"
                top="0"
                left="0"
                right="0"
                bottom="0"
                align="center"
                justify="center" // Changed from justify="content" to center content
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
                (Ask about proteins, use tools via natural language, upload files, or paste images)
                </Text>
            </Flex>
        ) : (
          <VStack spacing={4} align="stretch">
            {messages.map((msg, idx) => {
              const messageKey = `${msg.role}-${msg.timestamp}-${idx}${msg.id ? `-${msg.id}` : ''}`;

              // Skip system messages unless they are errors
              if (msg.role === 'system' && !msg.isError) return null;

              // Slightly refined condition to skip placeholder only if completely empty AND loading
              const isEmptyPlaceholder = msg.role === 'assistant' &&
                                        msg.id &&
                                        !msg.content?.trim() &&
                                        !msg.thinkingContent?.trim() && // Check trim here too
                                        !msg.codeOutput &&
                                        !msg.plotInfo &&
                                        !msg.pdbInfo &&
                                        isLoading;
              if (isEmptyPlaceholder) return null;


               let msgBg = assistantMessageBg; // Default to assistant
               let justify = 'flex-start';
               if (msg.role === 'user') {
                   msgBg = userMessageBg;
                   justify = 'flex-end';
               } else if (msg.role === 'tool_info') {
                   msgBg = msg.toolStatus?.status === 'error' ? errorMessageBg : toolInfoMessageBg;
               } else if (msg.isError && msg.role === 'system') { // Only apply error bg to system errors
                   msgBg = errorMessageBg;
               } else if (msg.role === 'assistant') {
                   msgBg = assistantMessageBg; // Ensure assistant messages default to grey
               }

              return (
                <Flex key={messageKey} justify={justify} w="100%">
                  <Box
                    maxW={{ base: '90%', md: '80%' }}
                    bg={msgBg}
                    px={4}
                    py={2}
                    borderRadius="lg"
                    boxShadow="sm"
                    className="chat-message-content"
                    // Adjust width only for assistant, let user shrink naturally
                    w={msg.role === 'assistant' ? { base: '90%', md: '80%' } : 'auto'}
                  >
                    {/* Attachment Preview (User) */}
                    {msg.role === 'user' && msg.attachment && (
                      <Button
                        variant="link" size="sm" onClick={() => openAttachmentModal(msg.attachment)} mb={2}
                        p={0} height="auto" _hover={{ textDecoration: 'none' }} w="full" display="block"
                        textAlign="left" // Ensure text aligns left
                      >
                        <HStack spacing={2} p={2} bg={attachmentBg} borderRadius="md" w="full">
                          <AttachmentIcon boxSize="1em" />
                          <Text fontSize="sm" noOfLines={1} title={msg.attachment.name}>
                             Attached: {msg.attachment.name}
                          </Text>
                        </HStack>
                      </Button>
                    )}

                    {/* --- Render Thinking Box --- */}
                    {/* Render only if thinkingContent has actual text */}
                    {msg.thinkingContent && msg.thinkingContent.trim() && (
                        <VStack align={'start'} spacing={1} width="100%">
                        <HStack spacing={2} width="100%" justifyContent="space-between" minH="16px">
                          <Text fontSize="xs" fontWeight="bold" color="gray.600">Reasoning:</Text>
                          <Button
                          size="xs"
                          variant="ghost"
                          onClick={() => toggleThinking(messageKey)}
                          height="16px"
                          minWidth="20px"
                          p={0}
                          aria-label={thinkingVisible[messageKey] ? "Collapse Reasoning" : "Expand Reasoning"}
                          >
                          {thinkingVisible[messageKey] ? <ChevronUpIcon /> : <ChevronDownIcon />}
                          </Button>
                        </HStack>
                        {/* Only show preview when collapsed */}
                        {!thinkingVisible[messageKey] && (
                            <Box 
                            mt={1}
                            p={2}
                            borderWidth="1px"
                            borderRadius="md"
                            borderColor={thinkingBorderColor}
                            bg={thinkingBg}
                            w="full"
                            fontSize="xs"
                            color="gray.600"
                            cursor="pointer"
                            onClick={() => toggleThinking(messageKey)}
                            noOfLines={3}
                            overflow="hidden"
                            textOverflow="ellipsis"
                            whiteSpace="nowrap"
                            >
                            {msg.thinkingContent
                            ? msg.thinkingContent.slice(-100)
                            : "View reasoning..."}
                            </Box>
                        )}
                        {/* Collapse component for expanded view */}
                        <Collapse in={thinkingVisible[messageKey]} animateOpacity style={{width: '100%'}}>
                            <Box
                            ref={(el) => { reasoningBoxRefs.current[messageKey] = el; }}
                            mt={1}
                            mb={2}
                            p={3}
                            borderWidth="1px"
                            borderRadius="md"
                            borderColor={thinkingBorderColor}
                            bg={thinkingBg}
                            maxH={"400px"}
                            overflowY="auto"
                            w="full"
                            fontSize="xs" // Correct font size here
                            >
                            <Box className="markdown-container">
                            <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                              {msg.thinkingContent}
                            </ReactMarkdown>
                            </Box>
                            </Box>
                        </Collapse>
                        </VStack>
                    )}
                    {/* --- MODIFICATION END --- */}

                    {/* Render Main Content (Only if it has actual text) */}
                    {msg.content && msg.content.trim() && (
                        <Box className="markdown-container" mt={msg.thinkingContent && msg.thinkingContent.trim() ? 2 : 0}>
                            <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                            {msg.content}
                            </ReactMarkdown>
                        </Box>
                    )}


                    {/* Tool Info / System Error */}
                    {msg.role === 'tool_info' && msg.toolStatus && (
                         <HStack spacing={2} align="center" mt={1}>
                            {msg.toolStatus.status === 'running' && <Spinner size="xs" />}
                            {msg.toolStatus.status === 'finished' && <CheckIcon color="green.500" />}
                            {msg.toolStatus.status === 'error' && <Icon as={CloseIcon} color="red.500" />}
                            <Text fontSize="sm" fontStyle="italic" color={attachmentTextColor}>
                                {msg.content} {/* Display content like "Running tool..." */}
                            </Text>
                         </HStack>
                    )}
                    {/* System Error Message Specific Content */}
                    {msg.role === 'system' && msg.isError && (
                         <Alert status="error" variant="subtle" mt={2} borderRadius="md">
                            <AlertIcon />
                            <AlertDescription fontSize="sm">{msg.content}</AlertDescription>
                         </Alert>
                    )}


                     {/* Code Output (Collapsible) */}
                    {msg.codeOutput && (
                      <Box mt={3}>
                        {/* Header for Collapse Toggle */}
                        <HStack spacing={2} width="100%" justifyContent="space-between" minH="16px" mb={1} cursor="pointer" onClick={() => toggleCodeOutput(messageKey)}>
                          <Text fontSize="xs" fontWeight="bold" color="gray.600">Code Execution:</Text>
                          <Button
                            size="xs"
                            variant="ghost"
                            height="16px"
                            minWidth="20px"
                            p={0}
                            aria-label={codeOutputVisible[messageKey] ? "Collapse Code Output" : "Expand Code Output"}
                          >
                            {codeOutputVisible[messageKey] ? <ChevronUpIcon /> : <ChevronDownIcon />}
                          </Button>
                        </HStack>

                        {/* Collapsible Content */}
                        <Collapse in={codeOutputVisible[messageKey]} animateOpacity style={{width: '100%'}}>
                          <Box pt={2} /* Add padding top to separate from header */ >
                            {/* Display Executed Code if present */}
                            {msg.codeOutput.code && (
                              <Box mb={3}>
                                <Text fontSize="sm" fontWeight="bold" mb={1}>Executed Code:</Text>
                                <CodeBlock className="language-python">
                                  {msg.codeOutput.code}
                                </CodeBlock>
                              </Box>
                            )}
                            {/* END Display Executed Code */}

                            {/* Display STDOUT/STDERR only if they exist */}
                            {(msg.codeOutput.stdout || msg.codeOutput.stderr) && (
                                <Text fontSize="sm" fontWeight="bold" mb={1}>Code Output:</Text>
                            )}
                            {msg.codeOutput.stdout && (
                              <Box mb={msg.codeOutput.stderr ? 2 : 0}> {/* Adjust margin if stderr follows */}
                                <Text fontSize="xs" color="gray.500" mb={1}>STDOUT:</Text>
                                <Code as="pre" p={3} bg={codeOutputBg} borderRadius="md" whiteSpace="pre-wrap" wordBreak="break-all" fontSize="sm" w="full" borderWidth="1px" borderColor={borderColor}>
                                  {msg.codeOutput.stdout}
                                </Code>
                              </Box>
                            )}
                            {msg.codeOutput.stderr && (
                              <Box>
                                  <Text fontSize="xs" color={stderrColor} mb={1}>STDERR:</Text>
                                  <Code as="pre" p={3} bg={codeOutputBg} borderRadius="md" whiteSpace="pre-wrap" wordBreak="break-all" fontSize="sm" w="full" color={stderrCodeColor} borderWidth="1px" borderColor={borderColor}>
                                    {msg.codeOutput.stderr}
                                  </Code>
                              </Box>
                            )}
                            {/* Conditionally render "(No output)" only if BOTH stdout/stderr are empty AND code wasn't shown */}
                            {!msg.codeOutput.code && !msg.codeOutput.stdout && !msg.codeOutput.stderr && (
                                <Text fontSize="sm" fontStyle="italic" color="gray.500">(No output)</Text>
                            )}
                          </Box>
                        </Collapse>
                      </Box>
                    )}

                    {/* Plot Display */}
                    {msg.plotInfo && msg.plotInfo.url && ( // Check URL exists
                      <Box mt={3} textAlign="center">
                        <Text fontSize="sm" fontWeight="bold" mb={2}>Generated Plot:</Text>
                        <Image
                            src={msg.plotInfo.url}
                            alt={msg.plotInfo.alt || 'Generated Plot'}
                            maxW="80%"
                            mx="auto"
                            borderRadius="md"
                            boxShadow="sm"
                            borderWidth="1px"
                            borderColor={borderColor}
                            onError={(e) => { console.error("Failed to load image:", msg.plotInfo?.url); (e.target as HTMLImageElement).style.display = 'none'; }}
                         />
                         <Button
                            as="a"
                            href={msg.plotInfo.url}
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
                    )}

                    {/* Modified PDB Info with Download Button */}
                    {msg.pdbInfo && msg.pdbInfo.url && msg.pdbInfo.filename && ( // Check fields exist
                       <Box mt={3} p={3} borderWidth="1px" borderRadius="md" borderColor={borderColor} bg="blue.50">
                        <HStack justifyContent="space-between" mb={2} wrap="wrap"> {/* Allow wrap */}
                          <Text fontSize="sm" fontWeight="bold">Generated Structure</Text>
                          <Button
                            as="a"
                            href={msg.pdbInfo.url}
                            download={msg.pdbInfo.filename}
                            size="sm"
                            colorScheme="blue"
                            leftIcon={<ExternalLinkIcon />}
                            flexShrink={0} // Prevent button shrinking too much
                          >
                            Download File
                          </Button>
                        </HStack>
                        <Text fontSize="sm" mb={1} wordBreak="break-all">File: {msg.pdbInfo.filename}</Text>
                        <HStack spacing={2} mt={2}>
                          {onLoadStructureUrl && ( // Conditionally render View button
                            <Button
                              size="xs"
                              colorScheme="teal"
                              onClick={() => {
                                if (onLoadStructureUrl && msg.pdbInfo?.url) {
                                  onLoadStructureUrl(msg.pdbInfo.url);
                                }
                              }}
                            >
                              View in 3D
                            </Button>
                          )}
                          <Button
                            as="a"
                            href={msg.pdbInfo.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            size="xs"
                            variant="outline"
                          >
                            Preview File
                          </Button>
                        </HStack>
                       </Box>
                    )}


                    {/* Timestamp (Hide for tool info/system error) */}
                    {msg.role !== 'tool_info' && !(msg.role === 'system' && msg.isError) && (
                        <Text fontSize="xs" color={attachmentTextColor} mt={1} textAlign="right">
                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </Text>
                    )}
                  </Box>
                </Flex>
              );
            })}
            {/* Loading indicator */}
            {/* Show "Preparing" only when loading and no content/thinking yet */}
            {isLoading && !isThinkingActive && messages[messages.length - 1]?.id && !messages[messages.length - 1]?.content?.trim() && !messages[messages.length - 1]?.thinkingContent?.trim() && (
                 <Flex justify="center" my={4}>
                    <HStack>
                        <Spinner size="sm" color="blue.500" />
                        <Text fontSize="sm" color="gray.500">Assistant is preparing...</Text>
                        <Button size="xs" variant="outline" onClick={cancelRequest} colorScheme="red">
                            Cancel
                        </Button>
                    </HStack>
                 </Flex>
            )}
             {/* Show "Thinking" when loading and actively in thinking state */}
             {isLoading && isThinkingActive && (
                 <Flex justify="center" my={4}>
                    <HStack>
                        <Spinner size="sm" color="yellow.500" />
                        <Text fontSize="sm" color="gray.500">Assistant is thinking...</Text>
                         <Button size="xs" variant="outline" onClick={cancelRequest} colorScheme="red">
                            Cancel
                        </Button>
                    </HStack>
                 </Flex>
             )}
          </VStack>
        )}
      </Box>

      {/* Input Area */}
      <Box p={4} borderTop="1px solid" borderColor={borderColor}>
        {/* File Attachment Chip */}
        {fileAttachment && (
          <HStack mb={2} p={2} bg={inputAttachmentBg} borderRadius="md" justify="space-between">
            <HStack spacing={2} overflow="hidden" align="center" maxW="calc(100% - 40px)">
              {fileAttachment.isImage && typeof fileAttachment.previewContent === 'string' ? (
                <img
                  src={fileAttachment.previewContent}
                  alt="Preview"
                  style={{ maxHeight: '32px', maxWidth: '80px', borderRadius: '4px', objectFit: 'cover' }}
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
                icon={<CloseIcon boxSize={2.5}/>}
                size="xs"
                variant="ghost"
                onClick={removeAttachment}
                isRound
              />
            </Tooltip>
          </HStack>
        )}

        {/* Input Field and Buttons */}
        <Flex align="center">
          <input type="file" ref={fileInputRef} style={{ display: 'none' }} onChange={handleFileChange} accept="image/*, text/*, .pdb, .cif, .py, .csv, .json, .md" /> {/* Added accept attribute */}
          <Tooltip label="Attach file" placement="top">
            <IconButton
              aria-label="Attach file"
              icon={<AttachmentIcon />}
              onClick={handleFileAttach}
              mr={2}
              variant="ghost"
              isDisabled={isLoading || !!fileAttachment}
            />
          </Tooltip>
          <Input
            ref={chatInputRef}
            placeholder="Ask about proteins, analyze data, or generate structures..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                 if (!isLoading) handleSendMessage();
              }
            }}
            flex="1"
            bg={inputBg}
            isDisabled={isLoading}
            mr={2}
            borderRadius="full"
            size="md"
          />
          <Tooltip label={isLoading ? "Cancel Request" : "Send message"} placement="top">
             {isLoading ? (
                  <IconButton
                    aria-label="Cancel request"
                    icon={<CloseIcon />}
                    colorScheme="red"
                    onClick={cancelRequest}
                    isLoading={false} // Don't show spinner on cancel button
                    isDisabled={!abortControllerRef.current} // Disable if no active request
                    borderRadius="full"
                    size="md"
                  />
             ) : (
                 <IconButton
                    aria-label="Send message"
                    icon={<Icon as={PaperPlane} />}
                    colorScheme="blue"
                    onClick={handleSendMessage}
                    isLoading={false} // Loading state handled separately
                    isDisabled={isLoading || (!input.trim() && !fileAttachment)}
                    borderRadius="full"
                    size="md"
                  />
             )}
          </Tooltip>
        </Flex>
      </Box>

      {/* Attachment Preview Modal */}
      <Modal isOpen={isModalOpen} onClose={closeModal} size="xl" isCentered scrollBehavior="inside">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader title={modalContent?.name} isTruncated>
             {modalContent?.name || 'Attachment'}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            {modalContent?.isImage && typeof modalContent.content === 'string' ? (
              <Image src={modalContent.content} alt={modalContent.name || 'Image attachment'} maxW="100%" mx="auto" display="block"/>
            ) : modalContent?.isJSON && typeof modalContent.content === 'string' ? (
              <Code as="pre" whiteSpace="pre-wrap" wordBreak="break-all" p={3} bg={inputBg} borderRadius="md" maxH="60vh" overflowY="auto" borderWidth="1px" borderColor={borderColor}>
                {(() => {
                  try { return JSON.stringify(JSON.parse(modalContent.content), null, 2); }
                  catch (e) { return modalContent.content; /* Show raw if parse fails */ }
                })()}
              </Code>
            ) : (modalContent?.isText || modalContent?.isCSV) && typeof modalContent.content === 'string' ? (
               <Code as="pre" whiteSpace="pre-wrap" wordBreak="break-all" p={3} bg={inputBg} borderRadius="md" maxH="60vh" overflowY="auto" borderWidth="1px" borderColor={borderColor}>
                 {modalContent.content}
               </Code>
            ) : (
              <Text color="gray.500">Preview not available for this file type ({modalContent?.type || 'unknown'}).</Text>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </Flex>
  );
};

// --- Main App Component (Simplified for Light Mode Only) ---
// *** REMAINS UNCHANGED FROM SECOND CODE ***
const App: React.FC = () => {
  // Removed useColorMode hook
  const [proteinPdbId, setProteinPdbId] = useState<string | null>(null); // Allow null initially
  const [structureUrl, setStructureUrl] = useState<string | null>(null); // State for generated structure URL
  const toast = useToast(); // Keep toast for App level if needed

  // --- Simplified Light Theme ---
  const theme = extendTheme({
    // Removed color mode config
    styles: {
      global: { // Directly define light mode styles
        body: {
          bg: 'gray.50', // Hardcoded light background
          color: 'gray.800', // Hardcoded light text color
        },
         '::-webkit-scrollbar': {
          width: '8px',
          height: '8px',
        },
        '::-webkit-scrollbar-track': {
          background: '#f1f1f1', // Light track
        },
        '::-webkit-scrollbar-thumb': {
          background: '#c1c1c1', // Light thumb
          borderRadius: '4px',
        },
        '::-webkit-scrollbar-thumb:hover': {
          background: '#a8a8a8', // Light thumb hover
        }
      },
    },
     components: {
        Code: { // Directly define light mode style for Code component
            baseStyle: {
                bg: 'gray.100', // Hardcoded light code background
                px: '0.2em',
                py: '0.1em',
                borderRadius: 'sm',
                fontFamily: 'monospace', // Ensure monospace
                fontSize: '0.875em', // Slightly smaller code font
            },
        }
    }
  });

  // --- Handlers ---
  // Handler for loading structure from a URL (e.g., generated PDB)
  const handleLoadStructureUrl = useCallback(
    (url: string) => {
      console.log(`[App] handleLoadStructureUrl called with URL: ${url}`); // Log call
      setStructureUrl(url);
      setProteinPdbId(null);
    },
    []
  );
  
  useEffect(() => {
    console.log(`[App] structureUrl state updated to: ${structureUrl}`); // Log state change
  }, [structureUrl]);

  // --- Molstar URLs ---
  const molstarUrls = React.useMemo(() => {
    if (structureUrl) { // Prioritize loading from URL
      const format = structureUrl.toLowerCase().endsWith('.cif') ? 'cif' : 'pdb'; // Basic format detection
      // Cast to the expected union type instead of using 'as const'
      return [{ url: structureUrl, format: format as 'cif' | 'pdb', isBinary: false }];
    }
    if (proteinPdbId) { // Fallback to PDB ID
      return [
        { url: `https://files.rcsb.org/download/${proteinPdbId}.cif`, format: 'cif' as const, isBinary: false },
        { url: `https://files.rcsb.org/download/${proteinPdbId}.pdb`, format: 'pdb' as const, isBinary: false },
      ];
    }
    return []; // No structure to load
  }, [proteinPdbId, structureUrl]);

  return (
    <ChakraProvider theme={theme}>
      {/* Use hardcoded light theme values */}
      <Flex direction="column" minH="100vh" maxH="100vh" bg='gray.50'>
        {/* Header */}
        <Flex
          as="header" align="center" justify="space-between" p={3}
          bg='white' borderBottomWidth="1px"
          borderColor='gray.200' boxShadow="sm" flexShrink={0}
          height="61px" // Explicit height
        >
           <Heading size="md" fontWeight="semibold" color='blue.600'>
             GlycoShape Copilot
           </Heading>
          {/* Removed Color Mode Toggle Button */}
        </Flex>

        {/* Main Content */}
        <Flex flex="1" direction={{ base: 'column', lg: 'row' }} overflow="hidden" height="calc(100vh - 61px)">
          {/* Molstar Viewer Pane */}
          <Box
            flex={{ base: '1', lg: 3 }}
            p={{ base: 2, md: 4 }}
            borderRightWidth={{ base: '0', lg: '1px' }}
            borderBottomWidth={{ base: '1px', lg: '0' }}
            borderColor='gray.200' // Use hardcoded light border
            minH={{ base: '40vh', md: '50vh', lg: 'auto' }}
            position="relative"
            overflow="hidden"
          >
             {(proteinPdbId || structureUrl) ? ( // Check if either PDB ID or URL is set
                 <MolstarApp
                    key={structureUrl || proteinPdbId} // Key ensures re-mount on change of URL or PDB ID
                    urls={molstarUrls}
                    backgroundColor='#FFFFFF' // Hardcoded light background for Molstar
                 />
             ) : (
                <Flex h="100%" align="center" justify="center" color="gray.500">
                    <Text>Load or generate a protein structure using the chat.</Text>
                </Flex>
             )}
          </Box>

          {/* Chat Pane */}
          <Box
            flex={{ base: '1', lg: 2 }}
            display="flex"
            flexDirection="column"
            // No explicit height needed if parent Flex has height
            // h={{ base: 'auto', lg: 'calc(100vh - 61px)' }}
            // maxH={{ base: '60vh', md: '50vh', lg: 'calc(100vh - 61px)' }}
            overflow="hidden" // Prevent chat from overflowing container
          >
            <BackendChat
              // onLoadProtein is now optional, pass if needed
              onLoadStructureUrl={handleLoadStructureUrl} // Pass handler
             />
          </Box>
        </Flex>
      </Flex>
    </ChakraProvider>
  );
};

export default App;
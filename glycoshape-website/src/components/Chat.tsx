import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Spacer,
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
  Kbd,
  Select,
} from '@chakra-ui/react';
import { ChatIcon, LinkIcon, ChevronUpIcon, ChevronDownIcon, AttachmentIcon, CloseIcon, CopyIcon, CheckIcon, ExternalLinkIcon, RepeatIcon, DeleteIcon, DownloadIcon} from '@chakra-ui/icons';
import { VscSymbolProperty, VscTerminal, VscCheck, VscSymbolFile, VscCloudDownload } from "react-icons/vsc";
import { Slide } from '@chakra-ui/react';
import 'katex/dist/katex.min.css';
import ReactMarkdown, { Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { v4 as uuidv4 } from 'uuid';

// --- Constants ---
const API_BASE_URL = 'https://glycoshape.io';
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
    isPDB?: boolean;
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
    type: 'text' | 'code_delta' | 'code_output' | 'plot' | 'pdb' | 'molviewspec' | 'tool_start' | 'tool_end' | 'link';
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

// Helper to prepare history for API
const prepareApiHistory = (messagesToPrepare: ChatMessage[]): { role: string; content: string }[] => {
  return messagesToPrepare
    // Only user/assistant, no streaming/temporary/system
    .filter(msg => (msg.role === 'user' || msg.role === 'assistant') && !msg.id)
    .map(msg => {
      let content = msg.content || '';
      if (msg.role === 'user' && msg.attachment?.name) {
        const fileContext = `\n\n[User uploaded file: '${msg.attachment.name}'. It is available for tools in the current session's working directory as '${msg.attachment.name}'.]`;
        content += fileContext;
      }
      return { role: msg.role, content };
    });
};

// --- Main Chat Component ---
const BackendChat: React.FC<{
  onMolViewSpecUpdate?: (molviewspec: any, filename: string) => void;
}> = ({ onMolViewSpecUpdate }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState<string>('');
  const [showControls, setShowControls] = useState(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [fileAttachment, setFileAttachment] = useState<FileAttachment | null>(null);
  const [codeOutputVisible, setCodeOutputVisible] = useState<{ [key: string]: boolean }>({});
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [models, setModels] = useState<{id: string, label: string}[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>('');
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<HTMLInputElement>(null);
  const { isOpen: isModalOpen, onOpen: openModal, onClose: closeModal } = useDisclosure();
  const [modalContent, setModalContent] = useState<ChatMessage['attachment']>(null);
  const [pdbPreviewContent, setPdbPreviewContent] = useState<string | null>(null);
  const [isPdbPreviewOpen, setIsPdbPreviewOpen] = useState(false);
  const { isOpen: isPlotModalOpen, onOpen: openPlotModal, onClose: closePlotModal } = useDisclosure();
  const [plotModalContent, setPlotModalContent] = useState<{ url: string; alt?: string } | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Helper function to detect if content is a tool result JSON
  const isToolResultJson = (content: string): boolean => {
    if (!content || typeof content !== 'string') return false;
    
    // Check if it starts and ends with curly braces
    const trimmed = content.trim();
    if (!trimmed.startsWith('{') || !trimmed.endsWith('}')) return false;
    
    try {
      const parsed = JSON.parse(trimmed);
      // Check if it has typical tool result fields
      return (
        parsed && 
        typeof parsed === 'object' && 
        (parsed.success !== undefined || 
         parsed.error !== undefined || 
         parsed.file_path !== undefined ||
         parsed.completion_message !== undefined ||
         parsed.pdb_url !== undefined ||
         parsed.visualization_url !== undefined)
      );
    } catch {
      return false;
    }
  };

  // Prevent double session load in React StrictMode
  const didLoadSession = useRef(false);
  // Prevent double molviewspec replay
  const didReplayMolViewSpecs = useRef(false);

  useEffect(() => {
    if (didLoadSession.current) return;
    didLoadSession.current = true;

    const loadSessionHistory = async (sid: string) => {
      setIsLoading(true);
      try {
        const response = await fetch(`${API_BASE_URL}/api/session/${sid}`);
        if (!response.ok) {
          let errorMsg = `Failed to load session: ${response.status} ${response.statusText}`;
          try {
            const errorData = await response.json();
            errorMsg = errorData.error || errorMsg;
          } catch (e) {
            errorMsg = await response.text();
          }
          throw new Error(errorMsg);
        }
        const data = await response.json();
        
        // Handle different response formats - check if it has 'conversation' or 'messages'
        const messagesArray = data.messages || data.conversation || [];
        
        if (!Array.isArray(messagesArray)) {
          throw new Error('Invalid session data: no valid messages array found');
        }
        
        // Filter out tool result messages and assistant messages with null content (tool calls)
        const filteredMessages = messagesArray.filter((msg: any) => {
          // Skip tool result messages
          if (msg.role === 'tool') return false;
          
          // Skip assistant messages that are just tool calls (null content with tool_calls)
          if (msg.role === 'assistant' && msg.content === null && msg.tool_calls) return false;
          
          // Skip assistant messages that contain only tool result JSON
          if (msg.role === 'assistant' && msg.content && isToolResultJson(msg.content) && !msg.artifacts) return false;
          
          return true;
        });
        
        // Helper function to escape regex special characters
        const escapeRegExp = (string: string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        
        const adaptedMessages = filteredMessages.map((msg: any) => {
          const events: ChatMessage['events'] = [];
          
          // Handle legacy file attachment formats
          if (msg.role === 'user') {
            // Handle old 'files' array format
            if (msg.files) {
              msg.attachment = {
                name: msg.files[0].filename,
                content: null,
                type: 'application/octet-stream',
                isText: msg.files[0].filename.endsWith('.pdb') || msg.files[0].filename.endsWith('.cif')
              };
            }
            // Handle text-based file notification format
            else if (msg.content?.includes('User uploaded file')) {
              const filenameMatch = msg.content.match(/\[User uploaded file: '([^']+\.pdb)'\. It is available[^\]]*\]/i);
              if (filenameMatch) {
                const fullMatch = filenameMatch[0];
                const filename = filenameMatch[1];
                msg.attachment = {
                  name: filename,
                  content: null,
                  type: 'chemical/x-pdb',
                  isText: true,
                  isPDB: true  // Add explicit PDB type flag
                };
                // Remove only the file declaration while preserving other content
                // Remove only the file declaration while preserving other message content
                msg.content = msg.content
                  .replace(/\[User uploaded file: '.*?'\. It is available[^\]]*\]/gi, '')
                  .trim();
              }
            }
          }
      
          if (msg.role === 'assistant') {
            // Reconstruct visual events from artifacts
            if (msg.artifacts && Array.isArray(msg.artifacts)) {
              msg.artifacts.forEach((artifact: any) => {
                const artifactId = artifact.id || `hist-artifact-${uuidv4()}`;
                const artifactData = artifact.data || {};
                
                switch (artifact.type) {
                  case 'code_execution':
                    events.push({
                      id: `hist-code-${artifactId}`,
                      type: 'code_output',
                      content: { 
                        code: artifactData.code || '',
                        stdout: artifactData.stdout || '',
                        stderr: artifactData.stderr || ''
                      },
                      timestamp: Date.now()
                    });
                    // **MODIFICATION**: Removed plot_url handling from code_execution artifact.
                    break;
                  case 'molviewspec':
                    events.push({
                      id: `hist-mvs-${artifactId}`,
                      type: 'molviewspec',
                      content: { 
                        molviewspec: artifactData.molviewspec, 
                        filename: artifactData.filename 
                      },
                      timestamp: Date.now()
                    });
                    break;
                  case 'pdb_file':
                    const pdbUrl = artifactData.pdb_url || artifactData.visualization_url;
                    const fullPdbUrl = pdbUrl?.startsWith('http') ? pdbUrl : `${API_BASE_URL}${pdbUrl}`;
                    
                    events.push({
                      id: `hist-pdb-${artifactId}`,
                      type: 'pdb',
                      content: { 
                        url: fullPdbUrl, 
                        filename: artifactData.filename 
                      },
                      timestamp: Date.now()
                    });
                    break;
                }
              });
            }

            // **MODIFICATION**: Add final text content, parsing for images and links.
            if (msg.content && !isToolResultJson(msg.content)) {
                const content = msg.content;
                const imgRegex = /(<img\s+src="[^"]+"[^>]*>)/g;
                const linkRegex = /(<a\s+[^>]*href="[^"]*"[^>]*>.*?<\/a>)/g;
                
                // First split by img tags
                const imgParts = content.split(imgRegex).filter(Boolean);

                imgParts.forEach((imgPart: string) => {
                    if (imgPart.startsWith('<img')) {
                        const srcMatch = /src="([^"]+)"/.exec(imgPart);
                        const altMatch = /alt="([^"]*)"/.exec(imgPart);
                        if (srcMatch) {
                            const filename = srcMatch[1];
                            const altText = altMatch ? altMatch[1] : 'Generated Plot';
                            const plotUrl = `${API_BASE_URL}/api/temp_files/${sid}/${filename}`;
                            events.push({
                                id: `hist-plot-${uuidv4()}`,
                                type: 'plot',
                                content: { url: plotUrl, alt: altText },
                                timestamp: Date.now()
                            });
                        }
                    } else {
                        // Now split this part by link tags
                        const linkParts = imgPart.split(linkRegex).filter(Boolean);
                        
                        linkParts.forEach((linkPart: string) => {
                            if (linkPart.startsWith('<a')) {
                                const hrefMatch = /href="([^"]*)"/.exec(linkPart);
                                const textMatch = />([^<]*)</i.exec(linkPart);
                                const downloadMatch = /download="([^"]*)"/.exec(linkPart);
                                
                                if (hrefMatch) {
                                    const url = hrefMatch[1];
                                    const linkText = textMatch ? textMatch[1] : url;
                                    const isDownload = downloadMatch || linkPart.includes('download');
                                    
                                    events.push({
                                        id: `hist-link-${uuidv4()}`,
                                        type: 'link',
                                        content: { 
                                            url: url, 
                                            text: linkText,
                                            isDownload: !!isDownload,
                                            downloadName: downloadMatch ? downloadMatch[1] : null
                                        },
                                        timestamp: Date.now()
                                    });
                                }
                            } else if (linkPart.trim()) {
                                events.push({
                                    id: `hist-text-${uuidv4()}`,
                                    type: 'text',
                                    content: linkPart,
                                    timestamp: Date.now()
                                });
                            }
                        });
                    }
                });
            }
          } else {
            // For user messages, just add the content
            if (msg.content) {
              events.push({
                id: `hist-text-${uuidv4()}`,
                type: 'text',
                content: msg.content,
                timestamp: Date.now()
              });
            }
          }

          // Sort events roughly to ensure text is last (or inter-mingled)
          // For history, chronological order from parsing is sufficient.
          // Let's sort to group non-text items first for better visual flow.
          events.sort((a, b) => {
              if (a.type === 'text' && b.type !== 'text') return 1;
              if (a.type !== 'text' && b.type === 'text') return -1;
              return 0;
          });

          return {
            ...msg,
            timestamp: new Date().toISOString(),
            events: events,
          };
        });

        setMessages(adaptedMessages);
        didReplayMolViewSpecs.current = false; // Reset molviewspec replay guard on session load
        toast({
          title: 'Session Loaded',
          description: `Successfully loaded session ${sid}.`,
          status: 'success',
          duration: 3000,
        });
      } catch (error: any) {
        console.error("Failed to fetch session:", error);
        toast({
          title: 'Error Loading Session',
          description: error.message || 'The session could not be found or an error occurred.',
          status: 'error',
          duration: 5000,
        });
        window.history.replaceState({}, document.title, window.location.pathname);
        setSessionId(null);
      } finally {
        setIsLoading(false);
      }
    };

    const urlParams = new URLSearchParams(window.location.search);
    const sidFromUrl = urlParams.get('sessionId');

    if (sidFromUrl) {
      setSessionId(sidFromUrl);
      loadSessionHistory(sidFromUrl);
    } else {
      setSessionId(null);
    }
  }, [toast]);

  // Reset molviewspec replay guard when sessionId or messages change (for Chrome reliability)
  useEffect(() => {
    didReplayMolViewSpecs.current = false;
  }, [sessionId, messages]);

  // Only load the latest molviewspec event after session load
  useEffect(() => {
    if (!messages.length || isLoading) return;
    if (!onMolViewSpecUpdate) return;
    // Find the latest molviewspec event
    let latestMolViewSpec = null;
    for (let i = messages.length - 1; i >= 0; --i) {
      const msg = messages[i];
      if (msg.events && Array.isArray(msg.events)) {
        for (let j = msg.events.length - 1; j >= 0; --j) {
          const event = msg.events[j];
          if (event.type === 'molviewspec' && event.content?.molviewspec) {
            latestMolViewSpec = {
              molviewspec: event.content.molviewspec,
              filename: event.content.filename
            };
            break;
          }
        }
      }
      if (latestMolViewSpec) break;
    }
    if (latestMolViewSpec) {
      onMolViewSpecUpdate(latestMolViewSpec.molviewspec, latestMolViewSpec.filename);
    }
  }, [messages, isLoading, onMolViewSpecUpdate]);

  const userMessageBg = '#F7F9E5';
  const assistantMessageBg = '#f9fffd';
  const toolInfoMessageBg = 'purple.50';
  const errorMessageBg = 'red.100';
  const chatBg = 'white';
  const borderColor = 'gray.100';
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
    code: CodeBlock,
    // By not providing an 'img' override, ReactMarkdown will try to render them.
    // However, our parsing logic removes them from the text stream before it gets to ReactMarkdown.
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
            return (
            <Box w="16px" h="16px" display="flex" alignItems="center" justifyContent="center">
              <svg
              width="16px"
              height="16px"
              viewBox="0 0 16 16"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              stroke="#4CAF50"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.5"
              style={{ display: 'block' }}
              >
              <rect height="7.5" width="12.5" y="5.75" x="1.75" />
              <path d="m10.75 8.75v1.5m-5.5-1.5v1.5m-.5-7.5 3.25 3 3.25-3" />
              </svg>
            </Box>
            );
        case 'code_delta':
          return <Icon as={VscTerminal} w="16px" h="16px" color="orange.500" />;
        case 'code_output':
          return <Icon as={VscTerminal} w="16px" h="16px" color="green.500" />;
        case 'plot':
            return (
            <Box w="16px" h="16px" display="flex" alignItems="center" justifyContent="center">
              <svg
              viewBox="0 0 32 32"
              width="16px"
              height="16px"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              style={{ display: 'block' }}
              >
              <path
                d="M1091,264h-22a1,1,0,0,1-1-1V241a1,1,0,0,1,2,0v21h21A1,1,0,0,1,1091,264Zm-5-4a1,1,0,0,1-1-1V248a1,1,0,0,1,2,0v11A1,1,0,0,1,1086,260Zm-4,0h0a1,1,0,0,1-1-1v-7a1,1,0,0,1,1-1h0a1,1,0,0,1,1,1v7A1,1,0,0,1,1082,260Zm-4,0a1,1,0,0,1-1-1V243a1,1,0,0,1,2,0v16A1,1,0,0,1,1078,260Zm-4,0a1,1,0,0,1-1-1V249a1,1,0,0,1,2,0v10A1,1,0,0,1,1074,260Z"
                fill="#4CAF50"
                transform="translate(-1068 -240)"
              />
              </svg>
            </Box>
            );
        case 'pdb':
          return <Icon as={VscSymbolFile} w="16px" h="16px" color="green.500" />;
        case 'link':
          return (
            <Box w="16px" h="16px" display="flex" alignItems="center" justifyContent="center">
              <svg
                width="16px"
                height="16px"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                stroke="#4CAF50"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.5"
                style={{ display: 'block' }}
              >
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
              </svg>
            </Box>
          );
        case 'molviewspec':
            return (
            <Box w="16px" h="16px" display="flex" alignItems="center" justifyContent="center">
              <svg
              width="16px"
              height="16px"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
              style={{ display: 'block' }}
              >
              <defs>
                <style>
                {`.cls-1{fill:none;stroke:#4CAF50;stroke-miterlimit:10;stroke-width:1.5px;}`}
                </style>
              </defs>
              <polygon className="cls-1" points="12 18.63 18.84 15.21 18.84 7.68 12 4.32 5.16 7.68 5.16 15.21 12 18.63"/>
              <polyline className="cls-1" points="5.16 8.09 5.19 8.09 12 11.46 12 18.84"/>
              <polyline className="cls-1" points="12 18.84 12 11.46 18.81 8.09 18.84 8.09"/>
              <polyline className="cls-1" points="18.84 8.09 18.81 8.09 12 11.46 5.19 8.09 5.16 8.09"/>
              <polyline className="cls-1" points="1.25 6.14 1.25 1.25 6.14 1.25"/>
              <polyline className="cls-1" points="6.14 22.75 1.25 22.75 1.25 17.86"/>
              <polyline className="cls-1" points="22.75 17.86 22.75 22.75 17.86 22.75"/>
              <polyline className="cls-1" points="17.86 1.25 22.75 1.25 22.75 6.14"/>
              </svg>
            </Box>
            );
        case 'tool_start':
          return status === 'in_progress' ? 
            <Spinner size="xs" color="yellow.500" /> : 
            <Icon as={VscSymbolProperty} w="16px" h="16px" color="green.500" />;
        case 'tool_end':
          return <Icon as={VscCheck} w="16px" h="16px" color="green.500" />;
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
            <Box ml="4px" w="2px" h="20px" bg="gray.200" mt={1} />
          )}
        </VStack>

        {/* Event content */}
        <Box flex="1" minW="0">
          {event.type === 'text' && (
            <Box className="markdown-container">
              <ReactMarkdown
                remarkPlugins={[remarkGfm, remarkMath]}
                rehypePlugins={[rehypeKatex]}
                components={markdownComponents}
              >
                {event.content}
              </ReactMarkdown>
            </Box>
          )}

          {/* --- PENDING CODE_DELTA RENDERING --- */}
          {event.type === 'code_delta' && (
            <Box>
              <HStack spacing={2} mb={2} align="center">
                <Text fontSize="sm" fontWeight="bold" color="orange.600">
                  Pending Execution
                </Text>
              </HStack>
              <Box mb={2} bg={codeOutputBg} borderRadius="md" borderWidth="1px" borderColor={borderColor}>
                <HStack px={3} py={1} bg={codeBlockHeaderBg} borderBottomWidth="1px" borderColor={borderColor} justifyContent="space-between">
                  <Text fontSize="xs" color="gray.500" textTransform="uppercase">python</Text>
                  <Text fontSize="xs" color="gray.500">
                    Code to Run
                  </Text>
                </HStack>
                <Box>
                  <SyntaxHighlighter
                    style={codeStyle}
                    language="python"
                    PreTag="div"
                    customStyle={{
                      margin: 0,
                      padding: '1rem',
                      fontSize: '0.875rem',
                      backgroundColor: 'transparent',
                      borderRadius: 0
                    }}
                    wrapLongLines={false}
                    codeTagProps={{ style: { fontFamily: 'monospace' } }}
                  >
                    {event.content.code}
                  </SyntaxHighlighter>
                </Box>
              </Box>
            </Box>
          )}
          {/* --- END PENDING CODE_DELTA RENDERING --- */}

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

              {event.content.code && (
                <Box mb={2} bg={codeOutputBg} borderRadius="md" borderWidth="1px" borderColor={borderColor}>
                  <HStack px={3} py={1} bg={codeBlockHeaderBg} borderBottomWidth="1px" borderColor={borderColor} justifyContent="space-between">
                    <Text fontSize="xs" color="gray.500" textTransform="uppercase">python</Text>
                    <Text fontSize="xs" color="gray.500">
                      {codeOutputVisible[`${messageKey}-${event.id}`] ? 'Full Code' : 'Preview'}
                    </Text>
                  </HStack>
                  <Box>
                    <SyntaxHighlighter 
                      style={codeStyle} 
                      language="python" 
                      PreTag="div"
                      customStyle={{ 
                        margin: 0, 
                        padding: '1rem', 
                        fontSize: '0.875rem', 
                        backgroundColor: 'transparent',
                        borderRadius: 0
                      }}
                      wrapLongLines={false} 
                      codeTagProps={{ style: { fontFamily: 'monospace' } }}
                    >
                      {codeOutputVisible[`${messageKey}-${event.id}`] 
                        ? event.content.code 
                        : event.content.code.split('\n').slice(0, 3).join('\n') + 
                          (event.content.code.split('\n').length > 3 ? '\n...' : '')
                      }
                    </SyntaxHighlighter>
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
                  cursor="pointer"
                  _hover={{ transform: "scale(1.02)", transition: "transform 0.2s" }}
                  onClick={() => {
                    setPlotModalContent({ url: event.content.url, alt: event.content.alt || 'Generated Plot' });
                    openPlotModal();
                  }}
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} 
                />
                <Text fontSize="xs" color="gray.500" mt={1}>
                  Click to view full size
                </Text>
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
                Running: {event.content.name}...
              </Text>
              {event.status === 'in_progress' && <Spinner size="xs" color="yellow.500" />}
            </HStack>
          )}
          

          {event.type === 'tool_end' && (
            <HStack spacing={2} align="center">
                <Text fontSize="sm" color="green.400">
                Completed: {event.content.name}
                </Text>
              {event.duration && (
                <Text fontSize="xs" color="gray.500">
                  {formatDuration(event.duration)}
                </Text>
              )}
            </HStack>
          )}

          {event.type === 'link' && (
            <Box p={3} borderWidth="1px" borderRadius="md" borderColor={borderColor} bg="blue.50">
              <HStack justifyContent="space-between" mb={2} wrap="wrap">
                <HStack>
                  <Text fontSize="sm" fontWeight="bold" color="blue.600">
                    {event.content.isDownload ? 'Download Link' : 'External Link'}
                  </Text>
                  {event.duration && (
                    <Text fontSize="xs" color="gray.500">
                      {formatDuration(event.duration)}
                    </Text>
                  )}
                </HStack>
                <Button 
                  as="a" 
                  href={event.content.url} 
                  target={event.content.isDownload ? '_self' : '_blank'}
                  rel={event.content.isDownload ? undefined : 'noopener noreferrer'}
                  download={event.content.isDownload ? (event.content.downloadName || true) : undefined}
                  size="sm" 
                  colorScheme="blue" 
                  leftIcon={event.content.isDownload ? <Icon as={VscCloudDownload} /> : <ExternalLinkIcon />}
                  flexShrink={0}
                >
                  {event.content.isDownload ? 'Download' : 'Open Link'}
                </Button>
              </HStack>
              <Text fontSize="sm" wordBreak="break-all" color="gray.700">
                {event.content.text}
              </Text>
              {event.content.url !== event.content.text && (
                <Text fontSize="xs" color="gray.500" mt={1} wordBreak="break-all">
                  {event.content.url}
                </Text>
              )}
            </Box>
          )}
        </Box>
      </HStack>
    );
  };

  useEffect(() => {
    if (isLoading) {
      return;
    }
    
    const latestMessage = messages[messages.length - 1];
    if (latestMessage && 
        latestMessage.molViewSpecInfo?.molviewspec && 
        latestMessage.role === 'assistant' && 
        !latestMessage.id &&
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
  }, [messages, messages[messages.length - 1]?.content, isLoading]);

  useEffect(() => {

    
  
    async function fetchModels() {
      try {
        const res = await fetch(`${API_BASE_URL}/api/chat/available_models`);
        if (!res.ok) throw new Error('Failed to fetch models');
        const data = await res.json();
        if (data.models && data.models.length > 0) {
          setModels(data.models);
          setSelectedModel(data.models[0].id);
        } else {
          setModels([]);
          setSelectedModel('');
        }
      } catch (e) {
        setModels([]);
        setSelectedModel('');
      }
    }
    fetchModels();
  }, []);

useEffect(() => {
  const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === '/') {
        event.preventDefault();
        chatInputRef.current?.focus();
      }
      else if (event.key === '/' && !isLoading) {
        const activeElement = document.activeElement;
        const isInputFocused = activeElement && (
          activeElement.tagName === 'INPUT' || 
          activeElement.tagName === 'TEXTAREA' || 
          activeElement.hasAttribute('contenteditable')
        );
        
        if (!isInputFocused) {
          event.preventDefault();
          chatInputRef.current?.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isLoading]);

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
    if (attachmentData) {
      if (attachmentData.isPDB || attachmentData.name?.endsWith('.pdb')) {
        const url = attachmentData.content ?
          (attachmentData.content.startsWith('data:') ? attachmentData.content :
          `${API_BASE_URL}/api/temp_files/${sessionId}/${attachmentData.name}`) :
          `${API_BASE_URL}/api/temp_files/${sessionId}/${attachmentData.name}`;
        openPdbPreview(url, attachmentData.name);
      } else {
        setModalContent(attachmentData);
        openModal();
      }
    }
  };

  const openPlotInModal = (url: string, alt?: string) => {
    setPlotModalContent({ url, alt });
    openPlotModal();
  };

  const openPdbPreview = async (url: string, filename: string) => {
    try {
      if (url.startsWith('data:')) {
        // Handle data URL directly
        const content = decodeURIComponent(url.split(',')[1]);
        setPdbPreviewContent(content);
      } else {
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`Failed to fetch file: ${response.statusText}`);
        }
        const content = await response.text();
        setPdbPreviewContent(content);
      }
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
        events: [],
        startTime: messageStartTime,
      } as ChatMessage,
    ]);

    // Send only the new user message to the backend
    const userMessageForApi = {
      role: 'user',
      content: userMessageContent,
    };

    const fullHistoryForApi = prepareApiHistory(messagesWithUser);
    const apiPayload = {
      messages: fullHistoryForApi,
      stream: true,
      sessionId: sessionId,
      model: selectedModel,
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
        let processedChars = 0;
        let currentPos = 0;
        const currentTime = Date.now();

        while (currentPos < buffer.length) {
            const newlineIndex = buffer.indexOf('\n', currentPos);
            if (newlineIndex === -1) break;

            const line = buffer.substring(currentPos, newlineIndex).trim();
            const consumedLength = newlineIndex - currentPos + 1;

            if (line.startsWith('data: ')) {
                const jsonStr = line.substring(5).trim();
                if (jsonStr === '[DONE]') {
                    console.log("Received [DONE] signal.");
                } else if (jsonStr === '[PENDING]') {
                  // Handle pending signal (no-op for now)
                } else {
                  try {
                    const parsedEvent = JSON.parse(jsonStr);
                    if (parsedEvent.type === 'session_created' && parsedEvent.sessionId) {
                      setSessionId(parsedEvent.sessionId);
                      const newUrl = `${window.location.pathname}?sessionId=${parsedEvent.sessionId}`;
                      window.history.replaceState({ path: newUrl }, '', newUrl);
                    } else if (parsedEvent.type === 'text_delta' && parsedEvent.content) {
                      // Only append text, do not parse for <img> tags during streaming
                      setMessages(prev => prev.map(m => {
                        if (m.id === assistantMessageId) {
                          const newEvents = [...(m.events || [])];
                          const lastEvent = newEvents[newEvents.length - 1];
                          if (lastEvent && lastEvent.type === 'text') {
                            // Append to the existing text event
                            const updatedEvent = { ...lastEvent, content: lastEvent.content + parsedEvent.content };
                            newEvents[newEvents.length - 1] = updatedEvent;
                          } else {
                            // Or create a new one if it's the first bit of text
                            newEvents.push({
                              id: `text-${uuidv4()}`,
                              type: 'text',
                              content: parsedEvent.content,
                              timestamp: currentTime
                            });
                          }
                          return { ...m, events: newEvents };
                        }
                        return m;
                      }));
                    } else if (parsedEvent.type === 'code_delta') {
                      setMessages(prev => prev.map(m => {
                        if (m.id === assistantMessageId) {
                          const newEvents = [...(m.events || [])];
                          newEvents.push({
                            id: `code-delta-${uuidv4()}`,
                            type: 'code_delta',
                            content: { code: parsedEvent.content },
                            timestamp: currentTime
                          });
                          return { ...m, events: newEvents };
                        }
                        return m;
                      }));
                    } else if (parsedEvent.type === 'artifact' && parsedEvent.artifact_type === 'code_execution') {
                      setMessages(prev => prev.map(m => {
                        if (m.id === assistantMessageId) {
                          // Remove any code_delta events before adding code_output
                          const filteredEvents = (m.events || []).filter(e => e.type !== 'code_delta');
                          filteredEvents.push({
                            id: `code-output-${uuidv4()}`,
                            type: 'code_output',
                            content: {
                              code: parsedEvent.data?.code || '',
                              stdout: parsedEvent.data?.stdout || '',
                              stderr: parsedEvent.data?.stderr || ''
                            },
                            timestamp: currentTime
                          });
                          return { ...m, events: filteredEvents };
                        }
                        return m;
                      }));
                    } else if (parsedEvent.type === 'molviewspec') {
                      setMessages(prev => prev.map(m => {
                        if (m.id === assistantMessageId) {
                          const newEvents = [...(m.events || [])];
                          newEvents.push({
                            id: `mvs-${uuidv4()}`,
                            type: 'molviewspec',
                            content: { 
                              molviewspec: parsedEvent.content.molviewspec, 
                              filename: parsedEvent.content.filename 
                            },
                            timestamp: currentTime
                          });
                          return { ...m, events: newEvents };
                        }
                        return m;
                      }));
                    } else if (parsedEvent.type === 'pdb_file') {
                      setMessages(prev => prev.map(m => {
                        if (m.id === assistantMessageId) {
                          const newEvents = [...(m.events || [])];
                          newEvents.push({
                            id: `pdb-${uuidv4()}`,
                            type: 'pdb',
                            content: { 
                              url: `${API_BASE_URL}${parsedEvent.content.pdb_url}`, 
                              filename: parsedEvent.content.filename 
                            },
                            timestamp: currentTime
                          });
                          return { ...m, events: newEvents };
                        }
                        return m;
                      }));
                    } else if (parsedEvent.type === 'tool_start') {
                      setMessages(prev => prev.map(m => {
                        if (m.id === assistantMessageId) {
                          const newEvents = [...(m.events || [])];
                          newEvents.push({
                            id: `tool-start-${parsedEvent.content.id || uuidv4()}`,
                            type: 'tool_start',
                            content: { 
                              id: parsedEvent.content.id,
                              name: parsedEvent.content.name,
                              arguments: parsedEvent.content.arguments
                            },
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
                          const toolId = parsedEvent.content.id;
                          const toolStartEvent = m.events?.find(e => e.type === 'tool_start' && e.content.id === toolId);
                          const toolDuration = toolStartEvent ? currentTime - toolStartEvent.timestamp : undefined;
                          
                          const updatedEvents = (m.events || []).map(e => 
                            (e.type === 'tool_start' && e.content.id === toolId)
                              ? { ...e, status: 'completed' as const, duration: toolDuration }
                              : e
                          );
                          
                          updatedEvents.push({
                            id: `tool-end-${toolId || uuidv4()}`,
                            type: 'tool_end',
                            content: { 
                              id: toolId,
                              name: parsedEvent.content.name,
                              result: parsedEvent.content.result
                            },
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
                      toast({ 
                        title: 'Backend Error', 
                        description: parsedEvent.message || 'An unknown error occurred.', 
                        status: 'error', 
                        duration: 5000, 
                        isClosable: true 
                      });
                      
                      const errorSystemMessage: ChatMessage = {
                          id: `error-${uuidv4()}`, 
                          role: 'system', 
                          content: `Error: ${parsedEvent.message}`, 
                          timestamp: new Date().toISOString(), 
                          isError: true 
                      };
                      setMessages(prev => [...prev, errorSystemMessage]);
                    }
                  } catch (e) { console.error('Failed to parse SSE data line:', jsonStr, e); }
                }
            } else if (line !== '') {
                 console.warn("Received non-data SSE line:", line);
            }

            processedChars += consumedLength;
            currentPos += consumedLength;
        }

        buffer = buffer.substring(processedChars);
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          buffer += decoder.decode();
          processSSEBuffer();
          console.log("Stream finished");
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        processSSEBuffer();
      }

      // --- Post-stream parsing for <img> tags in handleSendMessage ---
      setMessages(prevMessages =>
        prevMessages.map(msg => {
          if (msg.id === assistantMessageId) {
            let finalEvents = [...(msg.events || [])];
            // Find all text events and split out <img> tags and <a> tags from each
            let newEvents: any[] = [];
            const imgRegex = /(<img\s+src="[^"]+"[^>]*>)/g;
            const linkRegex = /(<a\s+[^>]*href="[^"]*"[^>]*>.*?<\/a>)/g;
            
            for (const event of finalEvents) {
              if (event.type === 'text') {
                // First split by img tags
                const imgParts = event.content.split(imgRegex).filter(Boolean);
                
                for (const imgPart of imgParts) {
                  if (imgPart.startsWith('<img')) {
                    const srcMatch = /src="([^"]+)"/.exec(imgPart);
                    const altMatch = /alt="([^"]*)"/.exec(imgPart);
                    if (srcMatch && sessionId) {
                      const filename = srcMatch[1];
                      const altText = altMatch ? altMatch[1] : 'Generated Plot';
                      const plotUrl = `${API_BASE_URL}/api/temp_files/${sessionId}/${filename}`;
                      newEvents.push({
                        id: `plot-${uuidv4()}`,
                        type: 'plot',
                        content: { url: plotUrl, alt: altText },
                        timestamp: Date.now()
                      });
                    }
                  } else {
                    // Now split this part by link tags
                    const linkParts = imgPart.split(linkRegex).filter(Boolean);
                    
                    for (const linkPart of linkParts) {
                      if (linkPart.startsWith('<a')) {
                        const hrefMatch = /href="([^"]*)"/.exec(linkPart);
                        const textMatch = />([^<]*)</i.exec(linkPart);
                        const downloadMatch = /download="([^"]*)"/.exec(linkPart);
                        
                        if (hrefMatch) {
                          const url = hrefMatch[1];
                          const linkText = textMatch ? textMatch[1] : url;
                          const isDownload = downloadMatch || linkPart.includes('download');
                          
                          newEvents.push({
                            id: `link-${uuidv4()}`,
                            type: 'link',
                            content: { 
                              url: url, 
                              text: linkText,
                              isDownload: !!isDownload,
                              downloadName: downloadMatch ? downloadMatch[1] : null
                            },
                            timestamp: Date.now()
                          });
                        }
                      } else if (linkPart.trim()) {
                        newEvents.push({
                          id: `text-${uuidv4()}`,
                          type: 'text',
                          content: linkPart,
                          timestamp: Date.now()
                        });
                      }
                    }
                  }
                }
              } else {
                newEvents.push(event);
              }
            }
            // Always use the new events array if we processed any text events
            const hasTextEvents = finalEvents.some(e => e.type === 'text');
            if (hasTextEvents) {
              finalEvents = newEvents;
            }
            const { id, ...finalizedMsg } = msg;
            return {
              ...finalizedMsg,
              events: finalEvents,
              content: finalEvents?.filter(e => e.type === 'text').map(e => e.content).join('') || ''
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
      const isText = fileType.startsWith('text/') || /\.(pdb|cif|py|txt|md|gro)$/i.test(file.name);
      const isCSV = fileType === 'text/csv' || file.name.endsWith('.csv');
      const isPDB = file.name.endsWith('.pdb') || file.name.endsWith('.cif');
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

  const removeMessagesFromPoint = (messageIndex: number) => {
    const newMessages = messages.slice(0, messageIndex);
    setMessages(newMessages);
    toast({
      title: "Messages Removed",
      description: `Removed ${messages.length - messageIndex} message(s) from conversation`,
      status: "info",
      duration: 3000,
      isClosable: true,
    });
  };

  const retryFromPoint = async (messageIndex: number) => {
    if (isLoading) return;
    
    const userMessageIndex = messageIndex - 1;
    if (userMessageIndex < 0 || messages[userMessageIndex].role !== 'user') {
      toast({
        title: "Retry Error",
        description: "Cannot find the user message to retry from",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    const messagesUpToUser = messages.slice(0, messageIndex);
    setMessages(messagesUpToUser);

    const userMessage = messages[userMessageIndex];
    
    setIsLoading(true);
    abortControllerRef.current = new AbortController();

    const assistantMessageId = `assistant-${Date.now()}`;
    const messageStartTime = Date.now();
    setMessages((prev) => [
      ...prev,
      {
        role: 'assistant', content: '', timestamp: new Date().toISOString(), id: assistantMessageId,
        codeOutput: null, plotInfo: null, pdbInfo: null, molViewSpecInfo: null,
        events: [],
        startTime: messageStartTime,
      } as ChatMessage,
    ]);

    // Send only the user message that triggered this retry
    const userMessageForApi = {
      role: 'user',
      content: userMessage.content,
    };

    const truncatedHistoryForApi = prepareApiHistory(messagesUpToUser);
    const apiPayload = {
      messages: truncatedHistoryForApi,
      stream: true,
      sessionId: sessionId,
      model: selectedModel,
    };

    const formData = new FormData();
    formData.append('jsonData', JSON.stringify(apiPayload));
    
    if (userMessage.attachment) {
      toast({
        title: "Note",
        description: "File attachments cannot be retried. The retry will proceed without the original file.",
        status: "warning",
        duration: 5000,
        isClosable: true,
      });
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
        let processedChars = 0;
        let currentPos = 0;
        const currentTime = Date.now();

        while (currentPos < buffer.length) {
            const newlineIndex = buffer.indexOf('\n', currentPos);
            if (newlineIndex === -1) break;

            const line = buffer.substring(currentPos, newlineIndex).trim();
            const consumedLength = newlineIndex - currentPos + 1;

            if (line.startsWith('data: ')) {
                const jsonStr = line.substring(5).trim();
                if (jsonStr === '[DONE]') {
                    console.log("Received [DONE] signal.");
                } else if (jsonStr === '[PENDING]') {
                  // Handle pending signal (no-op for now)
                } else {
                  try {
                    const parsedEvent = JSON.parse(jsonStr);
                    if (parsedEvent.type === 'session_created' && parsedEvent.sessionId) {
                      setSessionId(parsedEvent.sessionId);
                      const newUrl = `${window.location.pathname}?sessionId=${parsedEvent.sessionId}`;
                      window.history.replaceState({ path: newUrl }, '', newUrl);
                    } else if (parsedEvent.type === 'text_delta' && parsedEvent.content) {
                      // Only append text, do not parse for <img> tags during streaming
                      setMessages(prev => prev.map(m => {
                        if (m.id === assistantMessageId) {
                          const newEvents = [...(m.events || [])];
                          const lastEvent = newEvents[newEvents.length - 1];
                          if (lastEvent && lastEvent.type === 'text') {
                            // Append to the existing text event
                            const updatedEvent = { ...lastEvent, content: lastEvent.content + parsedEvent.content };
                            newEvents[newEvents.length - 1] = updatedEvent;
                          } else {
                            // Or create a new one if it's the first bit of text
                            newEvents.push({
                              id: `text-${uuidv4()}`,
                              type: 'text',
                              content: parsedEvent.content,
                              timestamp: currentTime
                            });
                          }
                          return { ...m, events: newEvents };
                        }
                        return m;
                      }));
                    } else if (parsedEvent.type === 'code_delta') {
                      setMessages(prev => prev.map(m => {
                        if (m.id === assistantMessageId) {
                          const newEvents = [...(m.events || [])];
                          newEvents.push({
                            id: `code-delta-${uuidv4()}`,
                            type: 'code_delta',
                            content: { code: parsedEvent.content },
                            timestamp: currentTime
                          });
                          return { ...m, events: newEvents };
                        }
                        return m;
                      }));
                    } else if (parsedEvent.type === 'artifact' && parsedEvent.artifact_type === 'code_execution') {
                      setMessages(prev => prev.map(m => {
                        if (m.id === assistantMessageId) {
                          // Remove any code_delta events before adding code_output
                          const filteredEvents = (m.events || []).filter(e => e.type !== 'code_delta');
                          filteredEvents.push({
                            id: `code-output-${uuidv4()}`,
                            type: 'code_output',
                            content: {
                              code: parsedEvent.data?.code || '',
                              stdout: parsedEvent.data?.stdout || '',
                              stderr: parsedEvent.data?.stderr || ''
                            },
                            timestamp: currentTime
                          });
                          return { ...m, events: filteredEvents };
                        }
                        return m;
                      }));
                    } else if (parsedEvent.type === 'molviewspec') {
                      setMessages(prev => prev.map(m => {
                        if (m.id === assistantMessageId) {
                          const newEvents = [...(m.events || [])];
                          newEvents.push({
                            id: `mvs-${uuidv4()}`,
                            type: 'molviewspec',
                            content: { 
                              molviewspec: parsedEvent.content.molviewspec, 
                              filename: parsedEvent.content.filename 
                            },
                            timestamp: currentTime
                          });
                          return { ...m, events: newEvents };
                        }
                        return m;
                      }));
                    } else if (parsedEvent.type === 'pdb_file') {
                      setMessages(prev => prev.map(m => {
                        if (m.id === assistantMessageId) {
                          const newEvents = [...(m.events || [])];
                          newEvents.push({
                            id: `pdb-${uuidv4()}`,
                            type: 'pdb',
                            content: { 
                              url: `${API_BASE_URL}${parsedEvent.content.pdb_url}`, 
                              filename: parsedEvent.content.filename 
                            },
                            timestamp: currentTime
                          });
                          return { ...m, events: newEvents };
                        }
                        return m;
                      }));
                    } else if (parsedEvent.type === 'tool_start') {
                      setMessages(prev => prev.map(m => {
                        if (m.id === assistantMessageId) {
                          const newEvents = [...(m.events || [])];
                          newEvents.push({
                            id: `tool-start-${parsedEvent.content.id || uuidv4()}`,
                            type: 'tool_start',
                            content: { 
                              id: parsedEvent.content.id,
                              name: parsedEvent.content.name,
                              arguments: parsedEvent.content.arguments
                            },
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
                          const toolId = parsedEvent.content.id;
                          const toolStartEvent = m.events?.find(e => e.type === 'tool_start' && e.content.id === toolId);
                          const toolDuration = toolStartEvent ? currentTime - toolStartEvent.timestamp : undefined;
                          
                          const updatedEvents = (m.events || []).map(e => 
                            (e.type === 'tool_start' && e.content.id === toolId)
                              ? { ...e, status: 'completed' as const, duration: toolDuration }
                              : e
                          );
                          
                          updatedEvents.push({
                            id: `tool-end-${toolId || uuidv4()}`,
                            type: 'tool_end',
                            content: { 
                              id: toolId,
                              name: parsedEvent.content.name,
                              result: parsedEvent.content.result
                            },
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
                      toast({ 
                        title: 'Backend Error', 
                        description: parsedEvent.message || 'An unknown error occurred.', 
                        status: 'error', 
                        duration: 5000, 
                        isClosable: true 
                      });
                      
                      const errorSystemMessage: ChatMessage = {
                          id: `error-${uuidv4()}`, 
                          role: 'system', 
                          content: `Error: ${parsedEvent.message}`, 
                          timestamp: new Date().toISOString(), 
                          isError: true 
                      };
                      setMessages(prev => [...prev, errorSystemMessage]);
                    }
                  } catch (e) { console.error('Failed to parse SSE data line:', jsonStr, e); }
                }
            } else if (line !== '') {
                 console.warn("Received non-data SSE line:", line);
            }

            processedChars += consumedLength;
            currentPos += consumedLength;
        }

        buffer = buffer.substring(processedChars);
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          buffer += decoder.decode();
          processSSEBuffer();
          console.log("Retry stream finished");
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        processSSEBuffer();
      }

      // --- Apply the same post-stream parsing in retryFromPoint ---
        setMessages(prevMessages =>
          prevMessages.map(msg => {
            if (msg.id === assistantMessageId) {
              let finalEvents = [...(msg.events || [])];
              // Replace findLastIndex with manual reverse search for last text event
              let lastTextEventIndex = -1;
              for (let i = finalEvents.length - 1; i >= 0; --i) {
                const e: any = finalEvents[i];
                if (e.type === 'text') {
                  lastTextEventIndex = i;
                  break;
                }
              }
              if (lastTextEventIndex !== -1) {
                const textEvent = finalEvents[lastTextEventIndex];
                const fullContent = textEvent.content;
                const imgRegex = /(<img\s+src="[^"]+"[^>]*>)/g;
                const parts = fullContent.split(imgRegex).filter(Boolean);
                if (parts.length > 1 || (parts.length === 1 && parts[0].startsWith('<img'))) {
                  const newSegmentedEvents: any[] = [];
                  const currentTime = Date.now();
                  const linkRegex = /(<a\s+[^>]*href="[^"]*"[^>]*>.*?<\/a>)/g;
                  
                  parts.forEach((part: string) => {
                    if (part.startsWith('<img')) {
                      const srcMatch = /src="([^"]+)"/.exec(part);
                      const altMatch = /alt="([^"]*)"/.exec(part);
                      if (srcMatch && sessionId) {
                        const filename = srcMatch[1];
                        const altText = altMatch ? altMatch[1] : 'Generated Plot';
                        const plotUrl = `${API_BASE_URL}/api/temp_files/${sessionId}/${filename}`;
                        newSegmentedEvents.push({
                          id: `plot-${uuidv4()}`,
                          type: 'plot',
                          content: { url: plotUrl, alt: altText },
                          timestamp: currentTime
                        });
                      }
                    } else if (part.trim()) {
                      // Now split this part by link tags
                      const linkParts = part.split(linkRegex).filter(Boolean);
                      
                      linkParts.forEach((linkPart: string) => {
                        if (linkPart.startsWith('<a')) {
                          const hrefMatch = /href="([^"]*)"/.exec(linkPart);
                          const textMatch = />([^<]*)</i.exec(linkPart);
                          const downloadMatch = /download="([^"]*)"/.exec(linkPart);
                          
                          if (hrefMatch) {
                            const url = hrefMatch[1];
                            const linkText = textMatch ? textMatch[1] : url;
                            const isDownload = downloadMatch || linkPart.includes('download');
                            
                            newSegmentedEvents.push({
                              id: `link-${uuidv4()}`,
                              type: 'link',
                              content: { 
                                url: url, 
                                text: linkText,
                                isDownload: !!isDownload,
                                downloadName: downloadMatch ? downloadMatch[1] : null
                              },
                              timestamp: currentTime
                            });
                          }
                        } else if (linkPart.trim()) {
                          newSegmentedEvents.push({
                            id: `text-${uuidv4()}`,
                            type: 'text',
                            content: linkPart,
                            timestamp: currentTime
                          });
                        }
                      });
                    }
                  });
                  if (newSegmentedEvents.length > 0) {
                    finalEvents.splice(lastTextEventIndex, 1, ...newSegmentedEvents);
                  }
                }
              }
              const { id, ...finalizedMsg } = msg;
              return {
                ...finalizedMsg,
                events: finalEvents,
                content: finalEvents?.filter(e => e.type === 'text').map(e => e.content).join('') || ''
              };
            }
            return msg;
          })
        );

    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log('Retry fetch aborted');
        toast({ title: 'Retry Cancelled', status: 'info', duration: 2000 });
        setMessages((prev) => prev.filter((msg) => msg.id !== assistantMessageId));
      } else {
        console.error('Error during retry:', error);
        toast({ title: 'Retry Error', description: error.message || 'Failed to retry the request.', status: 'error', duration: 5000, isClosable: true });
        setMessages((prev) => prev.filter((msg) => msg.id !== assistantMessageId));
        setMessages((prev) => [...prev, { role: 'system', content: `Retry Error: ${error.message || 'Failed to get response.'}`, timestamp: new Date().toISOString(), isError: true }]);
      }
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };

  return (
    <Flex direction="column" h="100%" bg={chatBg}>
      <Box ref={chatContainerRef} flex="1" overflowY="auto" p={4} position="relative">
        {messages.length === 0 && !isLoading ? (
          <Flex position="absolute" top="0" left="0" right="0" bottom="0" align="center" justify="center" direction="column" textAlign="center" p={4} pointerEvents="none">
            <Heading size="lg" mb={2} color={welcomeHeadingColor}>GlyCopilot</Heading>
            <Text fontSize="xl" color={welcomeTextColor}>What can I help with?</Text>
            <Text fontSize="sm" color="gray.500" mt={4}>(Ask about proteins, glycans, use tools, upload files.)</Text>
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
                          {(msg.attachment?.name?.endsWith('.pdb') || msg.attachment?.type === 'chemical/x-pdb') ? (
                            <Icon as={VscSymbolFile} color="blue.500" boxSize="1em" />
                          ) : (
                            <AttachmentIcon boxSize="1em" />
                          )}
                          <Text fontSize="sm" noOfLines={1} title={msg.attachment?.name}>{msg.attachment?.name}</Text>
                        </HStack>
                      </Button>
                    )}

                    {msg.role === 'assistant' && msg.events && msg.events.length > 0 ? (
                      <Box>
                        {msg.events.map((event, eventIdx) => (
                          <EventRenderer 
                            key={event.id || `event-${eventIdx}`} 
                            event={event} 
                            messageKey={messageKey}
                            onMolViewSpecUpdate={onMolViewSpecUpdate}
                            isLast={eventIdx === msg.events!.length - 1}
                          />
                        ))}
                      </Box>
                    ) : msg.role === 'assistant' && msg.id ? (
                      null
                    ) : (
                      msg.content && msg.content.trim() && (
                        <Box className="markdown-container">
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm, remarkMath]}
                            rehypePlugins={[rehypeKatex]}
                            components={markdownComponents}
                          >
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
                        <HStack justify="space-between" align="center" mt={1}>
                          <Text fontSize="xs" color={attachmentTextColor}>
                              {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </Text>
                          
                          <HStack spacing={1}>
                            {msg.role === 'user' && idx < messages.length - 1 && (
                              <Tooltip label="Remove from this point" placement="top">
                                <IconButton
                                  aria-label="Remove from this point"
                                  icon={<DeleteIcon />}
                                  size="xs"
                                  variant="ghost"
                                  colorScheme="blue"
                                  onClick={() => removeMessagesFromPoint(idx)}
                                  isDisabled={isLoading}
                                />
                              </Tooltip>
                            )}
                            
                            {msg.role === 'assistant' && !msg.id && idx > 0 && (
                              <Tooltip label="Retry this response" placement="top">
                                <IconButton
                                  aria-label="Retry response"
                                  icon={<RepeatIcon />}
                                  size="xs"
                                  variant="ghost"
                                  colorScheme="blue"
                                  onClick={() => retryFromPoint(idx)}
                                  isDisabled={isLoading}
                                />
                              </Tooltip>
                            )}
                          </HStack>
                        </HStack>
                    )}
                  </Box>
                </Flex>
              );
            })}
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

      {/* Chat input and controls toggle */}
      <Box p={4} borderTop="1px solid" borderColor={borderColor} bg={inputBg}>
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
        <Flex align="center" position="relative">
          <input type="file" ref={fileInputRef} style={{ display: 'none' }} onChange={handleFileChange} accept="image/*, text/*, .pdb, .cif, .py, .csv, .json, .md" />
          <Tooltip label="Toggle controls" placement="top">
            <IconButton
              aria-label="Toggle controls"
              icon={showControls ? <ChevronDownIcon /> : <ChevronUpIcon />}
              onClick={() => setShowControls(!showControls)}
              mr={2}
              variant="ghost"
              isDisabled={isLoading}
            />
          </Tooltip>
          <Tooltip label="Attach file" placement="top">
            <IconButton aria-label="Attach file" icon={<AttachmentIcon />} onClick={handleFileAttach} mr={2} variant="ghost" isDisabled={isLoading || !!fileAttachment} />
          </Tooltip>
          <Box flex="1" position="relative">
            <Input 
              ref={chatInputRef} 
              placeholder="Ask about proteins, analyze data, or generate structures..." 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); if (!isLoading) handleSendMessage(); }}}
              bg={inputBg} 
              isDisabled={isLoading} 
              borderRadius="full" 
              size="md"
              pr="60px"
            />
            <HStack 
              position="absolute" 
              right="12px" 
              top="50%" 
              transform="translateY(-50%)" 
              spacing={1}
              pointerEvents="none"
              opacity={input ? 0 : 0.5}
              transition="opacity 0.2s"
            >
              <Kbd fontSize="xs">/</Kbd>
            </HStack>
          </Box>
          <Tooltip label={isLoading ? "Cancel Request" : "Send message"} placement="top">
             {isLoading ? (
                  <IconButton aria-label="Cancel request" icon={<CloseIcon />} colorScheme="red" onClick={cancelRequest}
                              isLoading={false} isDisabled={!abortControllerRef.current} borderRadius="full" size="md" ml={2} />
             ) : (
                 <IconButton aria-label="Send message" icon={<Icon as={PaperPlane} />} colorScheme="blue" onClick={handleSendMessage}
                              isLoading={false} isDisabled={isLoading || (!input.trim() && !fileAttachment)} borderRadius="full" size="md" ml={2} />
             )}
          </Tooltip>
        </Flex>
        
        <Collapse in={showControls} animateOpacity>
          <Box
            mt={3}
            p={3}
            bg="white"
            borderRadius="md"
            borderWidth="1px"
            borderColor={borderColor}
          >
            <HStack spacing={2} justify="flex-start">
                
              <Button
                size="sm"
                variant="solid"
                bg="purple.50"
                borderColor="purple.200"
                borderRadius="full"
                color="purple.700"
                leftIcon={<ChatIcon />}
                _hover={{ bg: "purple.100", borderColor: "purple.300" }}
                onClick={() => {
                  setMessages([]);
                  setSessionId(null);
                  window.history.replaceState({}, document.title, window.location.pathname);
                  toast({ title: 'Started new chat', status: 'info', duration: 2000 });
                }}
              >
                New Chat
              </Button>
              <Button
                size="sm"
                variant="solid"
                bg="purple.50"
                borderColor="purple.200"
                color="purple.700"
                borderRadius="full"
                leftIcon={<LinkIcon />}
                _hover={{ bg: "purple.100", borderColor: "purple.300" }}
                onClick={() => {
                  if (sessionId) {
                    navigator.clipboard.writeText(`${window.location.origin}${window.location.pathname}?sessionId=${sessionId}`);
                    toast({ title: 'Session link copied!', status: 'success', duration: 2000 });
                  } else {
                    toast({ title: 'No session to share yet.', status: 'info', duration: 2000 });
                  }
                }}
              >
                Share Session
              </Button>
              <Button
                size="sm"
                variant="solid"
                bg="purple.50"
                color="purple.700"
                borderColor="purple.200"
                borderRadius="full"
                leftIcon={<DownloadIcon />}
                _hover={{ bg: "purple.100", borderColor: "purple.300" }}
                onClick={async () => {
                  if (!sessionId) {
                    toast({ title: 'No session to download.', status: 'info', duration: 2000 });
                    return;
                  }
                  try {
                    const res = await fetch(`${API_BASE_URL}/api/session/download/${sessionId}`);
                    if (!res.ok) throw new Error('Failed to download session files.');
                    const blob = await res.blob();
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `glycopilot-session-${sessionId}.zip`;
                    document.body.appendChild(a);
                    a.click();
                    a.remove();
                    window.URL.revokeObjectURL(url);
                  } catch (e) {
                    toast({ title: 'Download failed.', status: 'error', duration: 3000 });
                  }
                }}
              >
                Download Files
              </Button>
              <Spacer />
              <HStack align="center">
                <Box as="span" display="flex" alignItems="center" justifyContent="center" mr={1}>
                  <svg fill="#000000" width="20px" height="20px" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                    <g>
                      <path d="M93.998,45.312c0-3.676-1.659-7.121-4.486-9.414c0.123-0.587,0.184-1.151,0.184-1.706c0-4.579-3.386-8.382-7.785-9.037   c0.101-0.526,0.149-1.042,0.149-1.556c0-4.875-3.842-8.858-8.655-9.111c-0.079-0.013-0.159-0.024-0.242-0.024   c-0.04,0-0.079,0.005-0.12,0.006c-0.04-0.001-0.079-0.006-0.12-0.006c-0.458,0-0.919,0.041-1.406,0.126   c-0.846-4.485-4.753-7.825-9.437-7.825c-5.311,0-9.632,4.321-9.632,9.633v65.918c0,6.723,5.469,12.191,12.191,12.191   c4.46,0,8.508-2.413,10.646-6.246c0.479,0.104,0.939,0.168,1.401,0.198c2.903,0.185,5.73-0.766,7.926-2.693   c2.196-1.927,3.51-4.594,3.7-7.51c0.079-1.215-0.057-2.434-0.403-3.638c3.796-2.691,6.027-6.952,6.027-11.621   c0-3.385-1.219-6.635-3.445-9.224C92.731,51.505,93.998,48.471,93.998,45.312z M90.938,62.999c0,3.484-1.582,6.68-4.295,8.819   c-2.008-3.196-5.57-5.237-9.427-5.237c-0.828,0-1.5,0.672-1.5,1.5s0.672,1.5,1.5,1.5c3.341,0,6.384,2.093,7.582,5.208   c0.41,1.088,0.592,2.189,0.521,3.274c-0.138,2.116-1.091,4.051-2.685,5.449c-1.594,1.399-3.641,2.094-5.752,1.954   c-0.594-0.039-1.208-0.167-1.933-0.402c-0.74-0.242-1.541,0.124-1.846,0.84c-1.445,3.404-4.768,5.604-8.465,5.604   c-5.068,0-9.191-4.123-9.191-9.191V16.399c0-3.657,2.975-6.633,6.632-6.633c3.398,0,6.194,2.562,6.558,5.908   c-2.751,1.576-4.612,4.535-4.612,7.926c0,0.829,0.672,1.5,1.5,1.5s1.5-0.671,1.5-1.5c0-3.343,2.689-6.065,6.016-6.13   c3.327,0.065,6.016,2.787,6.016,6.129c0,0.622-0.117,1.266-0.359,1.971c-0.057,0.166-0.793,2.189-0.793,2.189   c-0.118,0.465-0.006,0.959,0.301,1.328c0.307,0.369,0.765,0.569,1.251,0.538c0.104-0.007,0.208-0.02,0.392-0.046   c3.383,0,6.136,2.753,6.136,6.136c0,0.572-0.103,1.159-0.322,1.849c-0.203,0.635,0.038,1.328,0.591,1.7   c2.434,1.639,3.909,4.329,4.014,7.242c0,0.004-0.001,0.008-0.001,0.012c0,5.03-4.092,9.123-9.122,9.123   s-9.123-4.093-9.123-9.123c0-0.829-0.672-1.5-1.5-1.5s-1.5,0.671-1.5,1.5c0,6.685,5.438,12.123,12.123,12.123   c2.228,0,4.31-0.615,6.106-1.668C89.88,57.539,90.938,60.212,90.938,62.999z"/>
                      <path d="M38.179,6.766c-4.684,0-8.59,3.34-9.435,7.825c-0.488-0.085-0.949-0.126-1.407-0.126c-0.04,0-0.079,0.005-0.12,0.006   c-0.04-0.001-0.079-0.006-0.12-0.006c-0.083,0-0.163,0.011-0.242,0.024c-4.813,0.253-8.654,4.236-8.654,9.111   c0,0.514,0.049,1.03,0.149,1.556c-4.399,0.655-7.785,4.458-7.785,9.037c0,0.554,0.061,1.118,0.184,1.706   c-2.827,2.293-4.486,5.738-4.486,9.414c0,3.159,1.266,6.193,3.505,8.463c-2.227,2.589-3.446,5.839-3.446,9.224   c0,4.669,2.231,8.929,6.027,11.621c-0.347,1.204-0.482,2.423-0.402,3.639c0.19,2.915,1.503,5.582,3.699,7.509   c2.196,1.928,5.015,2.879,7.926,2.693c0.455-0.03,0.919-0.096,1.4-0.199c2.138,3.834,6.186,6.247,10.646,6.247   c6.722,0,12.191-5.469,12.191-12.191V16.399C47.811,11.087,43.49,6.766,38.179,6.766z M44.811,82.317   c0,5.068-4.123,9.191-9.191,9.191c-3.697,0-7.02-2.2-8.464-5.604c-0.241-0.567-0.793-0.914-1.381-0.914   c-0.154,0-0.311,0.023-0.465,0.074c-0.724,0.235-1.338,0.363-1.933,0.402c-2.119,0.139-4.158-0.556-5.751-1.954   c-1.594-1.398-2.547-3.333-2.685-5.449c-0.076-1.16,0.125-2.336,0.598-3.495c0.007-0.017,0.005-0.036,0.011-0.053   c1.342-3.056,4.225-4.953,7.597-4.953c0.829,0,1.5-0.672,1.5-1.5s-0.671-1.5-1.5-1.5c-3.938,0-7.501,2.007-9.548,5.239   c-2.701-2.139-4.277-5.327-4.277-8.802c0-2.787,1.06-5.46,2.978-7.549c1.796,1.053,3.879,1.668,6.107,1.668   c6.685,0,12.123-5.438,12.123-12.123c0-0.829-0.671-1.5-1.5-1.5s-1.5,0.671-1.5,1.5c0,5.03-4.092,9.123-9.123,9.123   s-9.123-4.093-9.123-9.123c0-0.002-0.001-0.004-0.001-0.006c0.103-2.915,1.578-5.607,4.013-7.248   c0.553-0.372,0.793-1.064,0.591-1.699c-0.22-0.691-0.322-1.278-0.322-1.85c0-3.376,2.741-6.125,6.195-6.125   c0.007,0,0.015,0,0.022,0c0.103,0.014,0.206,0.027,0.311,0.034c0.485,0.03,0.948-0.171,1.254-0.542   c0.307-0.372,0.417-0.868,0.294-1.334c0-0.001-0.003-0.014-0.008-0.031c0.003-0.035,0.006-0.067,0.007-0.095   c0.005-0.18-0.022-0.359-0.081-0.529c-0.242-0.707-0.359-1.352-0.359-1.972c0-3.342,2.688-6.065,6.016-6.129   c3.328,0.065,6.016,2.787,6.016,6.13c0,0.829,0.671,1.5,1.5,1.5s1.5-0.671,1.5-1.5c0-3.391-1.861-6.35-4.612-7.926   c0.364-3.346,3.16-5.908,6.558-5.908c3.657,0,6.632,2.976,6.632,6.633V82.317z"/>
                    </g>
                  </svg>
                </Box>
                <Select
                  size="sm"
                  value={selectedModel}
                  onChange={e => setSelectedModel(e.target.value)}
                  variant="filled"
                  bg="purple.100"
                  borderRadius="full"
                  focusBorderColor="purple.300"
                  _hover={{ bg: "purple.100" }}
                  color="purple.700"
                  isDisabled={models.length === 0}
                  
                >
                  {models.map(m => (
                    <option
                      key={m.id}
                      value={m.id}
                      style={{
                        backgroundColor: 'white', // This works in most browsers except Chrome on Windows
                        color: '#4B2067',
                      }}
                    >
                      {m.label}
                    </option>
                  ))}
                </Select>
              </HStack>
            </HStack>
          </Box>
        </Collapse>
      </Box>

      <Modal isOpen={isModalOpen} onClose={closeModal} size="xl" isCentered scrollBehavior="inside">
               <ModalOverlay />
        <ModalContent>
          <ModalHeader title={modalContent?.name} isTruncated>{modalContent?.name || 'Attachment'}</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            {(modalContent?.type === 'chemical/x-pdb' || modalContent?.name?.endsWith('.pdb')) && sessionId ? (
              <Box position="relative" h="60vh">
                <Box position="absolute" top="0" left="0" right="0" bottom="0" overflowY="auto">
                  <SyntaxHighlighter
                    language="pdb"
                    style={oneLight}
                    customStyle={{
                      margin: 0,
                      backgroundColor: 'transparent',
                      fontSize: '0.8rem'
                    }}
                  >
                    {modalContent.content || `// Loading structure file from:\n// ${API_BASE_URL}/api/temp_files/${sessionId}/${modalContent?.name}`}
                  </SyntaxHighlighter>
                </Box>
              </Box>
            ) : (modalContent?.isImage && typeof modalContent.content === 'string') ? (
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

      <Modal isOpen={isPdbPreviewOpen} onClose={closePdbPreview} size="xl" isCentered scrollBehavior="inside">
        <ModalOverlay />
        <ModalContent maxH="80vh">
          <ModalHeader>Structure File Preview</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6} textAlign="center">
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

      <Modal isOpen={isPlotModalOpen} onClose={closePlotModal} size="6xl" isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>{plotModalContent?.alt || 'Generated Plot'}</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6} textAlign="center">
            {plotModalContent && (
              <Image 
                src={plotModalContent.url} 
                alt={plotModalContent.alt || 'Generated Plot'} 
                maxW="100%" 
                maxH="80vh"
                mx="auto" 
                display="block"
                borderRadius="md"
                boxShadow="lg"
              />
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
        if (!molviewspec || typeof molviewspec !== 'object') {
          console.error('Invalid molviewspec data:', molviewspec);
          return;
        }

        let mvsData;
        if (typeof molviewspec === 'string') {
          mvsData = (window as any).molstar.PluginExtensions.mvs.MVSData.fromMVSJ(molviewspec);
        } else {
          mvsData = (window as any).molstar.PluginExtensions.mvs.MVSData.fromMVSJ(JSON.stringify(molviewspec));
        }
        
        (window as any).molstar.PluginExtensions.mvs.loadMVS(molViewerRef.plugin, mvsData, { 
          sourceUrl: `data:${filename}`, 
          sanityChecks: true, 
          replaceExisting: true 
        });
      } catch (error) {
        console.error('Error loading MolViewSpec:', error);
      }
    } else {
      console.warn('MolViewer not initialized yet, cannot load MolViewSpec');
    }
  }, [molViewerRef]);

  useEffect(() => {
    const loadMolstar = async () => {
      if ((window as any).molstar) {
        initializeViewer();
        return;
      }

      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.type = 'text/css';
      link.href = '/viewer3/molstar.css';
      document.head.appendChild(link);

      const script = document.createElement('script');
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
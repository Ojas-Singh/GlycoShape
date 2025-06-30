import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  VStack,
  HStack,
  Text,
  Divider,
  Spinner,
  Alert,
  AlertIcon,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  Icon,
  Badge,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Input,
  FormControl,
  FormLabel,
  Progress,
  useColorModeValue,
} from "@chakra-ui/react";
import { ChevronRightIcon, DownloadIcon, ExternalLinkIcon, AttachmentIcon, AddIcon, CloseIcon } from "@chakra-ui/icons";
import { FaFolder, FaFile } from "react-icons/fa";

interface FileItem {
  name: string;
  type: 'file' | 'directory';
  size?: number;
  lastModified?: string;
}

interface FileBrowserProps {
  initialFolder?: string;
}

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPath: string;
  onUploadSuccess: () => void;
}

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const UploadModal: React.FC<UploadModalProps> = ({ isOpen, onClose, currentPath, onUploadSuccess }) => {
  const [uploadKey, setUploadKey] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const toast = useToast();
  const apiUrl = process.env.REACT_APP_API_URL;
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const borderColor = useColorModeValue('gray.300', 'gray.600');
  const bgColor = useColorModeValue('gray.50', 'gray.700');

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFiles(e.dataTransfer.files);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedFiles(e.target.files);
    }
  };

  const removeFile = (indexToRemove: number) => {
    if (!selectedFiles) return;
    
    const filesArray = Array.from(selectedFiles);
    filesArray.splice(indexToRemove, 1);
    
    // Create a new FileList-like object
    const newFileList = new DataTransfer();
    filesArray.forEach(file => {
      newFileList.items.add(file);
    });
    
    setSelectedFiles(newFileList.files.length > 0 ? newFileList.files : null);
    
    // Also update the file input
    if (fileInputRef.current) {
      fileInputRef.current.files = newFileList.files;
    }
  };

  const handleUpload = async () => {
    if (!uploadKey.trim()) {
      toast({
        title: "Upload Key Required",
        description: "Please enter a valid upload key",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (!selectedFiles || selectedFiles.length === 0) {
      toast({
        title: "No Files Selected",
        description: "Please select files to upload",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('upload_key', uploadKey);
      formData.append('target_path', currentPath);

      // Add all selected files with their relative paths
      Array.from(selectedFiles).forEach((file, index) => {
        formData.append('files', file);
        // Include the relative path for folder structure preservation
        const relativePath = file.webkitRelativePath || file.name;
        formData.append('file_paths', relativePath);
      });

      const response = await fetch(`${apiUrl}/api/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Upload failed: ${response.status}`);
      }

      const result = await response.json();
      
      // Check if any files had folder structure
      const hasSubfolders = Array.from(selectedFiles).some(file => 
        file.webkitRelativePath && file.webkitRelativePath.includes('/')
      );
      
      toast({
        title: "Upload Successful",
        description: hasSubfolders 
          ? `Successfully uploaded ${selectedFiles.length} file(s) with folder structure preserved`
          : `Successfully uploaded ${selectedFiles.length} file(s)`,
        status: "success",
        duration: 5000,
        isClosable: true,
      });

      // Reset form
      setUploadKey('');
      setSelectedFiles(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      onUploadSuccess();
      onClose();
      
    } catch (error) {
      toast({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Upload Files</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={4}>
            <FormControl isRequired>
              <FormLabel>Upload Key</FormLabel>
              <Input
                type="password"
                placeholder="Enter your upload key"
                value={uploadKey}
                onChange={(e) => setUploadKey(e.target.value)}
                disabled={uploading}
              />
            </FormControl>

            <FormControl>
              <FormLabel>Target Directory</FormLabel>
              <Text fontSize="sm" color="gray.600">
                {currentPath ? `/files/${currentPath}` : '/files/'}
              </Text>
              <Text fontSize="xs" color="gray.500" mt={1}>
                Files will be uploaded to this directory. Folder structure will be preserved.
              </Text>
            </FormControl>

            <FormControl>
              <FormLabel>Select Folder</FormLabel>
              <Box
                border="2px dashed"
                borderColor={dragActive ? "blue.300" : borderColor}
                borderRadius="md"
                p={6}
                textAlign="center"
                bg={dragActive ? "blue.50" : bgColor}
                cursor="pointer"
                transition="all 0.2s"
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => {
                  if (fileInputRef.current) {
                    // Set to allow both files and directories
                    fileInputRef.current.setAttribute('webkitdirectory', '');
                    fileInputRef.current.click();
                  }
                }}
                width="100%"
              >
                <VStack spacing={2}>
                  <AddIcon color="gray.400" />
                  <Text>
                    {selectedFiles && selectedFiles.length > 0
                      ? `${selectedFiles.length} file(s) selected`
                      : 'Drag & drop files or folders here, or click to select'}
                  </Text>
                  <Text fontSize="sm" color="gray.500">
                    You can deselect files once selected.
                  </Text>
                </VStack>
              </Box>
              
              <Input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleFileSelect}
                display="none"
              />
            </FormControl>

            {selectedFiles && selectedFiles.length > 0 && (
              <Box w="100%">
                <HStack justify="space-between" align="center" mb={2}>
                  <Text fontSize="sm" fontWeight="medium">
                    Selected Files ({selectedFiles.length} total):
                  </Text>
                  <Button
                    size="xs"
                    variant="outline"
                    colorScheme="red"
                    onClick={() => {
                      setSelectedFiles(null);
                      if (fileInputRef.current) {
                        fileInputRef.current.value = '';
                      }
                    }}
                    disabled={uploading}
                  >
                    Clear All
                  </Button>
                </HStack>
                <Box maxH="200px" overflowY="auto" border="1px solid" borderColor="gray.200" borderRadius="md" p={3}>
                  {Array.from(selectedFiles).slice(0, 20).map((file, index) => {
                    const displayPath = file.webkitRelativePath || file.name;
                    const isInFolder = displayPath.includes('/');
                    
                    return (
                      <HStack key={index} fontSize="xs" color="gray.600" spacing={2} py={1}>
                        <Button
                          size="xs"
                          variant="ghost"
                          colorScheme="red"
                          minWidth="auto"
                          height="auto"
                          padding={1}
                          onClick={() => removeFile(index)}
                          disabled={uploading}
                        >
                          <CloseIcon boxSize={2} />
                        </Button>
                        <Icon 
                          as={isInFolder ? ExternalLinkIcon : AttachmentIcon} 
                          boxSize={3}
                          color={isInFolder ? "blue.400" : "gray.400"}
                        />
                        <Text flex={1} isTruncated>{displayPath}</Text>
                        <Text color="gray.400" flexShrink={0}>
                          {formatFileSize(file.size)}
                        </Text>
                      </HStack>
                    );
                  })}
                  {selectedFiles.length > 20 && (
                    <Text fontSize="xs" color="gray.500" mt={2} fontStyle="italic">
                      ... and {selectedFiles.length - 20} more files
                    </Text>
                  )}
                </Box>
              </Box>
            )}

            {uploading && (
              <Box w="100%">
                <Text fontSize="sm" mb={2}>Uploading...</Text>
                <Progress value={uploadProgress} colorScheme="blue" />
              </Box>
            )}
          </VStack>
        </ModalBody>

        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={onClose} disabled={uploading}>
            Cancel
          </Button>
          <Button 
            colorScheme="blue" 
            onClick={handleUpload}
            disabled={!uploadKey.trim() || !selectedFiles || uploading}
            isLoading={uploading}
            loadingText="Uploading..."
          >
            Upload
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

const FileBrowser: React.FC<FileBrowserProps> = ({ initialFolder }) => {
  const [currentPath, setCurrentPath] = useState<string>(initialFolder || '');
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const toast = useToast();
  const apiUrl = process.env.REACT_APP_API_URL;
  const { isOpen: isUploadOpen, onOpen: onUploadOpen, onClose: onUploadClose } = useDisclosure();

  const fetchFiles = async (path: string = '') => {
    setLoading(true);
    setError(null);
    
    try {
      // Since we're using nginx directory listing, we'll fetch the HTML and parse it
      const response = await fetch(`${apiUrl}/files/${path}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch directory listing: ${response.status}`);
      }
      
      const html = await response.text();
      const files = parseNginxDirectoryListing(html);
      setFiles(files);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      setFiles([]);
    } finally {
      setLoading(false);
    }
  };

  const parseNginxDirectoryListing = (html: string): FileItem[] => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const links = doc.querySelectorAll('a');
    const items: FileItem[] = [];
    
    links.forEach(link => {
      const href = link.getAttribute('href');
      if (!href || href === '../' || href === './') return;
      
      const name = href.endsWith('/') ? href.slice(0, -1) : href;
      const type = href.endsWith('/') ? 'directory' : 'file';
      
      // Try to extract file size and date from the parent element's text
      const parentText = link.parentElement?.textContent || '';
      const sizeMatch = parentText.match(/(\d+(?:\.\d+)?[KMGT]?B?)/);
      const dateMatch = parentText.match(/(\d{2}-\w{3}-\d{4} \d{2}:\d{2})/);
      
      items.push({
        name,
        type,
        size: sizeMatch ? parseFileSize(sizeMatch[1]) : undefined,
        lastModified: dateMatch ? dateMatch[1] : undefined
      });
    });
    
    return items.filter(item => item.name && item.name !== 'Parent Directory');
  };

  const parseFileSize = (sizeStr: string): number => {
    const units: { [key: string]: number } = {
      'B': 1,
      'KB': 1024,
      'MB': 1024 * 1024,
      'GB': 1024 * 1024 * 1024,
      'TB': 1024 * 1024 * 1024 * 1024
    };
    
    const match = sizeStr.match(/^(\d+(?:\.\d+)?)([KMGT]?B?)$/);
    if (!match) return 0;
    
    const [, numStr, unit] = match;
    const num = parseFloat(numStr);
    return num * (units[unit] || 1);
  };

  const navigateToFolder = (folderName: string) => {
    const newPath = currentPath ? `${currentPath}/${folderName}` : folderName;
    setCurrentPath(newPath);
    navigate(`/downloads/${newPath}`, { replace: true });
  };

  const navigateToParent = () => {
    const pathParts = currentPath.split('/').filter(Boolean);
    pathParts.pop();
    const newPath = pathParts.join('/');
    setCurrentPath(newPath);
    navigate(newPath ? `/downloads/${newPath}` : '/downloads', { replace: true });
  };

  const downloadFile = (fileName: string) => {
    const filePath = currentPath ? `${currentPath}/${fileName}` : fileName;
    const link = document.createElement('a');
    link.href = `${apiUrl}/files/${filePath}`;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "Download started",
      description: `Downloading ${fileName}`,
      status: "success",
      duration: 3000,
      isClosable: true,
    });
  };

  const getBreadcrumbs = () => {
    if (!currentPath) return [];
    return currentPath.split('/').filter(Boolean);
  };

  const handleUploadSuccess = () => {
    // Refresh the file list after successful upload
    fetchFiles(currentPath);
  };

  useEffect(() => {
    fetchFiles(currentPath);
  }, [currentPath]);

  return (
    <Box>
      {/* Header with Upload Button */}
      <HStack justify="space-between" mb={4}>
        <Box>
          {/* Breadcrumb Navigation */}
          {currentPath && (
            <Breadcrumb spacing="8px" separator={<ChevronRightIcon color="gray.500" />}>
              <BreadcrumbItem>
                <BreadcrumbLink onClick={() => { setCurrentPath(''); navigate('/downloads'); }}>
                  Files
                </BreadcrumbLink>
              </BreadcrumbItem>
              {getBreadcrumbs().map((folder, index) => {
                const isLast = index === getBreadcrumbs().length - 1;
                const path = getBreadcrumbs().slice(0, index + 1).join('/');
                
                return (
                  <BreadcrumbItem key={index} isCurrentPage={isLast}>
                    {isLast ? (
                      <Text fontWeight="bold">{folder}</Text>
                    ) : (
                      <BreadcrumbLink onClick={() => {
                        setCurrentPath(path);
                        navigate(`/downloads/${path}`);
                      }}>
                        {folder}
                      </BreadcrumbLink>
                    )}
                  </BreadcrumbItem>
                );
              })}
            </Breadcrumb>
          )}
        </Box>
        
        <Button
          leftIcon={<AddIcon />}
          colorScheme="green"
          size="sm"
          onClick={onUploadOpen}
        >
          Upload
        </Button>
      </HStack>

      {/* Back button */}
      {currentPath && (
        <Button 
          leftIcon={<ChevronRightIcon transform="rotate(180deg)" />}
          size="sm" 
          variant="outline" 
          mb={4}
          onClick={navigateToParent}
        >
          Back
        </Button>
      )}

      {/* Loading state */}
      {loading && (
        <Box textAlign="center" py={8}>
          <Spinner size="lg" />
          <Text mt={2}>Loading files...</Text>
        </Box>
      )}

      {/* Error state */}
      {error && (
        <Alert status="error" mb={4}>
          <AlertIcon />
          {error}
        </Alert>
      )}

      {/* Files list */}
      {!loading && !error && (
        <VStack spacing={2} align="stretch">
          {files.map((file, index) => (
            <Box
              key={index}
              p={4}
              border="1px solid"
              borderColor="gray.200"
              borderRadius="md"
              _hover={{ bg: "gray.50", cursor: file.type === 'directory' ? "pointer" : "default" }}
              onClick={() => {
                if (file.type === 'directory') {
                  navigateToFolder(file.name);
                }
              }}
            >
              <HStack justify="space-between" width="100%">
                <HStack spacing={3} flex={1} minWidth={0}>
                  <Icon 
                    as={file.type === 'directory' ? FaFolder : FaFile} 
                    color={file.type === 'directory' ? "blue.500" : "gray.600"}
                    boxSize={4}
                    flexShrink={0}
                  />
                  <VStack align="start" spacing={1} flex={1} minWidth={0}>
                    <Text 
                      fontWeight="medium" 
                      fontSize="sm"
                      isTruncated
                      width="100%"
                    >
                      {file.name}
                    </Text>
                    <HStack spacing={2}>
                      {file.size && (
                        <Badge colorScheme="gray" size="sm">
                          {formatFileSize(file.size)}
                        </Badge>
                      )}
                      {file.lastModified && (
                        <Text fontSize="xs" color="gray.500">
                          {file.lastModified}
                        </Text>
                      )}
                    </HStack>
                  </VStack>
                </HStack>
                
                {file.type === 'file' && (
                  <Button
                    size="sm"
                    colorScheme="blue"
                    leftIcon={<DownloadIcon />}
                    onClick={(e) => {
                      e.stopPropagation();
                      downloadFile(file.name);
                    }}
                    flexShrink={0}
                  >
                    Download
                  </Button>
                )}
              </HStack>
            </Box>
          ))}
        </VStack>
      )}

      {!loading && !error && files.length === 0 && (
        <Box textAlign="center" py={8}>
          <Text color="gray.500">No files found in this directory.</Text>
        </Box>
      )}

      {/* Upload Modal */}
      <UploadModal
        isOpen={isUploadOpen}
        onClose={onUploadClose}
        currentPath={currentPath}
        onUploadSuccess={handleUploadSuccess}
      />
    </Box>
  );
};

const Download: React.FC = () => {
  const { '*': folderPath } = useParams();
  const filesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Scroll to Files section if a folder is specified in the URL
    if (folderPath && filesRef.current) {
      setTimeout(() => {
        filesRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }, [folderPath]);

  return (
    <Box p={5} maxWidth="1200px" margin="0 auto">
      <Text 
          bgGradient='linear(to-l, #44666C, #A7C4A3)'
          bgClip='text'
          fontSize='6xl'
          fontWeight='extrabold'
          marginBottom="0.2em"
        >
          Downloads
        </Text>

      <VStack spacing={5} align="start">
        {/* Download Resource 1 */}
        <Box width="100%">
          <HStack justify="space-between" align="center" width="100%">
            <Text fontSize="xl" fontWeight="bold">Glycan Structures Data</Text>
            <Button colorScheme="blue" size="sm" onClick={() => {
                                const link = document.createElement('a');
                                link.href = `/database/GlycoShape.zip`;
                                link.setAttribute('download', `GlycoShape.zip`);
                                document.body.appendChild(link);
                                link.click();
                                document.body.removeChild(link);
                              }}>Download</Button>
          </HStack>
          <Text mt={2}> The cluster centroids in PDB file format of every glycan in our database in one zipped file!</Text>
        </Box>

        <Divider />

        {/* Download Resource 2 */}
        <Box width="100%">
          <HStack justify="space-between" align="center" width="100%">
            <Text fontSize="xl" fontWeight="bold">Molecular Dynamics Simulations Trajectory Data</Text>
            <Button colorScheme="blue" size="sm" isDisabled={true} onClick={() => {
                                const link = document.createElement('a');
                                link.href = `/database/Simulation.zip`;
                                link.setAttribute('download', `Simulation.zip`);
                                document.body.appendChild(link);
                                link.click();
                                document.body.removeChild(link);
                                
                              }}>Download</Button>
          </HStack>
          <Text mt={2}>Our collection of glycan simulation trajectories (Simulations are 
conducted using the GLYCAM force 
field2, and either the GROMACS3 or 
AMBER4 MD packages). </Text>
        </Box>

        <Divider />

        {/* Files Section */}
        <Box ref={filesRef} width="100%">
          <Text fontSize="2xl" fontWeight="bold" mb={4}>
            Files
          </Text>
          <Text mb={4} color="gray.600">
            Browse and download individual files and folders from our collection.
          </Text>
          <FileBrowser initialFolder={folderPath} />
        </Box>
      </VStack>
    </Box>
  );
}

export default Download;

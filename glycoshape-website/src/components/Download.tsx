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
  const [isSelectingFolder, setIsSelectingFolder] = useState(false);
  const [keyValidating, setKeyValidating] = useState(false);
  const [keyValid, setKeyValid] = useState<boolean | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [uploadConfig, setUploadConfig] = useState<{
    maxFileSize: number;
    maxFileSizeMb: number;
    allowedExtensions: string[];
  } | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [retryCount, setRetryCount] = useState(0);
  const [uploadAborted, setUploadAborted] = useState(false);
  const toast = useToast();
  const apiUrl = process.env.REACT_APP_API_URL;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const xhrRef = useRef<XMLHttpRequest | null>(null);
  
  const borderColor = useColorModeValue('gray.300', 'gray.600');
  const bgColor = useColorModeValue('gray.50', 'gray.700');

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setUploadKey('');
      setSelectedFiles(null);
      setKeyValid(null);
      setUserRole(null);
      setValidationErrors([]);
      setUploadProgress(0);
      setKeyValidating(false);
      setRetryCount(0);
      setUploadAborted(false);
      // Cancel any ongoing upload
      if (xhrRef.current) {
        xhrRef.current.abort();
        xhrRef.current = null;
      }
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }, [isOpen]);

  // Fetch upload configuration when modal opens
  useEffect(() => {
    if (isOpen && !uploadConfig) {
      fetchUploadConfig();
    }
  }, [isOpen]);

  const fetchUploadConfig = async () => {
    try {
      const response = await fetch(`${apiUrl}/api/upload/info`);
      if (response.ok) {
        const config = await response.json();
        setUploadConfig({
          maxFileSize: config.max_file_size,
          maxFileSizeMb: config.max_file_size_mb,
          allowedExtensions: config.allowed_extensions
        });
      }
    } catch (error) {
      console.error('Failed to fetch upload config:', error);
    }
  };

  const validateUploadKey = async (key: string) => {
    if (!key.trim()) {
      setKeyValid(null);
      setUserRole(null);
      return;
    }

    setKeyValidating(true);
    try {
      const response = await fetch(`${apiUrl}/api/upload/validate-key`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ upload_key: key }),
      });

      const data = await response.json();
      
      if (response.ok && data.valid) {
        setKeyValid(true);
        setUserRole(data.user_role);
        // toast({
        //   title: "Upload Key Valid",
        //   description: `Welcome, ${data.user_role}`,
        //   status: "success",
        //   duration: 3000,
        //   isClosable: true,
        // });
      } else {
        setKeyValid(false);
        setUserRole(null);
        // toast({
        //   title: "Invalid Upload Key",
        //   description: data.message || "Please check your upload key",
        //   status: "error",
        //   duration: 3000,
        //   isClosable: true,
        // });
      }
    } catch (error) {
      setKeyValid(false);
      setUserRole(null);
      toast({
        title: "Validation Error",
        description: "Failed to validate upload key",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setKeyValidating(false);
    }
  };

  const validateFiles = (files: FileList): string[] => {
    if (!uploadConfig) return [];
    
    const errors: string[] = [];
    const { maxFileSize, allowedExtensions } = uploadConfig;

    Array.from(files).forEach(file => {
      // Check file size
      if (file.size > maxFileSize) {
        errors.push(`${file.name}: File size (${formatFileSize(file.size)}) exceeds maximum allowed size (${formatFileSize(maxFileSize)})`);
      }

      // Check file extension if extensions are specified
      if (allowedExtensions.length > 0) {
        const fileExtension = file.name.split('.').pop()?.toLowerCase();
        if (!fileExtension || !allowedExtensions.includes(fileExtension)) {
          errors.push(`${file.name}: File type not allowed. Allowed types: ${allowedExtensions.join(', ')}`);
        }
      }
    });

    return errors;
  };

  // Debounced key validation
  useEffect(() => {
    const timer = setTimeout(() => {
      if (uploadKey.trim()) {
        validateUploadKey(uploadKey);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [uploadKey]);

  // Validate files when they change
  useEffect(() => {
    if (selectedFiles) {
      const errors = validateFiles(selectedFiles);
      setValidationErrors(errors);
    } else {
      setValidationErrors([]);
    }
  }, [selectedFiles, uploadConfig]);

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

  const performUpload = (formData: FormData, attempt: number = 1): Promise<void> => {
    const MAX_RETRIES = 3;
    const TIMEOUT_MS = 50 * 60 * 1000; // 50 minutes timeout
    
    return new Promise<void>((resolve, reject) => {
      if (uploadAborted) {
        reject(new Error('Upload was cancelled'));
        return;
      }

      const xhr = new XMLHttpRequest();
      xhrRef.current = xhr;

      // Set timeout for large files
      xhr.timeout = TIMEOUT_MS;

      // Track upload progress
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable && !uploadAborted) {
          const percentComplete = (event.loaded / event.total) * 100;
          setUploadProgress(Math.round(percentComplete));
        }
      });

      // Handle successful completion
      xhr.addEventListener('load', () => {
        try {
          if (xhr.status >= 200 && xhr.status < 300) {
            setUploadProgress(100);
            
            // Check if any files had folder structure
            const hasSubfolders = selectedFiles ? Array.from(selectedFiles).some(file => 
              file.webkitRelativePath && file.webkitRelativePath.includes('/')
            ) : false;
            
            toast({
              title: "Upload Successful",
              description: hasSubfolders 
                ? `Successfully uploaded ${selectedFiles?.length || 0} file(s) with folder structure preserved`
                : `Successfully uploaded ${selectedFiles?.length || 0} file(s)`,
              status: "success",
              duration: 5000,
              isClosable: true,
            });

            // Reset form
            setUploadKey('');
            setSelectedFiles(null);
            setRetryCount(0);
            if (fileInputRef.current) {
              fileInputRef.current.value = '';
            }
            
            onUploadSuccess();
            onClose();
            resolve();
          } else {
            // Handle HTTP error status
            let errorMessage = `Upload failed: ${xhr.status}`;
            try {
              const errorData = JSON.parse(xhr.responseText);
              errorMessage = errorData.error || errorMessage;
            } catch (e) {
              // If response is not JSON, use the status message
            }
            throw new Error(errorMessage);
          }
        } catch (error) {
          if (attempt < MAX_RETRIES && !uploadAborted) {
            // Retry logic for failed uploads
            toast({
              title: "Upload Failed - Retrying",
              description: `Attempt ${attempt} failed. Retrying... (${attempt}/${MAX_RETRIES})`,
              status: "warning",
              duration: 3000,
              isClosable: true,
            });
            
            setRetryCount(attempt);
            setTimeout(() => {
              performUpload(formData, attempt + 1).then(resolve).catch(reject);
            }, 2000 * attempt); // Exponential backoff
          } else {
            toast({
              title: "Upload Failed",
              description: error instanceof Error ? error.message : 'Unknown error occurred',
              status: "error",
              duration: 5000,
              isClosable: true,
            });
            reject(error);
          }
        }
      });

      // Handle network errors with retry logic
      xhr.addEventListener('error', () => {
        if (attempt < MAX_RETRIES && !uploadAborted) {
          toast({
            title: "Network Error - Retrying",
            description: `Network error on attempt ${attempt}. Retrying... (${attempt}/${MAX_RETRIES})`,
            status: "warning",
            duration: 3000,
            isClosable: true,
          });
          
          setRetryCount(attempt);
          setTimeout(() => {
            performUpload(formData, attempt + 1).then(resolve).catch(reject);
          }, 2000 * attempt); // Exponential backoff
        } else {
          toast({
            title: "Upload Failed",
            description: `Network error occurred during upload after ${MAX_RETRIES} attempts`,
            status: "error",
            duration: 5000,
            isClosable: true,
          });
          reject(new Error('Network error occurred during upload'));
        }
      });

      // Handle timeout with retry logic
      xhr.addEventListener('timeout', () => {
        if (attempt < MAX_RETRIES && !uploadAborted) {
          toast({
            title: "Upload Timeout - Retrying",
            description: `Upload timed out on attempt ${attempt}. Retrying... (${attempt}/${MAX_RETRIES})`,
            status: "warning",
            duration: 3000,
            isClosable: true,
          });
          
          setRetryCount(attempt);
          setTimeout(() => {
            performUpload(formData, attempt + 1).then(resolve).catch(reject);
          }, 2000 * attempt); // Exponential backoff
        } else {
          toast({
            title: "Upload Failed",
            description: `Upload timed out after ${MAX_RETRIES} attempts. Please try with smaller files or check your connection.`,
            status: "error",
            duration: 7000,
            isClosable: true,
          });
          reject(new Error('Upload timed out'));
        }
      });

      // Handle upload abortion
      xhr.addEventListener('abort', () => {
        if (!uploadAborted) {
          // Only show cancellation message if it wasn't intentionally aborted
          toast({
            title: "Upload Cancelled",
            description: 'Upload was cancelled',
            status: "warning",
            duration: 3000,
            isClosable: true,
          });
        }
        reject(new Error('Upload was cancelled'));
      });

      // Start the upload
      xhr.open('POST', `${apiUrl}/api/upload`);
      
      // Set headers for large file uploads
      xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
      
      xhr.send(formData);
    });
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

    // Check if key is valid
    if (keyValid !== true) {
      toast({
        title: "Invalid Upload Key",
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

    // Check for validation errors
    if (validationErrors.length > 0) {
      toast({
        title: "File Validation Failed",
        description: `${validationErrors.length} file(s) have issues. Please check the file list below.`,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    // Calculate total upload size for user info
    const totalSize = Array.from(selectedFiles).reduce((sum, file) => sum + file.size, 0);
    const totalSizeMB = totalSize / (1024 * 1024);
    
    if (totalSizeMB > 100) { // Show warning for files larger than 100MB
      toast({
        title: "Large File Upload",
        description: `Uploading ${formatFileSize(totalSize)}. This may take several minutes. Please keep this tab open.`,
        status: "info",
        duration: 7000,
        isClosable: true,
      });
    }

    setUploading(true);
    setUploadProgress(0);
    setRetryCount(0);
    setUploadAborted(false);

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

      await performUpload(formData);
    } catch (error) {
      // Error handling is done in performUpload function
      console.error('Upload failed:', error);
    } finally {
      setUploading(false);
      setTimeout(() => {
        setUploadProgress(0);
        setRetryCount(0);
      }, 1000);
      xhrRef.current = null;
    }
  };

  const handleCancelUpload = () => {
    setUploadAborted(true);
    if (xhrRef.current) {
      xhrRef.current.abort();
      xhrRef.current = null;
    }
    setUploading(false);
    setUploadProgress(0);
    setRetryCount(0);
    
    toast({
      title: "Upload Cancelled",
      description: 'Upload has been cancelled by user',
      status: "info",
      duration: 3000,
      isClosable: true,
    });
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
              <HStack>
                <Input
                  type="password"
                  placeholder="Enter your upload key"
                  value={uploadKey}
                  onChange={(e) => setUploadKey(e.target.value)}
                  disabled={uploading}
                  borderColor={
                    keyValidating ? "blue.300" :
                    keyValid === true ? "green.300" :
                    keyValid !== null && !keyValid ? "red.300" : undefined
                  }
                />
                {keyValidating && <Spinner size="sm" />}
                {keyValid === true && (
                  <Box color="green.500">
                    <Icon viewBox="0 0 24 24" boxSize={5}>
                      <path fill="currentColor" d="M12,2A10,10 0 0,1 22,12A10,10 0 0,1 12,22A10,10 0 0,1 2,12A10,10 0 0,1 12,2M12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20A8,8 0 0,0 20,12A8,8 0 0,0 12,4M11,16.5L6.5,12L7.91,10.59L11,13.67L16.59,8.09L18,9.5L11,16.5Z" />
                    </Icon>
                  </Box>
                )}
                {keyValid !== null && !keyValid && (
                  <Box color="red.500">
                    <Icon viewBox="0 0 24 24" boxSize={5}>
                      <path fill="currentColor" d="M12,2A10,10 0 0,1 22,12A10,10 0 0,1 12,22A10,10 0 0,1 2,12A10,10 0 0,1 12,2M12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20A8,8 0 0,0 20,12A8,8 0 0,0 12,4M14.5,9L12,11.5L9.5,9L8,10.5L10.5,13L8,15.5L9.5,17L12,14.5L14.5,17L16,15.5L13.5,13L16,10.5L14.5,9Z" />
                    </Icon>
                  </Box>
                )}
              </HStack>
              {userRole && keyValid === true && (
                <Text fontSize="xs" color="green.600" mt={1}>
                  Authenticated as: {userRole}
                </Text>
              )}
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
              <FormLabel>Select Files or Folders</FormLabel>
              <VStack spacing={3}>
                <HStack spacing={3} width="100%">
                  <Button
                    size="sm"
                    variant={!isSelectingFolder ? "solid" : "outline"}
                    colorScheme={!isSelectingFolder ? "blue" : "gray"}
                    onClick={() => {
                      setIsSelectingFolder(false);
                      if (fileInputRef.current) {
                        fileInputRef.current.removeAttribute('webkitdirectory');
                        fileInputRef.current.click();
                      }
                    }}
                    disabled={uploading}
                  >
                    Select Files
                  </Button>
                  <Button
                    size="sm"
                    variant={isSelectingFolder ? "solid" : "outline"}
                    colorScheme={isSelectingFolder ? "blue" : "gray"}
                    onClick={() => {
                      setIsSelectingFolder(true);
                      if (fileInputRef.current) {
                        fileInputRef.current.setAttribute('webkitdirectory', '');
                        fileInputRef.current.click();
                      }
                    }}
                    disabled={uploading}
                  >
                    Select Folder
                  </Button>
                </HStack>
                
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
                      if (isSelectingFolder) {
                        fileInputRef.current.setAttribute('webkitdirectory', '');
                      } else {
                        fileInputRef.current.removeAttribute('webkitdirectory');
                      }
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
                        : `Drag & drop ${isSelectingFolder ? 'folders' : 'files'} here, or click to select`}
                    </Text>
                    <Text fontSize="sm" color="gray.500">
                      {isSelectingFolder ? 'Folder mode - structure will be preserved' : 'File mode - supports multiple files'}
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
              </VStack>
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

            {validationErrors.length > 0 && (
              <Alert status="error" size="sm">
                <AlertIcon />
                <Box>
                  <Text fontWeight="bold" fontSize="sm">File Validation Errors:</Text>
                  <VStack align="start" spacing={1} mt={2}>
                    {validationErrors.slice(0, 5).map((error, index) => (
                      <Text key={index} fontSize="xs">{error}</Text>
                    ))}
                    {validationErrors.length > 5 && (
                      <Text fontSize="xs" fontStyle="italic">
                        ... and {validationErrors.length - 5} more errors
                      </Text>
                    )}
                  </VStack>
                </Box>
              </Alert>
            )}

            {uploadConfig && (
              <Box w="100%" p={3} bg="gray.50" borderRadius="md">
                <Text fontSize="xs" color="gray.600" fontWeight="medium" mb={1}>
                  Upload Limits:
                </Text>
                <VStack align="start" spacing={1}>
                  <Text fontSize="xs" color="gray.500">
                    • Max file size: {formatFileSize(uploadConfig.maxFileSize)}
                  </Text>
                  {uploadConfig.allowedExtensions.length > 0 && (
                    <Text fontSize="xs" color="gray.500">
                      • Allowed types: {uploadConfig.allowedExtensions.join(', ')}
                    </Text>
                  )}
                </VStack>
              </Box>
            )}

            {uploading && (
              <Box w="100%">
                <HStack justify="space-between" align="center" mb={2}>
                  <VStack align="start" spacing={1}>
                    <Text fontSize="sm">
                      {retryCount > 0 ? `Uploading... (Retry ${retryCount}/3)` : 'Uploading...'}
                    </Text>
                    {retryCount > 0 && (
                      <Text fontSize="xs" color="orange.600">
                        Retrying due to network issues...
                      </Text>
                    )}
                  </VStack>
                  <Button
                    size="xs"
                    colorScheme="red"
                    variant="outline"
                    onClick={handleCancelUpload}
                  >
                    Cancel
                  </Button>
                </HStack>
                <Progress value={uploadProgress} colorScheme="blue" />
                <Text fontSize="xs" color="gray.500" mt={1}>
                  {uploadProgress}% complete
                  {selectedFiles && (
                    ` • ${formatFileSize(
                      Array.from(selectedFiles).reduce((sum, file) => sum + file.size, 0)
                    )} total`
                  )}
                </Text>
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
            disabled={
              !uploadKey.trim() || 
              keyValid !== true || 
              !selectedFiles || 
              selectedFiles.length === 0 ||
              validationErrors.length > 0 ||
              uploading ||
              keyValidating
            }
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
      
      // Get the text content of the entire row (parent element)
      const parentElement = link.parentElement;
      const rowText = parentElement?.textContent || '';
      
      // Extract the portion of text that comes after the link text
      // This should contain the file metadata (date and size)
      const linkText = link.textContent || '';
      const afterLinkIndex = rowText.indexOf(linkText) + linkText.length;
      const metadataText = rowText.substring(afterLinkIndex);
      
      // Look for file size in the metadata portion
      // Pattern for nginx format: whitespace + date + whitespace + size
      // Example: "                                     30-Jun-2025 18:02            74739429"
      const sizeMatch = metadataText.match(/\d{2}-\w{3}-\d{4} \d{2}:\d{2}\s+(\d+)/) || // Size after date
                       metadataText.match(/\s+(\d+(?:\.\d+)?[KMGT]?B?)\s*$/i) || // Size with units at end
                       metadataText.match(/\s+(\d+)\s*$/); // Pure number at end
      
      const dateMatch = metadataText.match(/(\d{2}-\w{3}-\d{4} \d{2}:\d{2})/);
      
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
      'TB': 1024 * 1024 * 1024 * 1024,
      'K': 1024,
      'M': 1024 * 1024,
      'G': 1024 * 1024 * 1024,
      'T': 1024 * 1024 * 1024 * 1024
    };
    
    // Clean the string and handle different formats
    const cleanSizeStr = sizeStr.trim();
    
    // If it's just a number (pure bytes), return it directly
    if (/^\d+$/.test(cleanSizeStr)) {
      return parseInt(cleanSizeStr, 10);
    }
    
    // Handle formats like "123K", "123.4M", "123KB", "123.4MB"
    const match = cleanSizeStr.match(/^(\d+(?:\.\d+)?)([KMGTB]*)?$/i);
    if (!match) return 0;
    
    const [, numStr, unit = ''] = match;
    const num = parseFloat(numStr);
    const upperUnit = unit.toUpperCase();
    
    // Try exact match first, then try without 'B'
    const multiplier = units[upperUnit] || units[upperUnit.replace('B', '')] || 1;
    return Math.round(num * multiplier);
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
};

export default Download;

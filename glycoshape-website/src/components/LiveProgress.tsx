import React, { useEffect, useState, useRef } from 'react';
import {
  Box,
  Flex,
  Image,
  Text,
  Spinner,
  VStack,
  Progress,
} from '@chakra-ui/react';
import { motion } from 'framer-motion';

interface LogEntry {
  timestamp: string;
  message: string;
}

interface ProcessData {
  job_id: string;
  status: 'in_progress' | 'finished' | 'error';
  progress: number;
  logs: LogEntry[];
  images: {
    image_url: string;
    caption: string;
  }[];
}

interface LiveProcessProps {
  jobId: string;
  apiUrl: string;
}

const MotionBox = motion(Box);

const LiveProcess: React.FC<LiveProcessProps> = ({ jobId, apiUrl }) => {
  const [processData, setProcessData] = useState<ProcessData | null>(null);
  const [loading, setLoading] = useState(true);
  // Used only to detect when new logs are added
  const [prevLogCount, setPrevLogCount] = useState(0);
  // Ref to auto-scroll logs container to the latest log
  const logsEndRef = useRef<HTMLDivElement>(null);

  // Poll every 3 seconds (make sure to include jobId/apiUrl in deps)
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const response = await fetch(`${apiUrl}/output/${jobId}/progress.json`);
        if (response.ok) {
          const data: ProcessData = await response.json();
          // Update the previous log count if new logs have been added
          setProcessData((prevData) => {
            if (prevData && data.logs.length > prevData.logs.length) {
              setPrevLogCount(prevData.logs.length);
            }
            return data;
          });
          setLoading(false);
        }
      } catch (err) {
        console.error('Error fetching process data:', err);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [apiUrl, jobId]);


  if (loading || !processData) {
    return (
      <Flex align="center" justify="center" p={4}>
        <Spinner size="lg" />
        <Text ml={4}>Loading process data...</Text>
      </Flex>
    );
  }

  return (
    <Flex
      p={4}
      borderWidth="1px"
      borderRadius="lg"
      boxShadow="sm"
      overflow="hidden"
      // Fixed overall height – adjust as needed
      h="600px"
    >
      {/* Left Panel: Terminal-like Logs & Progress */}
      <Box
        flex="2"
        pr={4}
        borderRight="1px solid #e2e8f0"
        display="flex"
        flexDirection="column"
      >
        {/* Header with status and progress bar */}
        <Box mb={2}>
          <Text fontSize="2xl" fontWeight="bold" mb={2}>
            {processData.status === 'in_progress'
              ? `Processing: ${processData.progress}%`
              : processData.status === 'finished'
              ? 'Processing finished'
              : 'Error during processing.'}
          </Text>
          <Progress
            value={processData.progress}
            size="sm"
            borderRadius="full"
            mb={4}
            colorScheme="blue"
          />
        </Box>
        {/* Logs container (scrollable) */}
        <Box flex="1" overflowY="auto" position="relative">
          <VStack align="stretch" spacing={3} pr={2}>
            {processData.logs.map((log, idx) => {
              const isLatest = idx === processData.logs.length - 1;
              return (
          <MotionBox
            key={idx}
            p={3}
            borderRadius="md"
            // Use a slightly darker background for the latest log
            bg={isLatest ? "#282828" : "#F8F4D9"}
            color="#97962E"
            fontFamily="monospace"
            initial={{ opacity: idx >= prevLogCount ? 0 : 1, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
            position={isLatest ? 'sticky' : 'relative'}
            bottom={isLatest ? 0 : undefined}
            zIndex={isLatest ? 1 : undefined}
          >
            <Text fontSize="xs" color="gray.500" mb={1}>
              {new Date(log.timestamp).toLocaleString()}
            </Text>
            <Text whiteSpace="pre-wrap">{log.message}</Text>
          </MotionBox>
              );
            })}
            <Box ref={logsEndRef} />
          </VStack>
        </Box>
      </Box>
      {/* Right Panel: Images (scrollable if many images) */}
      <Box flex="1" pl={4} overflowY="auto" h="100%">
        {processData.images.map((img, idx) => (
          <Box
            key={idx}
            mb={4}
            borderRadius="lg"
            overflow="hidden"
            boxShadow="sm"
          >
            <Image
              src={`${apiUrl}/output/${img.image_url}`}
              alt={img.caption}
              borderRadius="lg"
              objectFit="cover"
            />
            <Text mt={1} fontSize="sm" textAlign="center" p={2}>
              {img.caption}
            </Text>
          </Box>
        ))}
      </Box>
    </Flex>
  );
};

export default LiveProcess;

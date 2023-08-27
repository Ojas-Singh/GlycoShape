import React, { useState, useEffect } from 'react';
import { Button, useColorModeValue, Icon } from '@chakra-ui/react';
import { FaArrowUp } from 'react-icons/fa';

const ScrollToTopButton: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const bgColor = useColorModeValue('#4E6E6D', 'gray.200');
  const color = useColorModeValue('white', 'gray.700');

  const checkVisibility = () => {
    if (window.pageYOffset > 300) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  };

  useEffect(() => {
    window.addEventListener('scroll', checkVisibility);
    return () => window.removeEventListener('scroll', checkVisibility);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  if (!isVisible) {
    return null;
  }

  return (
    <Button 
      position="fixed" 
      bottom={4} 
      right={4} 
      onClick={scrollToTop} 
      bgColor={bgColor} 
      color={color} 
      _hover={{ opacity: 0.8 }}>
      <Icon as={FaArrowUp} />
    </Button>
  );
};

export default ScrollToTopButton;

import * as React from 'react';

import {
  Box,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  Flex,
  Spacer,
} from '@chakra-ui/react';

const MyComponent: React.FC = () => {
  const [scrollY, setScrollY] = React.useState(0);

  


  const isScrolled = scrollY < -100;

  return (
    <Flex>
      {/* Sidebar */}
      <Box width="250px" position="fixed" height="100vh" bg="gray.700" color="white">
        Sidebar Content
      </Box>

      {/* Main Content */}
      <Box flex="1" ml="250px">
        <Tabs
          
        >
          <TabList position="sticky" top="0" bg="white" zIndex="10000">
            <Tab>Tab 1</Tab>
            <Tab>Tab 2</Tab>
            <Tab>Tab 3</Tab>
          </TabList>

          <Spacer />

          <TabPanels mt="50px">
            <TabPanel>
            <Box height="2000px" bg="blue.50">
          Scrollable Area
        </Box>
            </TabPanel>
            <TabPanel>
              Content 2
            </TabPanel>
            <TabPanel>
              Content 3
            </TabPanel>
          </TabPanels>
        </Tabs>

        
       
      </Box>
    </Flex>
  );
}

export default MyComponent;

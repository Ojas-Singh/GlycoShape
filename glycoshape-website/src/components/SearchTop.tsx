import React from 'react';
import { Flex } from "@chakra-ui/react";
import bg from './assets/gly.png';
import Searchbar from './SearchBar';


const Search: React.FC = () => {
  return (
    <Flex direction="column" width="100%">
      <Flex 
        direction="column" 
        align="center" 
        justify="center" 
        flex="1" 
        padding="1em"
        paddingTop="2em"
        minHeight={{ base: "15vh" }}
        // backgroundImage={`url(${bg})`} 
        // backgroundSize="cover" 
        // // backgroundPosition="center"
        // backgroundRepeat="no-repeat"  
        sx={{
          backgroundImage: `
      radial-gradient(
        circle, 
        rgba(253, 252, 251, 0.2) 0%, 
        rgba(65, 104, 106, 0.6) 100%
      ), 
      url(${bg})`,
          backgroundSize: "cover",
          backgroundRepeat: "no-repeat",
          backgroundPosition: "50% 30%"
        }}
      >
        

        <Searchbar />
      </Flex>

  

    </Flex>
  );
}

export default Search;

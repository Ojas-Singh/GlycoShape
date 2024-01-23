import {
   HStack,
} from "@chakra-ui/react";

const DrawingPage = () => {


  return (
    <div >
      
      <HStack>
        <iframe
          // key={sequence}
          width="100%"
          height="600px"

          src={`/draw/index.html`} frameBorder="0"
          allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          title="Protein Structure"
        />
       
      </HStack>
    </div>
  );
};

export default DrawingPage;

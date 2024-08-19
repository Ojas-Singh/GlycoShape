import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ReactEmbedGist from 'react-embed-gist';
import {Link, Accordion, AccordionItem, AccordionButton, AccordionPanel, AccordionIcon, Code,
  FormControl, FormLabel, Textarea, Stack,
  Select, Radio, RadioGroup, Progress, Input,
  Button, Box, Flex, Text, Heading,
  HStack
} from '@chakra-ui/react';
import { ArrowForwardIcon} from '@chakra-ui/icons'


interface FormData {
  email: string;
  glycamName: string;
  simulationLength: string;
  mdPackage: string;
  forceField: string;
  temperature: string;
  pressure: string;
  saltConcentration: string;
  comments: string;
  glyTouCanID: string;
  molFile?: File;
  simulationFile?: File;
}

const App: React.FC = () => {
  const apiUrl = process.env.REACT_APP_API_URL || '';
  const [url, setUrl] = useState<string>('');
  const [formData, setFormData] = useState<FormData>({
    email: '',
    glycamName: '',
    simulationLength: '',
    mdPackage: '',
    forceField: '',
    temperature: '',
    pressure: '',
    saltConcentration: '',
    comments: '',
    glyTouCanID: '',
  });

  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [placeholdertext, setPlaceholderText] = useState('Lets run some glycan simulations...');
  const placeholders = [
    'Enter GLYCAM URL ...',
    'It should look like this https://glycam.org/json/download/project/cb/db9a7585-369b-42f1-84e3-81837c0f6fd4'
  ];

  useEffect(() => {
    let index = 0;
    const interval = setInterval(() => {
      index = (index + 1) % placeholders.length;
      setPlaceholderText(placeholders[index]);
    }, 2000);
    return () => {
      clearInterval(interval);
    };
  }, [placeholders]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>, fileType: 'molFile' | 'simulationFile') => {
    const file = event.target.files?.[0];
    if (file) {
      setFormData((prevFormData) => ({
        ...prevFormData,
        [fileType]: file,
      }));
    }
  };

  const handleSubmitform = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const formPayload = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      if (key !== 'molFile' && key !== 'simulationFile') {
        formPayload.append(key, value as string);
      }
    });

    if (formData.molFile) {
      formPayload.append('molFile', formData.molFile);
    }

    if (formData.simulationFile) {
      formPayload.append('simulationFile', formData.simulationFile);
    }

    try {
      await axios.post(`${apiUrl}/api/submit`, formPayload, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const { loaded, total } = progressEvent;
          if (total) {
            setUploadProgress(Math.round((loaded * 100) / total));
          }
        },
      });
      alert('Submission successful!');
    } catch (err) {
      console.error(err);
      setError('Failed to submit the form.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitUrl = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await axios.post(`${apiUrl}/api/gotw`, { url }, {
        headers: {
          'Content-Type': 'application/json',
        },
        responseType: 'blob',
      });

      const headers = response.headers;
      let fileName = 'output.zip';

      Object.keys(headers).forEach((key) => {
        if (key.toLowerCase() === 'x-filename') {
          fileName = headers[key];
        }
      });

      const blob = new Blob([response.data], { type: 'application/zip' });
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error(err);
      setError('Failed to process the URL');
    } finally {
      setLoading(false);
    }
  };

  const gistURL = "https://gist.github.com/Ojas-Singh/d112d260d41eb1875528376d84a4de9c.js";

  return (
    <Flex width={'100%'} direction="column" align="center" justify="center" flex="1">
      <Text
        bgGradient='linear(to-l, #44666C, #A7C4A3)'
        bgClip='text'
        fontSize={{ base: "xl", sm: "3xl", md: "3xl", lg: "5xl", xl: "5xl" }}
        fontWeight='extrabold'
      >
        Glycan Of The Week
      </Text>
      <Flex width="80%"align="center" position="relative" gap="1em" >
        <HStack>
      <Text fontSize={'xs'}>Make you glycan with <Link href='https://glycam.org/cb/' target="_blank"
             rel="noopener noreferrer">GLYCAM Carbohydrate Builder </Link></Text>
             <ArrowForwardIcon />
             <Text fontSize={'xs'}>Choose rotamers and generate selected strucutres</Text>
             <ArrowForwardIcon />
             <Text fontSize={'xs'}>After "Project Status: Finished all builds" copy "Download All" link and paste here.
             </Text>
             </HStack>
             </Flex>
      <Flex width="80%" minWidth={{ base: "70%", md: "40%" }} align="center" position="relative" gap="1em" boxShadow="xl" borderRadius="full" overflow="hidden" p="0.5em" bg="white">
        
        <form style={{ width: '100%' }} onSubmit={handleSubmitUrl}>
          <Input
            width="100%"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder={placeholdertext}
            size="lg"
            border="none"
            _hover={{ boxShadow: "none" }}
            _focus={{ boxShadow: "none", outline: "none" }}
          />
        </form>

        <Button
          type="submit"
          disabled={loading}
          position="absolute"
          right="3%"
          borderRadius="full"
          backgroundColor="#B07095"
          _hover={{ backgroundColor: "#CF6385" }}
          size="md"
          onClick={handleSubmitUrl}
        >
          {loading ? 'Processing...' : 'Fetch Files'}
        </Button>
      </Flex>
      <Box p={8} width="900px"  margin="0 auto">
      <Text 
          bgGradient='linear(to-l, #44666C, #A7C4A3)'
          bgClip='text'
          fontSize={{base: "3xl",sm: "3xl", md: "3xl", lg: "3xl",xl: "3xl"}}
          fontWeight='extrabold'
          marginBottom="0.2em"
          paddingTop={"1.5rem"}
        >
          How to submit a glycan to GlycoShape?
        </Text>
        <Text color='#B195A2' alignSelf={"left"} fontSize={'xs'}>
            Please contact us <Link href="mailto:OJAS.SINGH.2023@mumail.ie">here</Link> if you have any questions.
            </Text>
      <Accordion 
      defaultIndex={[4]}
       allowMultiple
       >
        <AccordionItem>
          <AccordionButton>
            <Box flex="1" textAlign="left">
            How to choose a glycan?
            </Box>
            <AccordionIcon />
          </AccordionButton>
          <AccordionPanel pb={4}>
            <Text>Google sheet</Text>
            <Link href="https://docs.google.com/spreadsheets/d/1dP4cGl8mE0bs58vp2OoH21QMtOGY3n-5vnsoT3vVJgM/edit?usp=sharing"
             target="_blank"
             rel="noopener noreferrer">
            <Code>
              https://docs.google.com/spreadsheets/d/1dP4cGl8mE0bs58vp2OoH21QMtOGY3n-5vnsoT3vVJgM/edit?usp=sharing
            </Code></Link>
          </AccordionPanel>
        </AccordionItem>
        <AccordionItem>
          <AccordionButton>
          
            <Box flex="1" textAlign="left">
              How to make and run a simulation?
            </Box>
            <AccordionIcon />
          </AccordionButton>
          <AccordionPanel pb={4}>
            <Text>Glycam </Text>
            
            <ReactEmbedGist 
      gist="Ojas-Singh/8f29961cb1319c095f4e4830693e862c"
   />
          </AccordionPanel>
        </AccordionItem>
        <AccordionItem>
          <AccordionButton>
            <Box flex="1" textAlign="left">
            How to fix periodic boundary conditions?
            </Box>
            <AccordionIcon />
          </AccordionButton>
          <AccordionPanel pb={4}>
          <ReactEmbedGist 
      gist="Ojas-Singh/46e3e4619e035dfab6570fc07ac75b2f"
   />
         
          </AccordionPanel>
        </AccordionItem>
        <AccordionItem>
          <AccordionButton>
            <Box flex="1" textAlign="left">
            How to merge all multiframe pdb files for submission?
            </Box>
            <AccordionIcon />
          </AccordionButton>
          <AccordionPanel pb={4}>
            

            <ReactEmbedGist 
      gist="Ojas-Singh/3f34d2bb20f801c8fed1c22a9739d136"
   />
           
          </AccordionPanel>
        </AccordionItem>
        <AccordionItem>
          <AccordionButton>
            <Box flex="1" textAlign="left">
            Submission requirments?
            </Box>
            <AccordionIcon />
          </AccordionButton>
          <AccordionPanel pb={4}>
            <Text>*All replica multiframe PDB file needs to be merged.</Text>
            <Text>*You need one mol2 file also while submission, which will be generated if you use provided script. <br />("trajout glycan.dry.mol2 mol2 onlyframes 1" in cpptraj)</Text>
            <Text>*Please check you final trajectory before uploading and verify if thier is no bond breaks and the whole molecule is in one piece.</Text>
            <Text>*Please provide the correct full GLYCAM name and GlyTouCan ID of the glycan.</Text>
          </AccordionPanel>
        </AccordionItem>
        

        


      </Accordion>
      </Box>
      
      <Box p={5} maxWidth="800px" margin="0 auto" />

      <Text paddingTop={".5em"}
        bgGradient='linear(to-l, #44666C, #A7C4A3)'
        bgClip='text'
        fontSize={{ base: "xl", sm: "3xl", md: "3xl", lg: "5xl", xl: "5xl" }}
        fontWeight='extrabold'
      >
        Glycan Submission Form
      </Text>

      <Flex padding={"1em"} width="80%" minWidth={{ base: "70%", md: "40%" }} align="center" position="relative" gap="1em" boxShadow="xl" overflow="hidden" p="0.5em" bg="white">
        <form style={{ width: '100%' }} onSubmit={handleSubmitform}>
          <FormControl isRequired>
            <FormLabel>Email</FormLabel>
            <Input
              name="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="Your email address"
            />
          </FormControl>

          <FormControl isRequired>
            <FormLabel>Full GLYCAM name of glycan being submitted</FormLabel>
            <Input
              name="glycamName"
              value={formData.glycamName}
              onChange={handleInputChange}
              placeholder="Enter GLYCAM name"
            />
          </FormControl>

          <FormControl isRequired>
            <FormLabel>What is the GlyTouCan ID of the glycan?</FormLabel>
            <Input
              name="glyTouCanID"
              value={formData.glyTouCanID}
              onChange={handleInputChange}
              placeholder="Enter GlyTouCan ID"
            />
          </FormControl>

          <FormControl isRequired>
            <FormLabel>What is the aggregated length of the simulations?</FormLabel>
            <Input
              name="simulationLength"
              value={formData.simulationLength}
              onChange={handleInputChange}
              placeholder="Answers in microseconds, please."
            />
          </FormControl>

          <FormControl isRequired>
            <FormLabel>What MD package was used for the simulations?</FormLabel>
            <RadioGroup
              name="mdPackage"
              value={formData.mdPackage}
              onChange={(value) => setFormData({ ...formData, mdPackage: value })}
            >
              <Stack spacing={3}>
                <Radio value="AMBER">AMBER</Radio>
                <Radio value="GROMACS">GROMACS</Radio>
                <Radio value="OpenMM">OpenMM</Radio>
                <Radio value="Other">Other</Radio>
              </Stack>
            </RadioGroup>
          </FormControl>

          <FormControl isRequired>
            <FormLabel>What force field was used for the simulations?</FormLabel>
            <RadioGroup
              name="forceField"
              value={formData.forceField}
              onChange={(value) => setFormData({ ...formData, forceField: value })}
            >
              <Stack spacing={3}>
                <Radio value="GLYCAM_06j">GLYCAM_06j</Radio>
                <Radio value="CHARMM36m">CHARMM36m</Radio>
                <Radio value="GLYCAM_06j/GAFF2">GLYCAM_06j/GAFF2</Radio>
                <Radio value="Other">Other</Radio>
              </Stack>
            </RadioGroup>
          </FormControl>

          <FormControl isRequired>
            <FormLabel>What temperature target was used for the simulations?</FormLabel>
            <Input
              name="temperature"
              value={formData.temperature}
              onChange={handleInputChange}
              placeholder="Answers in degree Kelvin, please."
            />
          </FormControl>

          <FormControl isRequired>
            <FormLabel>What pressure target was used for the simulations?</FormLabel>
            <Input
              name="pressure"
              value={formData.pressure}
              onChange={handleInputChange}
              placeholder="Answers in bar, please."
            />
          </FormControl>

          <FormControl isRequired>
            <FormLabel>What NaCl concentration was used for the simulations?</FormLabel>
            <Input
              name="saltConcentration"
              value={formData.saltConcentration}
              onChange={handleInputChange}
              placeholder="Answers in millimolar, please."
            />
          </FormControl>

          <FormControl>
            <FormLabel>Any comments that should be noted with the submission?</FormLabel>
            <Textarea
              name="comments"
              value={formData.comments}
              onChange={handleInputChange}
              placeholder="Your comments"
            />
          </FormControl>

          <FormControl>
            <FormLabel>Upload merged multiframe PDB Simulation File</FormLabel>
            <Input
              type="file"
              onChange={(e) => handleFileChange(e, 'simulationFile')}
              size="md"
            />
          </FormControl>

          <FormControl mt={4}>
            <FormLabel>Upload Mol2 File</FormLabel>
            <Input
              type="file"
              onChange={(e) => handleFileChange(e, 'molFile')}
              size="md"
            />
          </FormControl>

          {uploadProgress > 0 && (
            <Box mt={2} w="100%" padding={'.5rem'}>
              <Progress value={uploadProgress} size="sm" colorScheme="green" />
            </Box>
          )}

          <Button
            type="submit"
            isLoading={loading}
            colorScheme="teal"
            size="md"
            width="full"
            onClick={handleSubmitform}
          >
            Submit
          </Button>

          {error && <Text color="red.500">{error}</Text>}
        </form>
      </Flex>
    </Flex>
  );
};

export default App;

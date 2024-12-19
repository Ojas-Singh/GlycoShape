import React, { useEffect, useState } from 'react';
import MolstarViewer from "./MolstarViewer";
import { useSearchParams } from 'react-router-dom';
import { Box, Button, Text } from "@chakra-ui/react";
import axios from 'axios';

export default function View() {
    const apiUrl = process.env.REACT_APP_API_URL;
    const [searchParams] = useSearchParams();
    const glytoucan = searchParams.get('glytoucan');
    const [pdbUrl, setPdbUrl] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [buttonText, setButtonText] = useState('Request this Glycan');

    useEffect(() => {
        if (glytoucan) {
            const fetchPdbData = async () => {
                try {
                    const response = await axios.get(`${apiUrl}/api/pdb/${glytoucan}`);
                    if (response.data.error) {
                        setError(response.data.error);
                    } else {
                        setPdbUrl(`${apiUrl}/api/pdb/${glytoucan}`);
                    }
                } catch (err) {
                    setError('GlycoShape does not have this glycan yet!');
                }
            };

            fetchPdbData();
        }
    }, [glytoucan]);

    const handleRequestGlycan = async () => {
        try {
            const response = await axios.post(`${apiUrl}/api/request`, { glytoucan });
            if (response.data.message) {
                setButtonText('Request Sent');
            } else {
                setError('An error occurred while sending the request.');
            }
        } catch (err) {
            setError('An error occurred while sending the request.');
        }
    };

    if (!glytoucan) {
        return <div>No GlyTouCan ID provided</div>;
    }

    if (error) {
        return (
            <Box height="100vh" width="100vw" display="flex" alignItems="center" justifyContent="center" flexDirection="column">
                <Text fontFamily={'texts'} fontSize="xl" mb={4}>{error}</Text>
                <Button  colorScheme="teal" onClick={handleRequestGlycan}>
                    {buttonText}
                </Button>
            </Box>
        );
    }

    return (
        <Box height="100vh" width="100vw">
            {pdbUrl && (
                <MolstarViewer 
                    urls={[
                        { url: pdbUrl, format: 'pdb' },
                    ]}
                    backgroundColor="#FCFBF9"
                />
            )}
        </Box>
    );
}
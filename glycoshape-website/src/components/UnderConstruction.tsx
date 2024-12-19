import React from 'react';
import { Text, Link } from '@chakra-ui/react';

const UnderConstruction: React.FC = () => {
    return (
        <div
            style={{
                backgroundColor: '#ffeb3b',
                color: '#000',
                textAlign: 'center',
                padding: '8px',
                width: '100%',
                position: 'sticky',
                top: '0px', // Adjust this value based on your navbar height
                zIndex: 1000,
                fontWeight: 'bold',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '8px'
            }}
        >
            <span role="img" aria-label="construction">
                🚧
            </span>
            This website is under development - 

            <Link href={`https://glycoshape.org${window.location.pathname}`}>
                
                    please visit GlycoShape.org
                </Link>
                <span role="img" aria-label="construction">
                🚧
            </span>
        </div>
    );
};

export default UnderConstruction;
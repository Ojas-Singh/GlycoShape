import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import LiveProgress from './LiveProgress'; // Adjust the import path as needed


const apiUrl = process.env.REACT_APP_API_URL;
const JobView: React.FC = () => {
    // Extract job ID from URL parameters
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const [jobId, setSetjobId] = useState<string>(queryParams.get('Id') || '');

    if (!jobId) {
        return (
            <div className="flex justify-center items-center h-full">
                <p className="text-red-500">No job ID provided</p>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-xl font-bold mb-4">Job Id: {jobId}</h1>
            <LiveProgress jobId={jobId} apiUrl={process.env.REACT_APP_API_URL || ""} />
        </div>
    );
};

export default JobView;
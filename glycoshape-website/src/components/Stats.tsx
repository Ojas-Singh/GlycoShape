import React, { useEffect, useState } from 'react';
import { Box, Flex, Text, SimpleGrid, Stat, StatLabel, StatNumber } from '@chakra-ui/react';
import axios from 'axios';
import { Line } from 'react-chartjs-2';
import { Chart, LineController, LineElement, PointElement, LinearScale, CategoryScale, Title } from 'chart.js';
import { MapContainer, TileLayer, CircleMarker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

// Register necessary chart.js components
Chart.register(LineController, LineElement, PointElement, LinearScale, CategoryScale, Title);

interface Visitor {
  timestamp: string;
  latitude: number | null;
  longitude: number | null;
}

const Stats: React.FC = () => {
  const apiUrl = process.env.REACT_APP_API_URL;
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [visitsPerDay, setVisitsPerDay] = useState<{ [key: string]: number }>({});

  useEffect(() => {
    // Fetch visitor data from the API
    const fetchVisitors = async () => {
      try {
        const response = await axios.get<Visitor[]>(`${apiUrl}/api/visitors`);
        const data = response.data;

        // Filter the data to include only the last month
        const oneMonthAgo = new Date();
        oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

        const filteredData = data.filter(visitor => new Date(visitor.timestamp) > oneMonthAgo);

        // Process the data to calculate visits per day
        const visits: { [key: string]: number } = {};
        filteredData.forEach(visitor => {
          const date = new Date(visitor.timestamp).toLocaleDateString();
          if (visits[date]) {
            visits[date] += 1;
          } else {
            visits[date] = 1;
          }
        });
        setVisitsPerDay(visits);
        setVisitors(filteredData);
      } catch (error) {
        console.error('Error fetching visitor data:', error);
      }
    };

    fetchVisitors();
  }, []);

  // Prepare data for the visits per day chart
  const chartData = {
    labels: Object.keys(visitsPerDay),
    datasets: [
      {
        label: 'Visits per Day',
        data: Object.values(visitsPerDay),
        fill: false,
        borderColor: 'rgb(75, 192, 192)',
        tension: 0.1,
      },
    ],
  };

  return (
    <Box p={6}>
      <Flex justifyContent="space-between" alignItems="center" mb={8}>
        
        <Text 
          bgGradient='linear(to-l, #44666C, #A7C4A3)'
          bgClip='text'
          fontSize={{base: "5xl",sm: "5xl", md: "5xl", lg: "5xl",xl: "5xl"}}
          fontWeight='extrabold'
          // align={"start"}
          
          paddingLeft={"0rem"}
        >
          Statistics
        </Text>
      </Flex>

      <SimpleGrid columns={[1, null, 2]} spacing="40px" mb={8}>
        <Stat>
          <StatLabel>Total number of visitors in the last month:</StatLabel>
          <StatNumber>{visitors.length}</StatNumber>
        </Stat>

        {/* <Stat>
          <StatLabel>Number of visits in the last 7 days:</StatLabel>
          <StatNumber>{Object.values(visitsPerDay).slice(-7).reduce((a, b) => a + b, 0)}</StatNumber>
        </Stat> */}
      </SimpleGrid>

      <Flex justifyContent="space-between" alignItems="center" mb={8}>
        {/* Line chart for visits per day */}
        <Box width="100%" height="300px" mb={8}>
          <Line data={chartData} />
        </Box>

        {/* Map for showing visitor locations */}
        <Box width="100%" height="300px">
          <MapContainer center={[20, 0]} zoom={2} style={{ height: '100%', width: '100%' }}>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            {visitors
              .filter(visitor => visitor.latitude && visitor.longitude) // Only show valid coordinates
              .map((visitor, index) => (
                <CircleMarker
                  key={index}
                  center={[visitor.latitude!, visitor.longitude!]} // Position of the circle
                  radius={1}  // Size of the circle
                  fillOpacity={0.1}  // Adjust transparency here (0.2 means 20% opaque)
                  stroke={true}
                  color="#CF6385" // Border color of the circle
                />
              ))}
          </MapContainer>
        </Box>
      </Flex>
    </Box>
  );
};

export default Stats;

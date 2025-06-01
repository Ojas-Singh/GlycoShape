import React, { useEffect, useState } from 'react';
import { Box, Flex, Text, SimpleGrid, Stat, StatLabel, StatNumber, VStack, Container } from '@chakra-ui/react';
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
        backgroundColor: 'rgba(75, 192, 192, 0.1)',
        tension: 0.1,
        pointBackgroundColor: 'rgb(75, 192, 192)',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 4,
      },
    ],
  };

  // Chart options for better mobile display
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      title: {
        display: true,
        text: 'Daily Visits',
        font: {
          size: 16,
          weight: 'bold' as const, // Fix: Use 'as const' or specific type
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
      },
      x: {
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
      },
    },
  };

  return (
    <Container maxW="7xl" p={6}>
      {/* Header */}
      <Box mb={8}>
        <Text 
          bgGradient='linear(to-l, #44666C, #A7C4A3)'
          bgClip='text'
          fontSize={{base: "4xl", sm: "5xl", md: "6xl"}}
          fontWeight='extrabold'
          textAlign={{base: "center", md: "left"}}
        >
          Statistics
        </Text>
      </Box>

      {/* Stats Cards */}
      <SimpleGrid columns={[1, 2, 3]} spacing={6} mb={8}>
        <Stat
          bg="white"
          p={6}
          borderRadius="xl"
          boxShadow="md"
          border="1px solid"
          borderColor="gray.100"
        >
          <StatLabel color="gray.600" fontSize="sm">Total Visitors (Last Month)</StatLabel>
          <StatNumber color="teal.600" fontSize={["2xl", "3xl"]}>{visitors.length}</StatNumber>
        </Stat>

        <Stat
          bg="white"
          p={6}
          borderRadius="xl"
          boxShadow="md"
          border="1px solid"
          borderColor="gray.100"
        >
          <StatLabel color="gray.600" fontSize="sm">Unique Locations</StatLabel>
          <StatNumber color="blue.600" fontSize={["2xl", "3xl"]}>
            {visitors.filter(v => v.latitude && v.longitude).length}
          </StatNumber>
        </Stat>

        <Stat
          bg="white"
          p={6}
          borderRadius="xl"
          boxShadow="md"
          border="1px solid"
          borderColor="gray.100"
        >
          <StatLabel color="gray.600" fontSize="sm">Avg Daily Visits</StatLabel>
          <StatNumber color="purple.600" fontSize={["2xl", "3xl"]}>
            {Object.keys(visitsPerDay).length > 0 
              ? Math.round(Object.values(visitsPerDay).reduce((a, b) => a + b, 0) / Object.keys(visitsPerDay).length)
              : 0
            }
          </StatNumber>
        </Stat>
      </SimpleGrid>

      {/* Charts and Map - Stack on mobile, side by side on desktop */}
      <VStack spacing={8} align="stretch">
        {/* Line chart for visits per day */}
        <Box
          bg="white"
          p={6}
          borderRadius="xl"
          boxShadow="md"
          border="1px solid"
          borderColor="gray.100"
        >
          <Box height={{base: "250px", md: "350px"}}>
            <Line data={chartData} options={chartOptions} />
          </Box>
        </Box>

        {/* Map for showing visitor locations */}
        <Box
          bg="white"
          p={6}
          borderRadius="xl"
          boxShadow="md"
          border="1px solid"
          borderColor="gray.100"
        >
          <Text 
            fontSize="lg" 
            fontWeight="bold" 
            mb={4} 
            color="gray.700"
            textAlign={{base: "center", md: "left"}}
          >
            Visitor Locations
          </Text>
          <Box 
            height={{base: "300px", sm: "400px", md: "500px"}} 
            borderRadius="lg" 
            overflow="hidden"
            border="2px solid"
            borderColor="gray.200"
          >
            <MapContainer 
              center={[20, 0]} 
              zoom={2} 
              style={{ height: '100%', width: '100%' }}
              zoomControl={true}
              scrollWheelZoom={false} // Disable scroll zoom for better mobile experience
            >
              <TileLayer 
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              />
              {visitors
                .filter(visitor => visitor.latitude && visitor.longitude)
                .map((visitor, index) => (
                  <CircleMarker
                    key={index}
                    center={[visitor.latitude!, visitor.longitude!]}
                    radius={3}
                    fillOpacity={0.6}
                    stroke={true}
                    color="#2D3748"
                    fillColor="#4299E1"
                    weight={1}
                  />
                ))}
            </MapContainer>
          </Box>
        </Box>
      </VStack>
    </Container>
  );
};

export default Stats;

import React, { useEffect, useState, useRef } from 'react';
import * as d3 from 'd3';
import { contourDensity } from 'd3-contour';
import { SimpleGrid,  Heading, Box, VStack } from '@chakra-ui/react';

type CSVData = {
  [key: string]: string;
};

type ContourPlotProps = {
  dataUrl: string;
  seq: string;
};

type Statistic = {
  cluster: string;
  mean: number;
  std: number;
};

type ScatterPoint = {
  x: number;
  y: number;
};


const ContourPlot: React.FC<ContourPlotProps> = ({ dataUrl, seq }) => {

  const apiUrl = process.env.REACT_APP_API_URL;

  const colors = ["#1B9C75", "#D55D02", "#746FB1", "#E12886", "#939242", "#E3A902", "#A4751D", "#646464", "#E11A1C", "#357AB3"];  // Your color array

  const ref = useRef<SVGSVGElement | null>(null);
  const [columns, setColumns] = useState<string[]>([]);
  const [selectedColumns, setSelectedColumns] = useState<{ x: string; y: string }>({ x: '', y: '' });
  const [data, setData] = useState<CSVData[]>([]);
  const [infoData, setInfoData] = useState<any | null>(null);

  useEffect(() => {
    fetch(`${apiUrl}/database/${seq}/output/info.json`)
      .then(response => {
        // First, check if the response is ok (status code in the 200-299 range)
        if (!response.ok) {
          // Convert non-2xx HTTP responses into errors
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json();
      })
      .then(data => setInfoData(data))
      .catch(error => {
        // Handle the error, you can set some state, log it, or show an error message
        console.error("Fetch error: ", error);
        // Optionally, you can set some state to display an error message to the user
        // setErrorMsg(error.message);
      });
  }, []);


  const computeStatistics = (data: CSVData[], column: string): Statistic[] => {
    const groupedByCluster = d3.group(data, d => d['cluster']);
    const stats: Statistic[] = [];
  
    groupedByCluster.forEach((values, cluster) => {
      const angles = values.map(d => +d[column]).filter(v => !isNaN(v));
      const sinSum = d3.sum(angles, angle => Math.sin(angle * (Math.PI / 180)));
      const cosSum = d3.sum(angles, angle => Math.cos(angle * (Math.PI / 180)));
      const meanAngle = Math.atan2(sinSum, cosSum) * (180 / Math.PI);
      
      // Standard deviation computation on cyclic angles with fallback
      const stdAngle = Math.sqrt(
        d3.mean(angles.map(angle => {
          const diff = Math.abs(angle - meanAngle);
          return Math.pow(Math.min(diff, 360 - diff), 2);
        })) || 0  // default to 0 if `d3.mean` is undefined
      );
  
      stats.push({ cluster, mean: meanAngle, std: stdAngle });
    });
  
    return stats;
  };
  
  const statistics: Statistic[] = computeStatistics(data, selectedColumns.x);
  const sortedStatistics = [...statistics].sort((a, b) =>
    parseInt(a.cluster, 10) - parseInt(b.cluster, 10)
  );



  const renderStatisticsTable = (selectedColumn: string) => (

    <Box flex='1'>

      <VStack>

        <Heading size={'1xl'} marginLeft={'20px'} style={{ textAlign: 'center' }}>Statistics for {selectedColumn}</Heading>

        <table style={{
          border: '3px solid teal',
          borderCollapse: 'collapse',
          width: '100%',
          textAlign: 'center',


        }}>

          <thead>

            <tr>
              <th style={{ border: '2px solid #66826C', padding: '5px' }}>Cluster</th>
              <th style={{ border: '2px solid #66826C', padding: '5px' }}>Mean</th>
              <th style={{ border: '2px solid #66826C', padding: '5px' }}>Standard Deviation</th>
            </tr>
          </thead>
          <tbody>
            {sortedStatistics.map((stat: Statistic, index: number) => (
              <tr key={stat.cluster}>
                <td style={{ border: '2px solid #66826C', padding: '5px', color: colors[index] }}>{stat.cluster}</td>
                <td style={{ border: '2px solid #66826C', padding: '5px', color: colors[index] }}>{stat.mean.toFixed(2)}</td>
                <td style={{ border: '2px solid #66826C', padding: '5px', color: colors[index] }}>{stat.std.toFixed(2)}</td>
              </tr>
            ))}


          </tbody>

        </table>
      </VStack>
    </Box>
  );






  useEffect(() => {
    if (!ref.current) return;

    // const width = 600;
    // const height = 400;
    // const marginTop = 20;
    // const marginRight = 30;
    // const marginBottom = 30;
    // const marginLeft = 40;

    // const svg = d3.select(ref.current);

    d3.csv(dataUrl).then((data) => {
      setData(data as CSVData[]);

      if (data.length > 0) {
        const cols = Object.keys(data[0]);
        setColumns(cols);

        // Set the default selections for X and Y axes.
        if (cols.length >= 4) {
          setSelectedColumns({ x: cols[2], y: cols[3] });
        }
      }
    });
  }, [dataUrl]);

  useEffect(() => {
    if (!ref.current || data.length === 0 || selectedColumns.x === '' || selectedColumns.y === '') return;

    const svg = d3.select(ref.current);

    const width = 500;
    const height = 500;
    const marginTop = 20;
    const marginRight = 30;
    const marginBottom = 100;
    const marginLeft = 40;

    const xScale = d3.scaleLinear()
      .domain(d3.extent(data.map(d => +d[selectedColumns.x] ?? 0)) as [number, number] || [-180, 180])
      .rangeRound([marginLeft, width - marginRight]);

    const yScale = d3.scaleLinear()
      .domain(d3.extent(data.map(d => +d[selectedColumns.y] ?? 0)) as [number, number] || [-180, 180])
      .rangeRound([height - marginBottom, marginTop]);

    const contourData: [number, number][] = data.map(d => [+d[selectedColumns.x] ?? 0, +d[selectedColumns.y] ?? 0]);

    const contours = contourDensity()
      .x(d => xScale(d[0]))
      .y(d => yScale(d[1]))
      .size([width, height])
      .bandwidth(30)
      .thresholds(30)
      (contourData);



    // const statistics = computeStatistics(data, selectedColumns.x);

    if (infoData && infoData.popp) {
      const scatterData: ScatterPoint[] = infoData.popp.map((index: number) => {
        const d = data[index];
        return {
          x: +d[selectedColumns.x],
          y: +d[selectedColumns.y]
        };
      });

      svg.selectAll(".scatter-point")
        .data(scatterData)
        .join("circle")
        .attr("class", "scatter-point")
        .attr("cx", d => xScale(d.x))
        .attr("cy", d => yScale(d.y))
        .attr("r", 5)
        .attr("fill", (d, i) => colors[i % colors.length]);
    }
    // svg.selectAll(".scatter-point").remove();
    svg.selectAll('path').remove();
    svg.selectAll('g').remove();
    svg.selectAll('defs').remove();

    svg.append("defs")
      .append("clipPath")
      .attr("id", "clip")
      .append("rect")
      .attr("x", marginLeft)
      .attr("y", marginTop)
      .attr("width", width - marginLeft - marginRight)
      .attr("height", height - marginTop - marginBottom);

    svg.append("g")
      .attr("transform", `translate(0,${height - marginBottom})`)
      .call(d3.axisBottom(xScale).tickSizeOuter(0))
      .call(g => g.select(".domain").remove())
      .call(g => g.select(".tick:last-of-type text").clone()
        .attr("y", -3)
        .attr("dy", null)
        .attr("font-weight", "bold")
        .text(selectedColumns.x));

    svg.append("g")
      .attr("transform", `translate(${marginLeft},0)`)
      .call(d3.axisLeft(yScale).tickSizeOuter(0))
      .call(g => g.select(".domain").remove())
      .call(g => g.select(".tick:last-of-type text").clone()
        .attr("x", 3)
        .attr("text-anchor", "start")
        .attr("font-weight", "bold")
        .text(selectedColumns.y));

    svg.append("g")
      .attr("fill", "none")
      .attr("stroke", "steelblue")
      .attr("stroke-linejoin", "round")
      .attr("clip-path", "url(#clip)")
      .selectAll()
      .data(contours)
      .join("path")
      .attr("stroke-width", (d, i) => i % 5 ? 0.25 : 1)
      .attr("d", d3.geoPath());

  }, [data, selectedColumns]);



  return (
    <Box flex='1' width={'100%'} p={4}>
      {/* Axis Selection Controls */}
      <Box mb={4} textAlign="center">
        <label>
          X Axis: &nbsp;&nbsp;
          <select
            style={{
              width: '150px',
              height: '30px',
              borderRadius: '5px',
              marginRight: '20px'
            }}
            value={selectedColumns.x}
            onChange={(e) => setSelectedColumns((prev) => ({ ...prev, x: e.target.value }))}
          >
            {columns.map((col) => (
              <option key={col} value={col}>{col}</option>
            ))}
          </select>
        </label>
        <label>
          Y Axis: &nbsp;&nbsp;
          <select
            style={{
              width: '150px',
              height: '30px',
              borderRadius: '5px'
            }}
            value={selectedColumns.y}
            onChange={(e) => setSelectedColumns((prev) => ({ ...prev, y: e.target.value }))}
          >
            {columns.map((col) => (
              <option key={col} value={col}>{col}</option>
            ))}
          </select>
        </label>
      </Box>

      {/* Content Grid */}
      <SimpleGrid 
        columns={{ base: 1, lg: 2 }} 
        spacing={8}
        alignItems="start"
        justifyContent="center"
      >
        <Box>
          {renderStatisticsTable(selectedColumns['x'])}
        </Box>
        <Box display="flex" justifyContent="center" minW={'50rem'} minH={'30rem'}>
          <svg ref={ref} width="100%" height="450px" style={{ display: 'block' }} />
        </Box>
      </SimpleGrid>
    </Box>
  );
};

export default ContourPlot;
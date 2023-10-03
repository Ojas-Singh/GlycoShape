import React, { useEffect, useState } from 'react';
import Plot from 'react-plotly.js';
import * as d3 from 'd3';

type CSVData = {
  '0': string;
  '1': string;
  '2': string;
  cluster: string;
};

interface Scatter3DProps {
  dataUrl: string;
}

const Scatter3D: React.FC<Scatter3DProps> = ({ dataUrl }) => {
  const [data, setData] = useState<CSVData[]>([]);
  
  useEffect(() => {
    d3.csv(dataUrl).then(data => {
        setData(data as unknown as CSVData[]);
    });
      
  }, [dataUrl]);

  if (!data.length) return <div>Loading...</div>;

  const colors = ["#1B9C75", "#D55D02", "#746FB1", "#E12886", "#939242","#E3A902","#A4751D","#646464","#E11A1C","#357AB3"]; // Your color array


  const clusterToColorMap: { [cluster: string]: string } = {};
  data.forEach(d => {
    if (!clusterToColorMap[d.cluster]) {
      clusterToColorMap[d.cluster] = colors[Object.keys(clusterToColorMap).length % colors.length];
    }
  });

  const trace = {
    x: data.map(d => parseFloat(d['0'])),
    y: data.map(d => parseFloat(d['1'])),
    z: data.map(d => parseFloat(d['2'])),
    mode: 'markers' as const,  // Note the "as const" here.
    type: 'scatter3d' as const,
    marker: {
      size: 3,
      color: data.map(d => clusterToColorMap[d.cluster]),
      opacity: 0.8
    }
  };

  const layout = {
    autosize: true,
    margin: {
      l: 0  ,
      r: 0,
      b: 0,
      t: 0
    }
  };

  return <Plot data={[trace]} layout={layout} useResizeHandler={true} style={{ width: "60vw", height: "50vh" }} />;
};

export default Scatter3D;

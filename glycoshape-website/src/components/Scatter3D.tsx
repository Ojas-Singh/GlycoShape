import React, { useEffect, useState } from 'react';
import Plot from 'react-plotly.js';
import * as d3 from 'd3';

type CSVData = {
  x : string;
  y: string;
  z: string;
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

  const trace = {
    x: data.map(d => parseFloat(d.x)),
    y: data.map(d => parseFloat(d.y)),
    z: data.map(d => parseFloat(d.z)),
    mode: 'markers' as const,  // Note the "as const" here.
    type: 'scatter3d' as const,
    marker: {
      size: 5,
      color: data.map(d => d.cluster),
      colorscale: 'Viridis',
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

  return <Plot data={[trace]} layout={layout} useResizeHandler={true} style={{ width: "40rem", height: "30rem" }} />;
};

export default Scatter3D;

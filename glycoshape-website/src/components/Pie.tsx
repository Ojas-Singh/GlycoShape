import React from 'react';
import Plot, { PlotParams } from 'react-plotly.js';

interface PieChartProps {
  data: Record<string, number | GLfloat>;  // Or whatever type fits your actual data
}

const PieChart: React.FC<PieChartProps> = ({ data }) => {
  const keys = Object.keys(data);
  const values = Object.values(data);

  const colors = ["#1B9C75", "#D55D02", "#746FB1", "#E12886", "#939242", "#E3A902", "#A4751D", "#646464", "#E11A1C", "#357AB3"];  // Your color array

  const plotData: Partial<PlotParams>['data'] = [
    {
      type: 'pie',
      labels: keys,
      values: values,
      textinfo: 'label+percent',
      insidetextorientation: 'radial',
      marker: {
        colors: colors,
      }
    }
  ];  
  const layout = {
    title: 'Cluster Distribution',
    height: 400,
    width: 500,
  };

  return <Plot data={plotData} layout={layout}  />;
};

export default PieChart;

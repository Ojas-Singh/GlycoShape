import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { contourDensity } from 'd3-contour';

type CSVData = {
    i: string;
    cluster: string;
    '2_3_phi'?: string;  // Note the '?', which indicates the property is optional
    '2_3_psi'?: string;
  };
  

type ContourPlotProps = {
  dataUrl: string; // URL to your CSV data
};

const ContourPlot: React.FC<ContourPlotProps> = ({ dataUrl }) => {
  const ref = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    if (!ref.current) return;

    const width = 600;
    const height = 400;
    const marginTop = 20;
    const marginRight = 30;
    const marginBottom = 30;
    const marginLeft = 40;

    const svg = d3.select(ref.current);

    d3.csv(dataUrl).then((data) => {
        const filteredData = data.filter((d, i) => 
        i % 50 === 0 && 
        d['2_3_phi'] !== undefined && 
        d['2_3_psi'] !== undefined
    );

    const rawData = data.filter((d, i) => 
        i % 1 === 0 && 
        d['2_3_phi'] !== undefined && 
        d['2_3_psi'] !== undefined
    );

    const x = rawData.map(d => +d['2_3_phi']!); // The '!' after the property tells TypeScript you're sure it's not undefined.
    const y = rawData.map(d => +d['2_3_psi']!);

    const xScale = d3.scaleLinear()
    .domain([-180, 180])  // Set the domain from -180 to 180
    .rangeRound([marginLeft, width - marginRight]);

    const yScale = d3.scaleLinear()
    .domain([-180, 180])  // Set the domain from -180 to 180
    .rangeRound([height - marginBottom, marginTop]);

      const contourData: [number, number][] = data.map((d, i) => [x[i], y[i]]);
      const contours = contourDensity()
        .x(d => xScale(d[0]))
        .y(d => yScale(d[1]))
        .size([width, height])
        .bandwidth(30)
        .thresholds(30)
        (contourData);
      

      svg.selectAll('path')
        .data(contours)

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
        .text("2_3_phi"));  // Adjust the label as appropriate

svg.append("g")
    .attr("transform", `translate(${marginLeft},0)`)
    .call(d3.axisLeft(yScale).tickSizeOuter(0))
    .call(g => g.select(".domain").remove())
    .call(g => g.select(".tick:last-of-type text").clone()
        .attr("x", 3)
        .attr("text-anchor", "start")
        .attr("font-weight", "bold")
        .text("2_3_psi"));  // Adjust the label as appropriate

        svg.append("g")
        .attr("fill", "none")
        .attr("stroke", "steelblue")
        .attr("stroke-linejoin", "round")
        .attr("clip-path", "url(#clip)")  // This applies the clipping
        .selectAll()
        .data(contours)
        .join("path")
        .attr("stroke-width", (d, i) => i % 5 ? 0.25 : 1)
        .attr("d", d3.geoPath());
    
          // Append dots.
  svg.append("g")
  .attr("stroke", "white")
.selectAll()
.data(filteredData)
.join("circle")
.attr("cx", d => xScale(d['2_3_phi'] ? +d['2_3_phi'] : 0))
.attr("cy", d => yScale(d['2_3_psi'] ? +d['2_3_psi'] : 0))
.attr("r", 2);
 

    });
  }, [dataUrl]);

  return <svg ref={ref} width="40rem" height="30rem" />;
};

export default ContourPlot;

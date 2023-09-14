import React, { useEffect, useState, useRef } from 'react';
import * as d3 from 'd3';
import { contourDensity } from 'd3-contour';

type CSVData = {
  [key: string]: string;
};

type ContourPlotProps = {
  dataUrl: string;
};

const ContourPlot: React.FC<ContourPlotProps> = ({ dataUrl }) => {
  const ref = useRef<SVGSVGElement | null>(null);
  const [columns, setColumns] = useState<string[]>([]);
  const [selectedColumns, setSelectedColumns] = useState<{ x: string; y: string }>({ x: '', y: '' });
  const [data, setData] = useState<CSVData[]>([]);

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
      setData(data as CSVData[]);

      if (data.length > 0) {
        setColumns(Object.keys(data[0]));
      }
    });
  }, [dataUrl]);

  useEffect(() => {
    if (!ref.current || data.length === 0 || selectedColumns.x === '' || selectedColumns.y === '') return;

    const svg = d3.select(ref.current);

    const width = 600;
    const height = 400;
    const marginTop = 20;
    const marginRight = 30;
    const marginBottom = 30;
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
      <div>
        <div>
          <label>
            X Axis:
            <select
              value={selectedColumns.x}
              onChange={(e) => setSelectedColumns((prev) => ({ ...prev, x: e.target.value }))}
            >
              {columns.map((col) => (
                <option key={col} value={col}>
                  {col}
                </option>
              ))}
            </select>
          </label>
          <label>
            Y Axis:
            <select
              value={selectedColumns.y}
              onChange={(e) => setSelectedColumns((prev) => ({ ...prev, y: e.target.value }))}
            >
              {columns.map((col) => (
                <option key={col} value={col}>
                  {col}
                </option>
              ))}
            </select>
          </label>
        </div>
        <svg ref={ref} width="40rem" height="30rem" />
      </div>
    );
  };
  
  export default ContourPlot;
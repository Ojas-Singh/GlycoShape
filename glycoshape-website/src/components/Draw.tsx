import React, { useState , useRef} from 'react';
import {
  Button, Text, Flex, Box, Image, 
} from "@chakra-ui/react";

import { ReactComponent as Glc } from './assets/shapes/Glc.svg';
import { ReactComponent as GlcNAc } from './assets/shapes/GlcNAc.svg';
import { ReactComponent as GlcA } from './assets/shapes/GlcA.svg';
import { ReactComponent as GlcN } from './assets/shapes/GlcN.svg';

const shapesLibrary = [
  { id: 1, shape: 'Glc', component: Glc as SVGComponent },
  { id: 2, shape: 'GlcNAc', component: GlcNAc as SVGComponent },
  { id: 3, shape: 'GlcA', component: GlcA as SVGComponent },
  { id: 4, shape: 'GlcN', component: GlcN as SVGComponent },

];



type SVGComponentProps = {
  width?: string;
  height?: string;
};

type SVGComponent = React.FC<SVGComponentProps>;
const DrawingPage = () => {
  const [selectedShape, setSelectedShape] = useState<{ shape: string; component: SVGComponent } | null>(null);
  const [shapes, setShapes] = useState<{ x: number; y: number; component: SVGComponent }[]>([]);
  const canvasRef = useRef(null);

  const handleShapeClick = (shape: string, component: SVGComponent) => {
    setSelectedShape({ shape, component });
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (selectedShape) {
      const rect = (e.target as Element).getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      setShapes([...shapes, { x, y, component: selectedShape.component }]);
    }
  };

  const handleUndo = () => {
    setShapes(shapes.slice(0, -1));
  };

  // const handleDownload = () => {
  //   const canvas = document.createElement('canvas');
  //   canvas.width = 900;
  //   canvas.height = 600;
  //   const context = canvas.getContext('2d');
  
  //   shapes.forEach((shapeObj, index) => {
  //     const img = new Image();
  //     img.src = shapeObj.component; // Assuming shapeObj.component is the URL of the SVG
  //     img.onload = () => {
  //       context?.drawImage(img, shapeObj.x, shapeObj.y, 50, 50);
  
  //       // Check if it's the last image being loaded, if so, trigger the download
  //       if (index === shapes.length - 1) {
  //         const dataUrl = canvas.toDataURL();
  //         const link = document.createElement('a');
  //         link.href = dataUrl;
  //         link.download = 'drawing.png';
  //         link.click();
  //       }
  //     };
  //   });
  // };
  

  return (
    <div>
      <div>
        {shapesLibrary.map(shapeObj => (
          <button key={shapeObj.id} onClick={() => handleShapeClick(shapeObj.shape, shapeObj.component)}>
            <shapeObj.component width="50px" />
          </button>
        ))}
      </div>
      <div>
        <Button onClick={handleUndo}>Undo</Button>
        <Button >Download as PNG</Button>
      </div>
      <div
        style={{
          border: '1px solid black',
          width: '30rem',
          height: '30vh',
          position: 'relative',
        }}
        onClick={handleCanvasClick}
      >
        {shapes.map((shapeObj, index) => (
          <div
            key={index}
            style={{
              position: 'absolute',
              top: `${shapeObj.y}px`,
              left: `${shapeObj.x}px`,
            }}
          >
            <shapeObj.component width="50px" height="50px" />
          </div>
        ))}
      </div>
    </div>
  );
};

export default DrawingPage;

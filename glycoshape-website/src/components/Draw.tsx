import React, { useState , useRef} from 'react';
import { ChevronLeftIcon, ArrowLeftIcon, ArrowRightIcon, Search2Icon, DownloadIcon } from '@chakra-ui/icons'
import {
  Button, Text, Flex, Box, Image, HStack, Spacer, 
} from "@chakra-ui/react";

import { ReactComponent as Glc } from './assets/shapes/Glc.svg';
import { ReactComponent as GlcNAc } from './assets/shapes/GlcNAc.svg';
import { ReactComponent as GlcA } from './assets/shapes/GlcA.svg';
import { ReactComponent as GlcN } from './assets/shapes/GlcN.svg';


// import { ReactComponent as eLeg } from './assets/shapes/4eLeg.svg';
// import { ReactComponent as dAlt } from './assets/shapes/6dAlt.svg';
// import { ReactComponent as dAltNAc } from './assets/shapes/6dAltNAc.svg';
// import { ReactComponent as dGul } from './assets/shapes/6dGul.svg';
// import { ReactComponent as dTal } from './assets/shapes/6dTal.svg';
// import { ReactComponent as dTalNAc } from './assets/shapes/6dTalNAc.svg';
// import { ReactComponent as eAci } from './assets/shapes/8eAci.svg';
// import { ReactComponent as eLeg } from './assets/shapes/8eLeg.svg';
// import { ReactComponent as Abe } from './assets/shapes/Abe.svg';
// import { ReactComponent as Aci } from './assets/shapes/Aci.svg';
// import { ReactComponent as All } from './assets/shapes/All.svg';
// import { ReactComponent as AllA } from './assets/shapes/AllA.svg';
// import { ReactComponent as AllN } from './assets/shapes/AllN.svg';
// import { ReactComponent as AllNAc } from './assets/shapes/AllNAc.svg';
// import { ReactComponent as Alt } from './assets/shapes/Alt.svg';
// import { ReactComponent as AltA } from './assets/shapes/AltA.svg';
// import { ReactComponent as AltN } from './assets/shapes/AltN.svg';
// import { ReactComponent as AltNAc } from './assets/shapes/AltNAc.svg';
// import { ReactComponent as Api } from './assets/shapes/Api.svg';
// import { ReactComponent as Ara } from './assets/shapes/Ara.svg';
// import { ReactComponent as Bac } from './assets/shapes/Bac.svg';
// import { ReactComponent as Col } from './assets/shapes/Col.svg';
// import { ReactComponent as DDmanHep } from './assets/shapes/DDmanHep.svg';
// import { ReactComponent as Dha } from './assets/shapes/Dha.svg';
// import { ReactComponent as Dig } from './assets/shapes/Dig.svg';
// import { ReactComponent as Fru } from './assets/shapes/Fru.svg';
// import { ReactComponent as Fuc } from './assets/shapes/Fuc.svg';
// import { ReactComponent as FucNAc } from './assets/shapes/FucNAc.svg';
// import { ReactComponent as Gal } from './assets/shapes/Gal.svg';
// import { ReactComponent as GalA } from './assets/shapes/GalA.svg';
// import { ReactComponent as GalN } from './assets/shapes/GalN.svg';
// import { ReactComponent as GalNAc } from './assets/shapes/GalNAc.svg';
// import { ReactComponent as Glc } from './assets/shapes/Glc.svg';
// import { ReactComponent as GlcA } from './assets/shapes/GlcA.svg';
// import { ReactComponent as GlcN } from './assets/shapes/GlcN.svg';
// import { ReactComponent as GlcNAc } from './assets/shapes/GlcNAc.svg';
// import { ReactComponent as Gul } from './assets/shapes/Gul.svg';
// import { ReactComponent as GulA } from './assets/shapes/GulA.svg';
// import { ReactComponent as GulN } from './assets/shapes/GulN.svg';
// import { ReactComponent as GulNAc } from './assets/shapes/GulNAc.svg';
// import { ReactComponent as Ido } from './assets/shapes/Ido.svg';
// import { ReactComponent as IdoA } from './assets/shapes/IdoA.svg';
// import { ReactComponent as IdoN } from './assets/shapes/IdoN.svg';
// import { ReactComponent as IdoNAc } from './assets/shapes/IdoNAc.svg';
// import { ReactComponent as Kdn } from './assets/shapes/Kdn.svg';
// import { ReactComponent as Kdo } from './assets/shapes/Kdo.svg';
// import { ReactComponent as Leg } from './assets/shapes/Leg.svg';
// import { ReactComponent as LDmanHep } from './assets/shapes/LDmanHep.svg';
// import { ReactComponent as Lyx } from './assets/shapes/Lyx.svg';
// import { ReactComponent as Man } from './assets/shapes/Man.svg';
// import { ReactComponent as ManA } from './assets/shapes/ManA.svg';
// import { ReactComponent as ManN } from './assets/shapes/ManN.svg';
// import { ReactComponent as ManNAc } from './assets/shapes/ManNAc.svg';
// import { ReactComponent as Mur } from './assets/shapes/Mur.svg';
// import { ReactComponent as MurNAc } from './assets/shapes/MurNAc.svg';
// import { ReactComponent as MurNGc } from './assets/shapes/MurNGc.svg';
// import { ReactComponent as Neu } from './assets/shapes/Neu.svg';
// import { ReactComponent as Neu5Ac } from './assets/shapes/Neu5Ac.svg';
// import { ReactComponent as Neu5Gc } from './assets/shapes/Neu5Gc.svg';
// import { ReactComponent as Oli } from './assets/shapes/Oli.svg';
// import { ReactComponent as Par } from './assets/shapes/Par.svg';
// import { ReactComponent as Pse } from './assets/shapes/Pse.svg';
// import { ReactComponent as Psi } from './assets/shapes/Psi.svg';
// import { ReactComponent as Qui } from './assets/shapes/Qui.svg';
// import { ReactComponent as QuiNAc } from './assets/shapes/QuiNAc.svg';
// import { ReactComponent as Rha } from './assets/shapes/Rha.svg';
// import { ReactComponent as RhaNAc } from './assets/shapes/RhaNAc.svg';
// import { ReactComponent as Rib } from './assets/shapes/Rib.svg';
// import { ReactComponent as Sia } from './assets/shapes/Sia.svg';
// import { ReactComponent as Sor } from './assets/shapes/Sor.svg';
// import { ReactComponent as Tag } from './assets/shapes/Tag.svg';
// import { ReactComponent as Tal } from './assets/shapes/Tal.svg';
// import { ReactComponent as TalA } from './assets/shapes/TalA.svg';
// import { ReactComponent as TalN } from './assets/shapes/TalN.svg';
// import { ReactComponent as TalNAc } from './assets/shapes/TalNAc.svg';
// import { ReactComponent as Tyv } from './assets/shapes/Tyv.svg';
// import { ReactComponent as Xyl } from './assets/shapes/Xyl.svg';



// const shapesLibrary = [
//   { id: 1, shape: '4eLeg', component: eLeg },
//   { id: 2, shape: '6dAlt', component: dAlt },
//   { id: 3, shape: '6dAltNAc', component: dAltNAc },
//   { id: 4, shape: '6dGul', component: dGul },
//   { id: 5, shape: '6dTal', component: dTal },
//   { id: 6, shape: '6dTalNAc', component: dTalNAc },
//   { id: 7, shape: '8eAci', component: eAci },
//   { id: 8, shape: '8eLeg', component: eLeg },
//   { id: 9, shape: 'Abe', component: Abe },
//   { id: 10, shape: 'Aci', component: Aci },
//   { id: 11, shape: 'All', component: All },
//   { id: 12, shape: 'AllA', component: AllA },
//   { id: 13, shape: 'AllN', component: AllN },
//   { id: 14, shape: 'AllNAc', component: AllNAc },
//   { id: 15, shape: 'Alt', component: Alt },
//   { id: 16, shape: 'AltA', component: AltA },
//   { id: 17, shape: 'AltN', component: AltN },
//   { id: 18, shape: 'AltNAc', component: AltNAc },
//   { id: 19, shape: 'Api', component: Api },
//   { id: 20, shape: 'Ara', component: Ara },
//   { id: 21, shape: 'Bac', component: Bac },
//   { id: 22, shape: 'Col', component: Col },
//   { id: 23, shape: 'DDmanHep', component: DDmanHep },
//   { id: 24, shape: 'Dha', component: Dha },
//   { id: 25, shape: 'Dig', component: Dig },
//   { id: 26, shape: 'Fru', component: Fru },
//   { id: 27, shape: 'Fuc', component: Fuc },
//   { id: 28, shape: 'FucNAc', component: FucNAc },
//   { id: 29, shape: 'Gal', component: Gal },
//   { id: 30, shape: 'GalA', component: GalA },
//   { id: 31, shape: 'GalN', component: GalN },
//   { id: 32, shape: 'GalNAc', component: GalNAc },
//   { id: 33, shape: 'Glc', component: Glc },
//   { id: 34, shape: 'GlcA', component: GlcA },
//   { id: 35, shape: 'GlcN', component: GlcN },
//   { id: 36, shape: 'GlcNAc', component: GlcNAc },
//   { id: 37, shape: 'Gul', component: Gul },
//   { id: 38, shape: 'GulA', component: GulA },
//   { id: 39, shape: 'GulN', component: GulN },
//   { id: 40, shape: 'GulNAc', component: GulNAc },
//   { id: 41, shape: 'Ido', component: Ido },
//   { id: 42, shape: 'IdoA', component: IdoA },
//   { id: 43, shape: 'IdoN', component: IdoN },
//   { id: 44, shape: 'IdoNAc', component: IdoNAc },
//   { id: 45, shape: 'Kdn', component: Kdn },
//   { id: 46, shape: 'Kdo', component: Kdo },
//   { id: 47, shape: 'Leg', component: Leg },
//   { id: 48, shape: 'LDmanHep', component: LDmanHep },
//   { id: 49, shape: 'Lyx', component: Lyx },
//   { id: 50, shape: 'Man', component: Man },
//   { id: 51, shape: 'ManA', component: ManA },
//   { id: 52, shape: 'ManN', component: ManN },
//   { id: 53, shape: 'ManNAc', component: ManNAc },
//   { id: 54, shape: 'Mur', component: Mur },
//   { id: 55, shape: 'MurNAc', component: MurNAc },
//   { id: 56, shape: 'MurNGc', component: MurNGc },
//   { id: 57, shape: 'Neu', component: Neu },
//   { id: 58, shape: 'Neu5Ac', component: Neu5Ac },
//   { id: 59, shape: 'Neu5Gc', component: Neu5Gc },
//   { id: 60, shape: 'Oli', component: Oli },
//   { id: 61, shape: 'Par', component: Par },
//   { id: 62, shape: 'Pse', component: Pse },
//   { id: 63, shape: 'Psi', component: Psi },
//   { id: 64, shape: 'Qui', component: Qui },
//   { id: 65, shape: 'QuiNAc', component: QuiNAc },
//   { id: 66, shape: 'Rha', component: Rha },
//   { id: 67, shape: 'RhaNAc', component: RhaNAc },
//   { id: 68, shape: 'Rib', component: Rib },
//   { id: 69, shape: 'Sia', component: Sia },
//   { id: 70, shape: 'Sor', component: Sor },
//   { id: 71, shape: 'Tag', component: Tag },
//   { id: 72, shape: 'Tal', component: Tal },
//   { id: 73, shape: 'TalA', component: TalA },
//   { id: 74, shape: 'TalN', component: TalN },
//   { id: 75, shape: 'TalNAc', component: TalNAc },
//   { id: 76, shape: 'Tyv', component: Tyv },
//   { id: 77, shape: 'Xyl', component: Xyl },
// ];


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
    <div >
      {/* <div>
        <HStack>
        <Button onClick={handleUndo}><ChevronLeftIcon /></Button>
        <Spacer />
        <Button ><DownloadIcon /></Button>
        </HStack>
      </div>
      <div style={{ overflowX: 'scroll', display: 'flex', whiteSpace: 'nowrap' }}>
        {shapesLibrary.map(shapeObj => (
          <button key={shapeObj.id} onClick={() => handleShapeClick(shapeObj.shape, shapeObj.component)}>
            <shapeObj.component width="50px" />
          </button>
        ))}
      </div> */}
      <HStack>
      <iframe
                      // key={sequence}
                      width="100%"
                      height="600px"
                      
                      src={`/draw/index.html`}                                  frameBorder="0"
                      allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      title="Protein Structure"
                              />
      {/* <div
        style={{
          border: '1px solid teal',
          width: '85rem',
          height: '50vh',
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
        
      </div> */}
      {/* <Button position={"absolute"} transform="translateY(10%)" alignContent={"center"} right={"2rem"} type="submit"
            borderRadius="full" 
            backgroundColor="#7CC9A9"
            _hover={{
              backgroundColor: "#51BF9D"
            }}
            // onClick={handleSearch}
          >
            Search <Search2Icon />
          </Button> */}
      </HStack>
    </div>
  );
};

export default DrawingPage;

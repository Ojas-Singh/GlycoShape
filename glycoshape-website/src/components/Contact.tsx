import React, { useState, useRef } from 'react';
import './Drawer.css';

const Drawer: React.FC = () => {
  const [isOpen, setIsOpen] = useState(true);
  const [width, setWidth] = useState(300); // initial width of the drawer
  const isResizing = useRef(false);

  const handleMouseDown = () => {
    isResizing.current = true;
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleMouseMove = (event: MouseEvent) => {
    if (isResizing.current) {
      setWidth(event.clientX);
    }
  };

  const handleMouseUp = () => {
    isResizing.current = false;
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  };

  return (
    <div>
      {isOpen && (
        <div className="drawer" style={{ width }}>
          <div className="drawer-content">
            Content here
          </div>
          <div 
            className="drawer-resizer"
            onMouseDown={handleMouseDown}
          />
        </div>
      )}
      <button onClick={() => setIsOpen(!isOpen)}>Toggle Drawer</button>
    </div>
  );
};

export default Drawer;

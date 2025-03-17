import React, { useRef, useState } from 'react';
import ClearIcon from '@mui/icons-material/Clear';
import clsx from 'clsx';

export interface Point {
  x: number;
  y: number;
}

interface SignatureCanvasProps {
  lines: Point[][];
  onDraw: (lines: Point[][]) => void;
  width?: number;
  height?: number;
  className?: string;
}

interface SVGImageProps {
  lines: Point[][];
  width?: number;
  height?: number;
}

// Enhanced SVGImage component with download functionality
const SVGImage: React.FC<SVGImageProps> = ({ lines, width = 280, height = 200 }) => {
  const svgRef = useRef<SVGSVGElement>(null);

  if (!lines || lines.length === 0) return <></>;

  let d = '';
  lines.forEach(line => {
    d += "M " + line.map(point => `${point.x} ${point.y}`).join(' L ');
  });

  const handleDownload = () => {
    if (!svgRef.current) return;
    
    // Create a serialized SVG string
    const svgData = new XMLSerializer().serializeToString(svgRef.current);
    
    // Create a Blob from the SVG string
    const blob = new Blob([svgData], { type: 'image/svg+xml' });
    
    // Create a data URL from the Blob
    const url = URL.createObjectURL(blob);
    
    // Create an anchor element and trigger download
    const a = document.createElement('a');
    a.href = url;
    a.download = 'signature.svg';
    document.body.appendChild(a);
    a.click();
    
    // Clean up
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="relative w-full h-full">
      <svg 
        ref={svgRef}
        className="w-full h-full" 
        viewBox={`0 0 ${width} ${height}`}
      >
        <path 
          d={d} 
          className="fill-none stroke-black stroke-2 stroke-round"
        />
      </svg>
      <button
        onClick={handleDownload}
        className="absolute bottom-2 right-2 bg-blue-500 text-white p-1 rounded text-xs hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-300"
        title="Download Signature"
      >
        <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
          <polyline points="7 10 12 15 17 10"></polyline>
          <line x1="12" y1="15" x2="12" y2="3"></line>
        </svg>
      </button>
    </div>
  );
};

// Enhanced SignatureCanvas as a functional component
const SignatureCanvas: React.FC<SignatureCanvasProps> = ({
  lines,
  onDraw,
  width = 280,
  height = 200,
  className
}) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  const relativeCoordinatesForEvent = (e: React.MouseEvent | React.TouchEvent | TouchEvent | MouseEvent): Point => {
    if (!canvasRef.current) {
      return { x: 0, y: 0 };
    }

    const boundingRect = canvasRef.current.getBoundingClientRect();
    const scaleX = width / boundingRect.width;
    const scaleY = height / boundingRect.height;
  
    // Handle touch events
    if ('touches' in e) {
      return {
        x: (e.touches[0].clientX - boundingRect.left) * scaleX,
        y: (e.touches[0].clientY - boundingRect.top) * scaleY,
      };
    } 
    // Handle mouse events
    else {
      return {
        x: ((e as MouseEvent).clientX - boundingRect.left) * scaleX,
        y: ((e as MouseEvent).clientY - boundingRect.top) * scaleY,
      };
    }
  };

  const handleMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
    // Only handle left mouse button clicks
    if ('button' in e && e.button !== 0 && e.type !== 'touchstart') {
      return;
    }

    const point = relativeCoordinatesForEvent(e);
    const newLines = [...lines, [point]];
    onDraw(newLines);
    setIsDrawing(true);
  };

  const handleMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) {
      return;
    }

    const point = relativeCoordinatesForEvent(e);
    const newLines = [...lines];
    
    if (newLines.length > 0) {
      newLines[newLines.length - 1].push(point);
      onDraw(newLines);
    }
  };

  const handleMouseUp = () => {
    setIsDrawing(false);
  };

  const clear = () => {
    onDraw([]);
  };

  return (
    <div
      className={clsx("relative", className || "w-[400px] h-[200px] border border-gray-300 rounded cursor-crosshair")}
      ref={canvasRef}
      onTouchStart={handleMouseDown}
      onTouchMove={handleMouseMove}
      onTouchEnd={handleMouseUp}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      style={{ touchAction: 'none' }}
    >
      <SVGImage lines={lines} width={width} height={height} />
      <button
        type="button"
        onClick={clear}
        className="absolute top-2 right-2 z-[100] hover:text-[tomato] focus:text-[tomato]"
      >
        <ClearIcon fontSize="small" />
      </button>
    </div>
  );
};

export default SignatureCanvas;
import { Path, Svg } from '@react-pdf/renderer';
import { Point } from '../types';

interface SignatureRendererProps {
  paths: Point[][];
}

const SignatureRenderer: React.FC<SignatureRendererProps> = ({ paths }) => {
  // Calculate the bounding box of the signature
  const allPoints = paths.flatMap(path => path);
  const minX = Math.min(...allPoints.map(p => p.x));
  const maxX = Math.max(...allPoints.map(p => p.x));
  const minY = Math.min(...allPoints.map(p => p.y));
  const maxY = Math.max(...allPoints.map(p => p.y));
  
  // Add some padding
  const padding = 10;
  const width = maxX - minX + padding * 2;
  const height = maxY - minY + padding * 2;
  
  return (
    <Svg width={width} height={height} viewBox={`${minX - padding} ${minY - padding} ${width} ${height}`}>
      {paths.map((points, index) => {
        if (points.length === 0) return null;
        
        // Create SVG path data
        let pathData = `M ${points[0].x} ${points[0].y}`;
        for (let i = 1; i < points.length; i++) {
          pathData += ` L ${points[i].x} ${points[i].y}`;
        }
        
        return (
          <Path
            key={index}
            d={pathData}
            stroke="#000"
            strokeWidth={1.5}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        );
      })}
    </Svg>
  );
};

export default SignatureRenderer;
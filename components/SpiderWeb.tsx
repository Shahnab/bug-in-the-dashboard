
import React from 'react';

interface SpiderWebProps {
  onClick: () => void;
  hasSpider: boolean;
}

export const SpiderWeb: React.FC<SpiderWebProps> = ({ onClick, hasSpider }) => {
  const [isHovered, setIsHovered] = React.useState(false);
  
  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        right: 0,
        margin: '32px',
        width: '192px',
        height: '192px',
        cursor: 'pointer',
        zIndex: 10,
        opacity: hasSpider ? 0 : 1,
        pointerEvents: hasSpider ? 'none' : 'auto',
        transform: hasSpider ? 'scale(0.75)' : 'scale(1)',
        transition: 'all 1000ms ease-in-out'
      }}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ animation: 'pulse 2s infinite' }}>
        <defs>
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="strongGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="5" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        
        {/* Main web structure */}
        <path
          d="M50 0 V100 M0 50 H100 M15 15 L85 85 M15 85 L85 15"
          stroke={isHovered ? "#c4b5fd" : "rgba(196, 181, 253, 0.7)"}
          strokeWidth="0.8"
          style={{ filter: "url(#glow)", transition: 'all 500ms ease' }}
        />
        
        {/* Concentric circles */}
        <circle 
          cx="50" cy="50" r="15" 
          stroke={isHovered ? "#c4b5fd" : "rgba(196, 181, 253, 0.8)"}
          strokeWidth="0.6" 
          style={{ filter: "url(#glow)", transition: 'all 500ms ease' }} 
          fill="none"
        />
        <circle 
          cx="50" cy="50" r="30" 
          stroke={isHovered ? "#c4b5fd" : "rgba(196, 181, 253, 0.6)"}
          strokeWidth="0.6" 
          style={{ filter: "url(#glow)", transition: 'all 500ms ease' }} 
          fill="none"
        />
        <circle 
          cx="50" cy="50" r="45" 
          stroke={isHovered ? "#c4b5fd" : "rgba(196, 181, 253, 0.4)"}
          strokeWidth="0.6" 
          style={{ filter: "url(#glow)", transition: 'all 500ms ease' }} 
          fill="none"
        />
        
        {/* Additional radial lines for more web-like structure */}
        <path
          d="M50 10 L50 90 M35 20 L65 80 M20 35 L80 65 M10 50 L90 50 M20 65 L80 35 M35 80 L65 20"
          stroke={isHovered ? "rgba(168, 85, 247, 0.5)" : "rgba(168, 85, 247, 0.3)"}
          strokeWidth="0.3"
          style={{ filter: "url(#glow)", transition: 'all 500ms ease' }}
        />
      </svg>
      
      {/* Enhanced glow effect */}
      <div style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{
          width: '80px',
          height: '80px',
          backgroundColor: '#8b5cf6',
          borderRadius: '50%',
          filter: 'blur(48px)',
          opacity: isHovered ? 0.6 : 0.2,
          transition: 'all 500ms ease',
          animation: 'pulse 2s infinite'
        }}></div>
      </div>
      
      {/* Additional sparkle effects */}
      <div style={{
        position: 'absolute',
        top: '8px',
        right: '8px',
        width: '4px',
        height: '4px',
        backgroundColor: '#d8b4fe',
        borderRadius: '50%',
        opacity: isHovered ? 1 : 0,
        transition: 'opacity 300ms ease',
        animation: isHovered ? 'ping 1s infinite' : 'none'
      }}></div>
      <div style={{
        position: 'absolute',
        bottom: '16px',
        left: '16px',
        width: '4px',
        height: '4px',
        backgroundColor: '#c084fc',
        borderRadius: '50%',
        opacity: isHovered ? 1 : 0,
        transition: 'opacity 500ms ease',
        animation: isHovered ? 'ping 1s infinite 0.5s' : 'none'
      }}></div>
      <div style={{
        position: 'absolute',
        top: '33%',
        left: '25%',
        width: '2px',
        height: '2px',
        backgroundColor: 'white',
        borderRadius: '50%',
        opacity: isHovered ? 1 : 0,
        transition: 'opacity 300ms ease',
        animation: isHovered ? 'ping 1s infinite 1s' : 'none'
      }}></div>
      
      {/* Click Here text */}
      <div style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        pointerEvents: 'none'
      }}>
        <div style={{
          backgroundColor: isHovered ? 'rgba(139, 92, 246, 0.9)' : 'rgba(139, 92, 246, 0.8)',
          color: 'white',
          padding: '8px 12px',
          borderRadius: '20px',
          fontSize: '14px',
          fontWeight: 'bold',
          fontFamily: 'Arial, sans-serif',
          textAlign: 'center',
          boxShadow: '0 4px 12px rgba(139, 92, 246, 0.4)',
          border: '2px solid rgba(196, 181, 253, 0.6)',
          backdropFilter: 'blur(4px)',
          transform: isHovered ? 'scale(1.05)' : 'scale(1)',
          transition: 'all 300ms ease',
          animation: 'pulse 2s infinite'
        }}>
          Click Here
        </div>
      </div>
    </div>
  );
};

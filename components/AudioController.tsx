import React, { useState, useRef, useEffect } from 'react';

interface AudioControllerProps {
  audioSrc: string;
}

export const AudioController: React.FC<AudioControllerProps> = ({ audioSrc }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [hasUserInteracted, setHasUserInteracted] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.loop = true;
      audioRef.current.volume = 0.3; // Set to 30% volume by default
    }
  }, []);

  const handlePlay = async () => {
    if (!audioRef.current) return;
    
    try {
      setHasUserInteracted(true);
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        await audioRef.current.play();
        setIsPlaying(true);
      }
    } catch (error) {
      console.log('Audio play failed:', error);
    }
  };

  const handleMute = () => {
    if (!audioRef.current) return;
    
    if (isMuted) {
      audioRef.current.volume = 0.3;
      setIsMuted(false);
    } else {
      audioRef.current.volume = 0;
      setIsMuted(true);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: '20px',
      right: '20px',
      zIndex: 1000,
      display: 'flex',
      gap: '8px',
      alignItems: 'center'
    }}>
      <audio
        ref={audioRef}
        src={audioSrc}
        preload="auto"
      />
      
      {/* Play/Pause Button */}
      <button
        onClick={handlePlay}
        style={{
          width: '50px',
          height: '50px',
          borderRadius: '50%',
          border: '2px solid #8b5cf6',
          backgroundColor: isPlaying ? 'rgba(139, 92, 246, 0.9)' : 'rgba(255, 255, 255, 0.9)',
          color: isPlaying ? 'white' : '#8b5cf6',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '16px',
          fontWeight: 'bold',
          boxShadow: '0 4px 12px rgba(139, 92, 246, 0.3)',
          backdropFilter: 'blur(8px)',
          transition: 'all 300ms ease',
          outline: 'none'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.1)';
          e.currentTarget.style.boxShadow = '0 6px 16px rgba(139, 92, 246, 0.4)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(139, 92, 246, 0.3)';
        }}
      >
        {isPlaying ? '⏸️' : '▶️'}
      </button>

      {/* Mute Button */}
      {hasUserInteracted && (
        <button
          onClick={handleMute}
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            border: '2px solid #8b5cf6',
            backgroundColor: isMuted ? 'rgba(239, 68, 68, 0.9)' : 'rgba(255, 255, 255, 0.9)',
            color: isMuted ? 'white' : '#8b5cf6',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '14px',
            boxShadow: '0 4px 12px rgba(139, 92, 246, 0.3)',
            backdropFilter: 'blur(8px)',
            transition: 'all 300ms ease',
            outline: 'none'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.1)';
            e.currentTarget.style.boxShadow = '0 6px 16px rgba(139, 92, 246, 0.4)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(139, 92, 246, 0.3)';
          }}
        >
          {isMuted ? '🔇' : '🔊'}
        </button>
      )}

      {/* Instructions tooltip */}
      {!hasUserInteracted && (
        <div style={{
          position: 'absolute',
          top: '60px',
          right: '0',
          backgroundColor: 'rgba(139, 92, 246, 0.95)',
          color: 'white',
          padding: '8px 12px',
          borderRadius: '8px',
          fontSize: '12px',
          fontWeight: 'bold',
          whiteSpace: 'nowrap',
          boxShadow: '0 4px 12px rgba(139, 92, 246, 0.4)',
          animation: 'pulse 2s infinite',
          zIndex: 1001
        }}>
          🎵 Click to play Halloween music!
        </div>
      )}
    </div>
  );
};
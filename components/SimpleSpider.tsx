import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface SimpleSpiderProps {
  id: number;
  position: [number, number, number];
  onClick: (id: number) => void;
}

export const SimpleSpider: React.FC<SimpleSpiderProps> = ({ id, position, onClick }) => {
  const ref = useRef<THREE.Group>(null!);
  
  // Simple movement animation
  useFrame((state, delta) => {
    if (ref.current) {
      ref.current.rotation.z += delta * 0.5;
      ref.current.position.x = position[0] + Math.sin(state.clock.elapsedTime) * 0.5;
      ref.current.position.y = position[1] + Math.cos(state.clock.elapsedTime) * 0.5;
    }
  });

  const handleClick = (e: any) => {
    e.stopPropagation();
    console.log('Simple spider clicked!', id);
    onClick(id);
  };

  return (
    <group ref={ref} position={position} onClick={handleClick}>
      {/* Spider body */}
      <mesh>
        <sphereGeometry args={[0.2, 16, 12]} />
        <meshStandardMaterial color="#4a0e4e" emissive="#2a0a2a" />
      </mesh>
      
      {/* Spider legs */}
      {Array.from({ length: 8 }).map((_, i) => {
        const angle = (i / 8) * Math.PI * 2;
        return (
          <mesh key={i} position={[Math.cos(angle) * 0.3, Math.sin(angle) * 0.3, 0]} rotation={[0, 0, angle]}>
            <cylinderGeometry args={[0.02, 0.02, 0.4]} />
            <meshStandardMaterial color="#6a0e6e" />
          </mesh>
        );
      })}
      
      {/* Eyes */}
      <mesh position={[0.08, 0.08, 0.15]}>
        <sphereGeometry args={[0.03, 8, 6]} />
        <meshBasicMaterial color="#ff0000" />
      </mesh>
      <mesh position={[-0.08, 0.08, 0.15]}>
        <sphereGeometry args={[0.03, 8, 6]} />
        <meshBasicMaterial color="#ff0000" />
      </mesh>
    </group>
  );
};
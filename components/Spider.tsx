import React, { useRef, useState, useEffect } from 'react';
import { useGLTF, useAnimations } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { type Group } from 'three';

interface SpiderProps {
  id: number;
  initialPosition: [number, number, number];
  onClick: (id: number, position: [number, number, number]) => void;
}

// NOTE TO USER: Please download the "hi-fi-spider" model from Sketchfab:
// https://sketchfab.com/3d-models/hi-fi-spider-ff8a4433a5d449a3a0fc54989185a024
// Ensure the model is in GLB format, rename the file to "spider.glb",
// and place it in the "/asset/" folder.
const spiderModelUrl = './asset/spider.glb';

// Preload the model
useGLTF.preload(spiderModelUrl);

export const Spider: React.FC<SpiderProps> = ({ id, initialPosition, onClick }) => {
  const ref = useRef<Group>(null!);
  const [modelError, setModelError] = useState<boolean>(false);
  
  console.log('Spider component rendered with ID:', id, 'at position:', initialPosition);
  
  // Try to load the GLTF model
  let gltf: any;
  let nodes: any, materials: any, animations: any;
  
  try {
    gltf = useGLTF(spiderModelUrl) as any;
    nodes = gltf.nodes;
    materials = gltf.materials;
    animations = gltf.animations;
    console.log('GLTF model loaded successfully', gltf);
  } catch (error) {
    console.warn('Failed to load GLTF spider model, using fallback:', error);
    setModelError(true);
  }
  
  const { actions } = useAnimations(animations, ref);

  useEffect(() => {
    // Play the first animation clip found in the model.
    if (animations && animations.length > 0) {
      const animationName = animations[0].name;
      actions[animationName]?.reset().fadeIn(0.5).play();
      
      return () => {
        actions[animationName]?.fadeOut(0.5);
      };
    }
  }, [actions, animations]);

  const [velocity] = useState(() =>
    new THREE.Vector3(
      (Math.random() - 0.5) * 2,
      (Math.random() - 0.5) * 2,
      0
    ).normalize().multiplyScalar(1.0 + Math.random() * 2.0) // Random speed between 1.0 and 3.0
  );

  useFrame((state, delta) => {
    const { viewport } = state;
    const halfWidth = viewport.width / 2;
    const halfHeight = viewport.height / 2;

    if (ref.current) {
      ref.current.position.add(velocity.clone().multiplyScalar(delta));

      const { x, y } = ref.current.position;

      if (x > halfWidth || x < -halfWidth) {
        velocity.x *= -1;
        ref.current.position.x = Math.sign(x) * halfWidth;
      }
      if (y > halfHeight || y < -halfHeight) {
        velocity.y *= -1;
        ref.current.position.y = Math.sign(y) * halfHeight;
      }
      
      // Face direction of movement - adjust for the new model's orientation
      ref.current.rotation.y = Math.atan2(velocity.x, velocity.y);
    }
  });

  const [isClicked, setIsClicked] = useState<boolean>(false);

  const handleClick = (e: any) => {
    e.stopPropagation();
    setIsClicked(true);
    setTimeout(() => setIsClicked(false), 200); // Visual feedback duration
    onClick(id, [ref.current.position.x, ref.current.position.y, ref.current.position.z]);
  };
    
  // Check if we should use fallback
  const shouldUseFallback = modelError || !nodes || !gltf;
  
  if (shouldUseFallback) {
    console.log('Rendering fallback spider for ID:', id, 'modelError:', modelError, 'hasNodes:', !!nodes);
    return (
      <group ref={ref} position={initialPosition} scale={isClicked ? 1.5 : 1.0} onClick={handleClick} dispose={null}>
        {/* Main spider body - much larger and more visible - FALLBACK VERSION */}
        <mesh>
          <sphereGeometry args={[0.3, 16, 12]} />
          <meshStandardMaterial color={isClicked ? "#ff6b6b" : "#ff4444"} emissive="#ff0000" emissiveIntensity={0.3} />
        </mesh>
        
        {/* Spider legs as simple cylinders - thicker and more visible */}
        {Array.from({ length: 8 }).map((_, i) => {
          const angle = (i / 8) * Math.PI * 2;
          return (
            <mesh key={i} position={[Math.cos(angle) * 0.4, Math.sin(angle) * 0.4, 0]} rotation={[0, 0, angle]}>
              <cylinderGeometry args={[0.02, 0.02, 0.6]} />
              <meshStandardMaterial color={isClicked ? "#8b5cf6" : "#4a0e4e"} emissive="#2a0a2a" emissiveIntensity={0.1} />
            </mesh>
          );
        })}
        
        {/* Eyes - two small red spheres */}
        <mesh position={[0.1, 0.1, 0.2]}>
          <sphereGeometry args={[0.05, 8, 6]} />
          <meshBasicMaterial color="#ff0000" />
        </mesh>
        <mesh position={[-0.1, 0.1, 0.2]}>
          <sphereGeometry args={[0.05, 8, 6]} />
          <meshBasicMaterial color="#ff0000" />
        </mesh>
        
        {/* Glow effect when clicked */}
        {isClicked && (
          <mesh>
            <sphereGeometry args={[0.6, 16, 12]} />
            <meshBasicMaterial color="#8b5cf6" transparent opacity={0.3} />
          </mesh>
        )}
      </group>
    );
  }

  // Debug the GLTF structure
  console.log('GLTF nodes available:', nodes ? Object.keys(nodes) : 'none');
  console.log('GLTF materials available:', materials ? Object.keys(materials) : 'none');
  
  // This JSX structure is based on the "hi-fi-spider" model from Sketchfab.
  // It includes necessary rotations and structure to orient and render the model correctly.
  return (
    <group ref={ref} position={initialPosition} scale={isClicked ? 1.2 : 0.8} onClick={handleClick} dispose={null}>
      {/* Try to render the entire GLTF scene */}
      <primitive object={gltf.scene} scale={0.1} />
      
      {/* Glow effect when clicked */}
      {isClicked && (
        <mesh>
          <sphereGeometry args={[0.3, 16, 12]} />
          <meshBasicMaterial color="#8b5cf6" transparent opacity={0.2} />
        </mesh>
      )}
    </group>
  );
};

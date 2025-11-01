import React, { useRef, useState, useEffect } from 'react';
import { useGLTF, useAnimations } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { type Group } from 'three';

interface Spider3DProps {
  id: number;
  initialPosition: [number, number, number];
  onClick: (id: number, position: [number, number, number]) => void;
}

const spiderModelUrl = './asset/spider.glb';
useGLTF.preload(spiderModelUrl);

export const Spider3D: React.FC<Spider3DProps> = ({ id, initialPosition, onClick }) => {
  const ref = useRef<Group>(null!);
  const [modelError, setModelError] = useState<boolean>(false);
  const [isClicked, setIsClicked] = useState<boolean>(false);
  const [targetPosition] = useState(() => 
    new THREE.Vector3(
      Math.random() * 16 - 8,  // X: -8 to 8
      Math.random() * 8 - 1,   // Y: -1 to 7
      Math.random() * 12 - 6   // Z: -6 to 6
    )
  );
  const [currentTarget, setCurrentTarget] = useState(() => targetPosition.clone());
  const [velocity] = useState(() => new THREE.Vector3());
  
  // Load GLTF model
  let gltf: any;
  let nodes: any, materials: any, animations: any;
  
  try {
    gltf = useGLTF(spiderModelUrl) as any;
    nodes = gltf.nodes;
    materials = gltf.materials;
    animations = gltf.animations;
    console.log('3D Spider model loaded successfully');
  } catch (error) {
    console.warn('Failed to load 3D spider model:', error);
    setModelError(true);
  }
  
  const { actions } = useAnimations(animations, ref);
  
  useEffect(() => {
    if (animations && animations.length > 0) {
      const animationName = animations[0].name;
      actions[animationName]?.reset().fadeIn(0.5).play();
      
      return () => {
        actions[animationName]?.fadeOut(0.5);
      };
    }
  }, [actions, animations]);

  // 3D Movement with surface detection
  useFrame((state, delta) => {
    if (!ref.current) return;
    
    const spider = ref.current;
    const speed = 2.0;
    
    // Move towards target
    const direction = currentTarget.clone().sub(spider.position).normalize();
    velocity.lerp(direction.multiplyScalar(speed), 0.02);
    spider.position.add(velocity.clone().multiplyScalar(delta));
    
    // Boundary constraints for 3D space
    spider.position.x = THREE.MathUtils.clamp(spider.position.x, -9, 9);
    spider.position.y = THREE.MathUtils.clamp(spider.position.y, -1.8, 7);
    spider.position.z = THREE.MathUtils.clamp(spider.position.z, -7, 7);
    
    // Change target periodically
    if (spider.position.distanceTo(currentTarget) < 0.5) {
      setCurrentTarget(new THREE.Vector3(
        Math.random() * 16 - 8,
        Math.random() * 8 - 1,
        Math.random() * 12 - 6
      ));
    }
    
    // Face movement direction
    if (velocity.length() > 0.01) {
      const lookDirection = velocity.clone().normalize();
      const targetRotation = Math.atan2(lookDirection.x, lookDirection.z);
      spider.rotation.y = THREE.MathUtils.lerp(spider.rotation.y, targetRotation, 0.1);
    }
    
    // Add subtle floating motion
    spider.position.y += Math.sin(state.clock.elapsedTime * 3 + id) * 0.02;
  });

  const handleClick = (e: any) => {
    e.stopPropagation();
    setIsClicked(true);
    setTimeout(() => setIsClicked(false), 200);
    onClick(id, [ref.current.position.x, ref.current.position.y, ref.current.position.z]);
  };

  // Enhanced fallback spider for 3D environment
  if (modelError || !nodes || !gltf) {
    return (
      <group ref={ref} position={initialPosition} scale={isClicked ? 1.3 : 1.0} onClick={handleClick} castShadow>
        {/* Main spider body */}
        <mesh castShadow>
          <sphereGeometry args={[0.25, 16, 12]} />
          <meshStandardMaterial 
            color={isClicked ? "#8b5cf6" : "#2a0a2a"} 
            emissive="#4a0e4e" 
            emissiveIntensity={0.3}
            roughness={0.8}
            metalness={0.2}
          />
        </mesh>
        
        {/* Spider legs with better 3D positioning */}
        {Array.from({ length: 8 }).map((_, i) => {
          const angle = (i / 8) * Math.PI * 2;
          const legLength = 0.6;
          const legHeight = Math.sin(i * 0.5) * 0.2;
          return (
            <group key={i} rotation={[0, angle, 0]}>
              <mesh 
                position={[0.4, legHeight, 0]} 
                rotation={[0, 0, Math.PI / 6]} 
                castShadow
              >
                <cylinderGeometry args={[0.02, 0.02, legLength]} />
                <meshStandardMaterial 
                  color={isClicked ? "#8b5cf6" : "#4a0e4e"} 
                  emissive="#2a0a2a" 
                  emissiveIntensity={0.1}
                />
              </mesh>
            </group>
          );
        })}
        
        {/* Eyes */}
        <mesh position={[0.1, 0.1, 0.2]} castShadow>
          <sphereGeometry args={[0.04, 8, 6]} />
          <meshBasicMaterial color="#ff0000" />
        </mesh>
        <mesh position={[-0.1, 0.1, 0.2]} castShadow>
          <sphereGeometry args={[0.04, 8, 6]} />
          <meshBasicMaterial color="#ff0000" />
        </mesh>
        
        {/* Glow effect when clicked */}
        {isClicked && (
          <mesh>
            <sphereGeometry args={[0.8, 16, 12]} />
            <meshBasicMaterial color="#8b5cf6" transparent opacity={0.3} />
          </mesh>
        )}
      </group>
    );
  }

  // Render 3D GLTF model
  return (
    <group ref={ref} position={initialPosition} scale={isClicked ? 1.2 : 0.8} onClick={handleClick} castShadow>
      <primitive object={gltf.scene} scale={0.1} castShadow receiveShadow />
      
      {/* Glow effect when clicked */}
      {isClicked && (
        <mesh>
          <sphereGeometry args={[0.5, 16, 12]} />
          <meshBasicMaterial color="#8b5cf6" transparent opacity={0.2} />
        </mesh>
      )}
    </group>
  );
};
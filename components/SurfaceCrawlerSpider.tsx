import React, { useRef, useState, useEffect } from 'react';
import { useGLTF, useAnimations } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { type Group } from 'three';

interface SurfaceCrawlerSpiderProps {
  id: number;
  initialPosition: [number, number, number];
  onClick?: (id: number, position: [number, number, number]) => void;
}

const spiderModelUrl = '/asset/spider.glb';
useGLTF.preload(spiderModelUrl);

export const SurfaceCrawlerSpider: React.FC<SurfaceCrawlerSpiderProps> = ({ id, initialPosition, onClick }) => {
  const ref = useRef<Group>(null!);
  const { scene } = useThree();
  const [modelError, setModelError] = useState<boolean>(false);
  const [isClicked, setIsClicked] = useState<boolean>(false);
  
  // Enhanced movement state with realistic physics
  const [currentSurface, setCurrentSurface] = useState<'floor' | 'wall' | 'bar'>('floor');
  const [targetPosition] = useState(() => new THREE.Vector3(...initialPosition));
  const [velocity] = useState(() => new THREE.Vector3());
  const [acceleration] = useState(() => new THREE.Vector3());
  const [previousPosition] = useState(() => new THREE.Vector3(...initialPosition));
  const [movementState, setMovementState] = useState<'exploring' | 'avoiding' | 'paused' | 'turning' | 'stuck' | 'escaping'>('exploring');
  const [pauseTimer, setPauseTimer] = useState(0);
  const [directionChangeTimer, setDirectionChangeTimer] = useState(0);
  const [legAnimationPhase, setLegAnimationPhase] = useState(0);
  const [stuckTimer, setStuckTimer] = useState(0);
  const [lastPosition] = useState(() => new THREE.Vector3(...initialPosition));
  const [escapeDirection] = useState(() => new THREE.Vector3());
  const raycaster = useRef(new THREE.Raycaster());
  
  // Load GLTF model
  let gltf: any;
  let nodes: any, materials: any, animations: any;
  
  try {
    gltf = useGLTF(spiderModelUrl) as any;
    nodes = gltf.nodes;
    materials = gltf.materials;
    animations = gltf.animations;
  } catch (error) {
    console.warn('Failed to load spider model:', error);
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

  // Accurate collision detection matching exact chart dimensions
  const detectObstacle = (x: number, z: number) => {
    let detected = false;
    let distanceToNearestObstacle = Infinity;
    
    // Chart Panel 1: Sprint Progress (center: -8, -3, size: 4x3)
    // Base: from -10 to -6 (X) and -4.5 to -1.5 (Z)
    if (x >= -10.2 && x <= -5.8 && z >= -4.7 && z <= -1.3) {
      detected = true;
      distanceToNearestObstacle = 0;
    } else {
      // Calculate distance to chart edges
      const minX1 = Math.max(0, Math.max(-10.2 - x, x - (-5.8)));
      const minZ1 = Math.max(0, Math.max(-4.7 - z, z - (-1.3)));
      const dist1 = Math.sqrt(minX1 * minX1 + minZ1 * minZ1);
      distanceToNearestObstacle = Math.min(distanceToNearestObstacle, dist1);
    }
    
    // Chart Panel 2: Team Velocity (center: 8, -3, size: 4x3)
    // Base: from 6 to 10 (X) and -4.5 to -1.5 (Z)
    if (x >= 5.8 && x <= 10.2 && z >= -4.7 && z <= -1.3) {
      detected = true;
      distanceToNearestObstacle = 0;
    } else {
      // Calculate distance to chart edges
      const minX2 = Math.max(0, Math.max(5.8 - x, x - 10.2));
      const minZ2 = Math.max(0, Math.max(-4.7 - z, z - (-1.3)));
      const dist2 = Math.sqrt(minX2 * minX2 + minZ2 * minZ2);
      distanceToNearestObstacle = Math.min(distanceToNearestObstacle, dist2);
    }
    
    // Chart Panel 3: Bug Tracking (center: 0, -8, size: 4x3)
    // Base: from -2 to 2 (X) and -9.5 to -6.5 (Z)
    if (x >= -2.2 && x <= 2.2 && z >= -9.7 && z <= -6.3) {
      detected = true;
      distanceToNearestObstacle = 0;
    } else {
      // Calculate distance to chart edges
      const minX3 = Math.max(0, Math.max(-2.2 - x, x - 2.2));
      const minZ3 = Math.max(0, Math.max(-9.7 - z, z - (-6.3)));
      const dist3 = Math.sqrt(minX3 * minX3 + minZ3 * minZ3);
      distanceToNearestObstacle = Math.min(distanceToNearestObstacle, dist3);
    }
    
    return { detected, distanceToNearestObstacle };
  };

  // Get surface height for realistic spider positioning
  const getSurfaceHeight = (x: number, z: number): number => {
    // Check if on chart platform
    if ((x >= -10.5 && x <= -5.5 && z >= -5 && z <= -1) ||  // Sprint chart
        (x >= 5.5 && x <= 10.5 && z >= -5 && z <= -1) ||    // Velocity chart
        (x >= -2.5 && x <= 2.5 && z >= -10 && z <= -6)) {   // Bug chart
      return 0.1; // Platform height
    }
    return 0; // Floor level
  };

  // Realistic spider physics and movement system
  useFrame((state, delta) => {
    if (!ref.current) return;
    
    const spider = ref.current;
    const maxSpeed = 4.0;  // Increased speed for more dynamic movement
    const acceleration = 6.0;  // Faster acceleration
    const deceleration = 8.0;
    const turnSpeed = 5.0;  // Faster turning
    
    // Update timers
    setPauseTimer(prev => Math.max(0, prev - delta));
    setDirectionChangeTimer(prev => prev + delta);
    setLegAnimationPhase(prev => prev + delta * 8);
    setStuckTimer(prev => prev + delta);
    
    // Stuck detection - if spider hasn't moved much in 2 seconds, it's stuck
    const movementDistance = spider.position.distanceTo(lastPosition);
    if (movementDistance > 0.1) {
      lastPosition.copy(spider.position);
      setStuckTimer(0); // Reset stuck timer when moving normally
    }
    
    // If stuck for too long, force an escape maneuver
    if (stuckTimer > 2.0 && movementState !== 'escaping') {
      setMovementState('escaping');
      setStuckTimer(0);
      
      // Generate a strong escape direction away from current area
      const escapeAngle = Math.random() * Math.PI * 2;
      const escapeDistance = 4 + Math.random() * 4; // 4-8 units away
      escapeDirection.set(
        Math.cos(escapeAngle) * escapeDistance,
        0,
        Math.sin(escapeAngle) * escapeDistance
      );
      
      // Set escape target far from current position
      targetPosition.copy(spider.position).add(escapeDirection);
      targetPosition.x = THREE.MathUtils.clamp(targetPosition.x, -11.5, 11.5);
      targetPosition.z = THREE.MathUtils.clamp(targetPosition.z, -9.5, 9.5);
      
      // Clear velocity to force fresh movement
      velocity.set(0, 0, 0);
    }
    
    // Natural spider behavior: very occasional pauses (reduced for more exploration)
    if (pauseTimer <= 0 && Math.random() < 0.0002 && movementState !== 'escaping' && movementState !== 'avoiding') {
      setMovementState('paused');
      setPauseTimer(0.3 + Math.random() * 0.7); // Shorter pauses: 0.3-1 seconds
    }
    
    // Realistic spider exploration - long meandering paths across the entire room
    const currentDistanceToTarget = spider.position.distanceTo(targetPosition);
    
    // Generate new exploration target when current one is reached or after time
    if (currentDistanceToTarget < 1.5 || directionChangeTimer > 4 + Math.random() * 6) {
      setDirectionChangeTimer(0);
      
      const currentPos = spider.position;
      
      // Create diverse room-wide exploration patterns 
      const roomWidth = 24; // Full floor width -12 to +12
      const roomDepth = 20; // Full floor depth -10 to +10
      
      const explorationModes = [
        // Full room traversal
        () => ({
          x: -12 + Math.random() * roomWidth,
          z: -10 + Math.random() * roomDepth
        }),
        
        // Wall following behavior (spiders love edges)
        () => {
          const side = Math.floor(Math.random() * 4);
          switch(side) {
            case 0: return { x: -11.5 + Math.random() * 2, z: -10 + Math.random() * roomDepth }; // Left wall
            case 1: return { x: 9.5 + Math.random() * 2, z: -10 + Math.random() * roomDepth };   // Right wall
            case 2: return { x: -12 + Math.random() * roomWidth, z: -9.5 + Math.random() * 2 };  // Back wall
            default: return { x: -12 + Math.random() * roomWidth, z: 7.5 + Math.random() * 2 };  // Front wall
          }
        },
        
        // Cross-room diagonal movements
        () => {
          const corners = [
            { x: -10 + Math.random() * 3, z: -8 + Math.random() * 3 },  // Back left
            { x: 8 + Math.random() * 3, z: -8 + Math.random() * 3 },    // Back right
            { x: -10 + Math.random() * 3, z: 6 + Math.random() * 3 },   // Front left
            { x: 8 + Math.random() * 3, z: 6 + Math.random() * 3 }      // Front right
          ];
          return corners[Math.floor(Math.random() * corners.length)];
        },
        
        // Large circular/arc movements around the room center
        () => {
          const angle = Math.random() * Math.PI * 2;
          const radius = 8 + Math.random() * 6; // Large radius covering full room
          return {
            x: Math.cos(angle) * radius,
            z: Math.sin(angle) * radius
          };
        },
        
        // Opposite side exploration (encourage long movements)
        () => {
          const oppositeX = currentPos.x > 0 ? -10 - Math.random() * 3 : 10 + Math.random() * 3;
          const oppositeZ = currentPos.z > 0 ? -8 - Math.random() * 3 : 8 + Math.random() * 3;
          return { x: oppositeX, z: oppositeZ };
        },
        
        // Perimeter patrol (full room edges)
        () => {
          const perimeterPoints = [
            // Back edge
            { x: -12, z: -10 }, { x: -6, z: -10 }, { x: 0, z: -10 }, { x: 6, z: -10 }, { x: 12, z: -10 },
            // Right edge  
            { x: 12, z: -6 }, { x: 12, z: -2 }, { x: 12, z: 2 }, { x: 12, z: 6 }, { x: 12, z: 10 },
            // Front edge
            { x: 6, z: 10 }, { x: 0, z: 10 }, { x: -6, z: 10 }, { x: -12, z: 10 },
            // Left edge
            { x: -12, z: 6 }, { x: -12, z: 2 }, { x: -12, z: -2 }, { x: -12, z: -6 }
          ];
          const point = perimeterPoints[Math.floor(Math.random() * perimeterPoints.length)];
          return {
            x: point.x + (Math.random() - 0.5) * 3,
            z: point.z + (Math.random() - 0.5) * 3
          };
        }
      ];
      
      // Select exploration mode with weighted probabilities
      const modeWeights = [0.35, 0.2, 0.15, 0.15, 0.1, 0.05]; // Favor full room and wall following
      let random = Math.random();
      let selectedMode = 0;
      
      for (let i = 0; i < modeWeights.length; i++) {
        random -= modeWeights[i];
        if (random <= 0) {
          selectedMode = i;
          break;
        }
      }
      
      let newTarget = explorationModes[selectedMode]();
      
      // Ensure target is safe and not in obstacles  
      for (let attempts = 0; attempts < 20; attempts++) {
        const obstacle = detectObstacle(newTarget.x, newTarget.z);
        if (!obstacle.detected && obstacle.distanceToNearestObstacle > 0.5) break;
        
        // Try a different position if this one has obstacles or is too close
        newTarget = explorationModes[0](); // Fall back to random room position
        
        // Clamp the fallback position too
        newTarget.x = THREE.MathUtils.clamp(newTarget.x, -11.5, 11.5);
        newTarget.z = THREE.MathUtils.clamp(newTarget.z, -9.5, 9.5);
      }
      
      // Clamp to full room boundaries  
      newTarget.x = THREE.MathUtils.clamp(newTarget.x, -11.5, 11.5);
      newTarget.z = THREE.MathUtils.clamp(newTarget.z, -9.5, 9.5);
      
      targetPosition.set(newTarget.x, 0, newTarget.z);
      setMovementState('exploring');
    }
    
    // Store previous position for realistic physics
    previousPosition.copy(spider.position);
    
    // Paused behavior - spiders often stop and observe
    if (movementState === 'paused' && pauseTimer > 0) {
      // Slight body movement while paused (breathing effect)
      spider.position.y = 0.1 + Math.sin(state.clock.elapsedTime * 2) * 0.02;
      return;
    }
    
    // Natural spider movement - no complex physics, just realistic steps
    const toTarget = new THREE.Vector3().subVectors(targetPosition, spider.position);
    const distanceToTarget = toTarget.length();
    
    if (distanceToTarget > 0.1) {
      toTarget.normalize();
      toTarget.y = 0; // Keep movement horizontal
    } else {
      toTarget.set(0, 0, 0); // Stop when close enough
    }
    
    // Simple obstacle detection - just check immediate path
    const currentObstacle = detectObstacle(spider.position.x, spider.position.z);
    const stepSize = 0.4; // Small step ahead
    const futurePosition = spider.position.clone().add(toTarget.clone().multiplyScalar(stepSize));
    const futureObstacle = detectObstacle(futurePosition.x, futurePosition.z);
    
    let desiredDirection = toTarget.clone();
    
    // Immediate and responsive obstacle avoidance
    const isEscaping = movementState === 'escaping';
    const currentObstacleDetected = currentObstacle.detected;
    const futureObstacleDetected = futureObstacle.detected;
    
    // IMMEDIATE direction change if spider is in or about to enter obstacle
    if (currentObstacleDetected || futureObstacleDetected) {
      if (!isEscaping) setMovementState('avoiding');
      
      // Force immediate target change to avoid obstacle
      const currentPos = spider.position;
      
      // Try 8 escape directions, starting with perpendicular turns
      const escapeDirections = [
        new THREE.Vector3(-toTarget.z, 0, toTarget.x).normalize(),     // 90° right
        new THREE.Vector3(toTarget.z, 0, -toTarget.x).normalize(),     // 90° left
        new THREE.Vector3(-toTarget.x, 0, -toTarget.z).normalize(),    // 180° reverse
        new THREE.Vector3(-toTarget.z * 0.7 - toTarget.x * 0.3, 0, toTarget.x * 0.7 - toTarget.z * 0.3).normalize(), // 45° right
        new THREE.Vector3(toTarget.z * 0.7 - toTarget.x * 0.3, 0, -toTarget.x * 0.7 - toTarget.z * 0.3).normalize(), // 45° left
        new THREE.Vector3(1, 0, 0),  // Force right
        new THREE.Vector3(-1, 0, 0), // Force left
        new THREE.Vector3(0, 0, 1),  // Force forward
      ];
      
      // Randomize the first two to add natural variation
      if (Math.random() > 0.5) {
        [escapeDirections[0], escapeDirections[1]] = [escapeDirections[1], escapeDirections[0]];
      }
      
      // Find the first completely clear escape direction
      let foundEscape = false;
      for (const escapeDir of escapeDirections) {
        const escapeTarget = currentPos.clone().add(escapeDir.multiplyScalar(3.0));
        const escapeObstacle = detectObstacle(escapeTarget.x, escapeTarget.z);
        
        if (!escapeObstacle.detected) {
          // Immediately change target and direction
          targetPosition.copy(escapeTarget);
          targetPosition.x = THREE.MathUtils.clamp(targetPosition.x, -11.5, 11.5);
          targetPosition.z = THREE.MathUtils.clamp(targetPosition.z, -9.5, 9.5);
          desiredDirection = escapeDir.clone();
          foundEscape = true;
          break;
        }
      }
      
      // If no clear direction found, force movement away from nearest obstacle
      if (!foundEscape) {
        const awayFromObstacle = new THREE.Vector3(
          currentPos.x > 0 ? 1 : -1,
          0,
          currentPos.z > 0 ? 1 : -1
        ).normalize();
        desiredDirection = awayFromObstacle;
        targetPosition.copy(currentPos).add(awayFromObstacle.multiplyScalar(4));
      }
    } else if (!isEscaping) {
      setMovementState('exploring');
    }
    
    // Exit escape mode when target is reached
    if (isEscaping && currentDistanceToTarget < 1.5) {
      setMovementState('exploring');
    }
    
    // Natural spider step movement with room-covering speeds
    let stepSpeed = 3.5; // Increased base speed for room exploration
    
    // Vary step speed naturally
    if (movementState === 'escaping') {
      stepSpeed = 6.0; // Fast escape across room
    } else if (movementState === 'avoiding') {
      stepSpeed = 2.0; // Careful when avoiding
    } else {
      // More dynamic speed variation for long-distance travel
      stepSpeed = 2.5 + Math.random() * 3.0; // 2.5 to 5.5 speed range
    }
    
    // Natural step movement with minimal wandering for longer travels
    const stepDistance = stepSpeed * delta;
    
    // Reduced wandering for more purposeful long-distance movement
    const wanderAmount = 0.1; // Less wandering for straighter paths
    const wanderAngle = (Math.random() - 0.5) * wanderAmount;
    const wanderX = Math.sin(wanderAngle) * stepDistance * 0.3;
    const wanderZ = Math.cos(wanderAngle) * stepDistance * 0.3;
    
    // Combine intended direction with minimal wandering
    let newPosition = spider.position.clone();
    newPosition.x += desiredDirection.x * stepDistance + wanderX;
    newPosition.z += desiredDirection.z * stepDistance + wanderZ;
    
    // CRITICAL: Validate new position is not inside obstacle
    const newPositionObstacle = detectObstacle(newPosition.x, newPosition.z);
    if (newPositionObstacle.detected) {
      // Don't move if new position is inside obstacle
      newPosition = spider.position.clone();
      
      // Force immediate direction change
      const escapeAngle = Math.atan2(spider.position.z, spider.position.x) + Math.PI + (Math.random() - 0.5) * Math.PI;
      const escapeDistance = 2.0;
      targetPosition.set(
        spider.position.x + Math.cos(escapeAngle) * escapeDistance,
        0,
        spider.position.z + Math.sin(escapeAngle) * escapeDistance
      );
      targetPosition.x = THREE.MathUtils.clamp(targetPosition.x, -11.5, 11.5);
      targetPosition.z = THREE.MathUtils.clamp(targetPosition.z, -9.5, 9.5);
    }
    
    // Surface adherence - keep spider on ground/platform
    const surfaceHeight = getSurfaceHeight(newPosition.x, newPosition.z);
    newPosition.y = surfaceHeight + 0.1;
    
    // Boundary constraints for full room exploration
    if (newPosition.x < -11.5 || newPosition.x > 11.5) {
      // Generate new target in opposite direction when hitting boundary
      const bounceTarget = {
        x: newPosition.x < 0 ? 8 + Math.random() * 3 : -8 - Math.random() * 3,
        z: newPosition.z + (Math.random() - 0.5) * 6
      };
      targetPosition.set(bounceTarget.x, 0, THREE.MathUtils.clamp(bounceTarget.z, -9.5, 9.5));
      newPosition.x = THREE.MathUtils.clamp(newPosition.x, -11.5, 11.5);
    }
    if (newPosition.z < -9.5 || newPosition.z > 9.5) {
      // Generate new target in opposite direction when hitting boundary  
      const bounceTarget = {
        x: newPosition.x + (Math.random() - 0.5) * 8,
        z: newPosition.z < 0 ? 6 + Math.random() * 3 : -6 - Math.random() * 3
      };
      targetPosition.set(THREE.MathUtils.clamp(bounceTarget.x, -11.5, 11.5), 0, bounceTarget.z);
      newPosition.z = THREE.MathUtils.clamp(newPosition.z, -9.5, 9.5);
    }
    
    spider.position.copy(newPosition);
    
    // Natural rotation - spiders turn their body toward movement direction
    if (desiredDirection.length() > 0.1) {
      const targetAngle = Math.atan2(desiredDirection.x, desiredDirection.z);
      let angleDiff = targetAngle - spider.rotation.y;
      
      // Handle angle wrapping
      while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
      while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
      
      // Natural turning speed - sometimes quick, sometimes gradual
      const baseTurnSpeed = movementState === 'escaping' ? 8.0 : 4.0;
      const turnSpeed = baseTurnSpeed * (0.7 + Math.random() * 0.6); // Natural variation
      const maxTurnThisFrame = turnSpeed * delta;
      
      angleDiff = THREE.MathUtils.clamp(angleDiff, -maxTurnThisFrame, maxTurnThisFrame);
      spider.rotation.y += angleDiff;
    }
    
    // Natural body animations - spiders move in steps, not smooth gliding
    const isMoving = desiredDirection.length() > 0.1;
    
    if (isMoving) {
      // Step-like movement with natural bobbing
      const stepFreq = movementState === 'escaping' ? 12 : 6;
      spider.position.y += Math.sin(legAnimationPhase * stepFreq) * 0.03;
      
      // Natural body sway while walking  
      spider.rotation.x = Math.sin(legAnimationPhase * stepFreq * 0.8) * 0.04;
      spider.rotation.z = Math.sin(legAnimationPhase * stepFreq * 0.6) * 0.02;
    } else {
      // Subtle breathing when stationary
      spider.position.y += Math.sin(state.clock.elapsedTime * 2) * 0.01;
    }
    
    // Extra frantic movement when escaping
    if (movementState === 'escaping') {
      spider.position.y += Math.sin(legAnimationPhase * 15) * 0.02;
    }
  });

  // Legacy surface info for compatibility 
  const getSurfaceInfo = (x: number, z: number) => {
    const obstacle = detectObstacle(x, z);
    const height = getSurfaceHeight(x, z);
    
    return { 
      surfaceY: height,
      insideBar: obstacle.detected,
      onPlatform: height > 0,
      nearBarEdge: obstacle.distanceToNearestObstacle < 0.5
    };
  };

  const handleClick = (e: any) => {
    if (!onClick) return; // No click handler if onClick is not provided
    e.stopPropagation();
    setIsClicked(true);
    setTimeout(() => setIsClicked(false), 200);
    onClick(id, [ref.current.position.x, ref.current.position.y, ref.current.position.z]);
  };

  // Surface-crawling fallback spider
  if (modelError || !nodes || !gltf) {
    return (
      <group ref={ref} position={initialPosition} scale={isClicked ? 1.2 : 1.0} onClick={onClick ? handleClick : undefined}>
        {/* Main spider body */}
        <mesh castShadow>
          <sphereGeometry args={[0.15, 16, 12]} />
          <meshStandardMaterial 
            color={isClicked ? "#8b5cf6" : "#1a0a1a"} 
            emissive="#4a0e4e" 
            emissiveIntensity={0.2}
            roughness={0.8}
            metalness={0.1}
          />
        </mesh>
        
        {/* Spider legs - positioned for surface crawling */}
        {Array.from({ length: 8 }).map((_, i) => {
          const angle = (i / 8) * Math.PI * 2;
          const legRadius = 0.25;
          return (
            <group key={i} rotation={[0, angle, 0]}>
              <mesh 
                position={[legRadius, -0.05, 0]} 
                rotation={[Math.PI / 8, 0, Math.PI / 6]} 
                castShadow
              >
                <cylinderGeometry args={[0.01, 0.01, 0.3]} />
                <meshStandardMaterial 
                  color={isClicked ? "#8b5cf6" : "#2a0a2a"} 
                  roughness={0.9}
                />
              </mesh>
            </group>
          );
        })}
        
        {/* Eyes */}
        <mesh position={[0.06, 0.08, 0.12]} castShadow>
          <sphereGeometry args={[0.02, 8, 6]} />
          <meshBasicMaterial color="#ff0000" />
        </mesh>
        <mesh position={[-0.06, 0.08, 0.12]} castShadow>
          <sphereGeometry args={[0.02, 8, 6]} />
          <meshBasicMaterial color="#ff0000" />
        </mesh>
        
        {/* Glow effect when clicked */}
        {isClicked && (
          <mesh>
            <sphereGeometry args={[0.4, 16, 12]} />
            <meshBasicMaterial color="#8b5cf6" transparent opacity={0.3} />
          </mesh>
        )}
      </group>
    );
  }

  // Render 3D GLTF model
  return (
    <group ref={ref} position={initialPosition} scale={isClicked ? 0.12 : 0.08} onClick={onClick ? handleClick : undefined}>
      <primitive object={gltf.scene} castShadow receiveShadow />
      
      {/* Glow effect when clicked */}
      {isClicked && (
        <mesh>
          <sphereGeometry args={[3, 16, 12]} />
          <meshBasicMaterial color="#8b5cf6" transparent opacity={0.2} />
        </mesh>
      )}
    </group>
  );
};
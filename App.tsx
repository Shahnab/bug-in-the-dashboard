
import React, { useState, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment } from '@react-three/drei';
import { SpiderWeb } from './components/SpiderWeb';
import { SurfaceCrawlerSpider } from './components/SurfaceCrawlerSpider';

interface SpiderData {
  id: number;
  position: [number, number, number];
}

const App: React.FC = () => {
  console.log('App component rendering...');
  
  const [spiders, setSpiders] = useState<SpiderData[]>([]);
  const [spiderCounter, setSpiderCounter] = useState(0);
  
  const handleWebClick = () => {
    console.log('Web clicked! Creating spider on dashboard surface...');
    const newSpider: SpiderData = {
      id: spiderCounter,
      position: [
        Math.random() * 14 - 7,  // X: -7 to 7 (dashboard width)
        0.1,                     // Y: just above floor (will be adjusted by surface detection)
        Math.random() * 10 - 5   // Z: -5 to 5 (dashboard depth)
      ],
    };
    setSpiders(prev => [...prev, newSpider]);
    setSpiderCounter(prev => prev + 1);
  };
  
  // Removed spider clicking functionality - spiders are now non-interactive
  
  return (
    <main style={{
      position: 'relative',
      width: '100vw',
      height: '100vh',
      overflow: 'hidden',
      backgroundColor: '#000'
    }}>
      {/* 3D Environment Background */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'radial-gradient(ellipse at center, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.9) 70%, rgba(226, 232, 240, 1) 100%)'
      }} />
      
      {/* Dashboard Title */}
      <div style={{
        position: 'absolute',
        top: '20px',
        left: '20px',
        color: '#000000',
        fontSize: '24px',
        fontWeight: 'bold',
        fontFamily: 'Arial, sans-serif',
        zIndex: 10
      }}>
        Bug in Dashboard
      </div>

      {/* Spider Web */}
      <SpiderWeb onClick={handleWebClick} hasSpider={spiders.length > 0} />
      
      {/* Full 3D Canvas Environment */}
      <Canvas
        shadows
        camera={{ position: [0, 5, 10], fov: 60 }}
        style={{ 
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%', 
          height: '100%',
          pointerEvents: 'auto'
        }}
      >
        {/* Camera Controls */}
        <OrbitControls
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          minDistance={3}
          maxDistance={20}
          minPolarAngle={0}
          maxPolarAngle={Math.PI / 2}
        />
        
        {/* Apple-style Environment */}
        <Environment preset="studio" />
        
        {/* Apple-style Lighting Setup */}
        <ambientLight intensity={0.6} color="#ffffff" />
        <directionalLight 
          position={[5, 12, 8]} 
          intensity={1.8} 
          castShadow 
          color="#ffffff"
          shadow-mapSize-width={4096}
          shadow-mapSize-height={4096}
          shadow-camera-far={50}
          shadow-camera-left={-20}
          shadow-camera-right={20}
          shadow-camera-top={20}
          shadow-camera-bottom={-20}
        />
        <pointLight position={[-6, 10, -6]} intensity={0.8} color="#f0f9ff" />
        <pointLight position={[6, 8, 6]} intensity={0.8} color="#fef7ff" />
        <spotLight
          position={[0, 15, 0]}
          angle={0.3}
          penumbra={0.9}
          intensity={0.7}
          castShadow
          color="#ffffff"
        />
        
        {/* 3D Data Dashboard Environment */}
        <Suspense fallback={null}>
          {/* Clean Dashboard Floor */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
            <planeGeometry args={[24, 20]} />
            <meshPhysicalMaterial 
              color="#ffffff" 
              roughness={0.02} 
              metalness={0.0}
              clearcoat={1.0}
              clearcoatRoughness={0.0}
            />
          </mesh>
          

          
          {/* Clean Floating Chart Islands */}
          
          {/* Sprint Progress Chart - Clean Dashboard Panel */}
          <group position={[-8, 0, -3]}>
            {/* Clean Chart Base */}
            <mesh position={[0, 0.05, 0]} receiveShadow>
              <boxGeometry args={[4, 0.1, 3]} />
              <meshPhysicalMaterial 
                color="#ffffff"
                roughness={0.1}
                metalness={0.0}
                clearcoat={1.0}
                clearcoatRoughness={0.0}
              />
            </mesh>
            
            {/* Sprint Progress Bars */}
            {[
              { height: 2.5, color: '#34d399', label: 'Sprint 1' },
              { height: 2.0, color: '#3b82f6', label: 'Sprint 2' },
              { height: 1.2, color: '#f59e0b', label: 'Sprint 3' },
              { height: 0.9, color: '#ef4444', label: 'Sprint 4' }
            ].map((bar, i) => (
              <group key={`sprint-${i}`} position={[-1.5 + i * 1, 0.1, 0]}>
                <mesh position={[0, bar.height / 2, 0]} castShadow receiveShadow>
                  <boxGeometry args={[0.6, bar.height, 0.6]} />
                  <meshPhysicalMaterial 
                    color={bar.color}
                    roughness={0.1}
                    metalness={0.0}
                    clearcoat={1.0}
                    clearcoatRoughness={0.0}
                  />
                </mesh>
              </group>
            ))}
          </group>
          
          {/* Team Velocity Chart - Clean Dashboard Panel */}
          <group position={[8, 0, -3]}>
            {/* Clean Chart Base */}
            <mesh position={[0, 0.05, 0]} receiveShadow>
              <boxGeometry args={[4, 0.1, 3]} />
              <meshPhysicalMaterial 
                color="#ffffff"
                roughness={0.1}
                metalness={0.0}
                clearcoat={1.0}
                clearcoatRoughness={0.0}
              />
            </mesh>
            
            {/* Team Velocity Bars */}
            {[
              { height: 1.8, color: '#60a5fa', label: 'Week 1' },
              { height: 2.5, color: '#22d3ee', label: 'Week 2' },
              { height: 2.1, color: '#a78bfa', label: 'Week 3' },
              { height: 2.3, color: '#34d399', label: 'Week 4' }
            ].map((bar, i) => (
              <group key={`velocity-${i}`} position={[-1.5 + i * 1, 0.1, 0]}>
                <mesh position={[0, bar.height / 2, 0]} castShadow receiveShadow>
                  <boxGeometry args={[0.6, bar.height, 0.6]} />
                  <meshPhysicalMaterial 
                    color={bar.color}
                    roughness={0.1}
                    metalness={0.0}
                    clearcoat={1.0}
                    clearcoatRoughness={0.0}
                  />
                </mesh>
              </group>
            ))}
          </group>
          
          {/* Bug Tracking Chart - Clean Dashboard Panel */}
          <group position={[0, 0, -8]}>
            {/* Clean Chart Base */}
            <mesh position={[0, 0.05, 0]} receiveShadow>
              <boxGeometry args={[4, 0.1, 3]} />
              <meshPhysicalMaterial 
                color="#ffffff"
                roughness={0.1}
                metalness={0.0}
                clearcoat={1.0}
                clearcoatRoughness={0.0}
              />
            </mesh>
            
            {/* Bug Tracking Bars */}
            {[
              { height: 1.6, color: '#ef4444', label: 'Critical' },
              { height: 2.4, color: '#f97316', label: 'High' },
              { height: 1.9, color: '#eab308', label: 'Medium' },
              { height: 1.1, color: '#22c55e', label: 'Low' }
            ].map((bug, i) => (
              <group key={`bug-${i}`} position={[-1.5 + i * 1, 0.1, 0]}>
                <mesh position={[0, bug.height / 2, 0]} castShadow receiveShadow>
                  <boxGeometry args={[0.6, bug.height, 0.6]} />
                  <meshPhysicalMaterial 
                    color={bug.color}
                    roughness={0.1}
                    metalness={0.0}
                    clearcoat={1.0}
                    clearcoatRoughness={0.0}
                  />
                </mesh>
              </group>
            ))}
          </group>
          


          

          
          {/* Surface Crawling Spiders - Non-Interactive */}
          {spiders.map((spider) => (
            <SurfaceCrawlerSpider
              key={spider.id}
              id={spider.id}
              initialPosition={spider.position}
            />
          ))}
        </Suspense>
      </Canvas>
      

      

    </main>
  );
};

export default App;

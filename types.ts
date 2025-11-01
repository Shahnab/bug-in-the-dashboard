// FIX: This file is converted to a module to correctly augment the global JSX
// namespace for React Three Fiber. `SpiderData` is also placed in `declare global`
// to ensure it remains a global type, avoiding the need for imports.
declare global {
  interface SpiderData {
    id: number;
    position: [number, number, number];
  }

  namespace JSX {
    interface IntrinsicElements {
      ambientLight: import('@react-three/fiber').AmbientLightProps;
      pointLight: import('@react-three/fiber').PointLightProps;
      group: import('@react-three/fiber').GroupProps;
      primitive: import('@react-three/fiber').PrimitiveProps;
      skinnedMesh: import('@react-three/fiber').SkinnedMeshProps;
    }
  }
}

// An empty export is required to treat this file as a module.
export {};

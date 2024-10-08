import { Suspense, useRef, useState } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { PointMaterial, Points } from "@react-three/drei";
import { random } from "maath";

export function Stars() {
  const ref = useRef<THREE.Points>(null);
  const [sphere] = useState(
    () =>
      random.inSphere(new Float32Array(6000), { radius: 10 }) as Float32Array,
  );
  useFrame((_, delta) => {
    if (!ref.current) {
      return;
    }
    ref.current.rotation.x -= delta / 10;
    ref.current.rotation.y -= delta / 15;
  });
  return (
    <Suspense fallback={null}>
      <group rotation={[0, 0, Math.PI / 4]}>
        <Points ref={ref} positions={sphere} stride={3} frustumCulled={false}>
          <PointMaterial
            transparent
            color="#c850c0"
            size={5}
            sizeAttenuation={false}
            depthWrite={false}
          />
        </Points>
      </group>
    </Suspense>
  );
}

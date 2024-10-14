import { Suspense, useRef, useState } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { PointMaterial, Points, useScroll } from "@react-three/drei";
import { random } from "maath";

export function Stars() {
  const ref = useRef<THREE.Points>(null);
  const totalPages = 3;
  const [sphere] = useState(
    () =>
      random.inSphere(new Float32Array(6000), { radius: 10 }) as Float32Array,
  );
  const data = useScroll();
  useFrame((_, delta) => {
    if (!ref.current) {
      return;
    }
    ref.current.rotation.x -= delta / 10;
    ref.current.rotation.y -= delta / 15;
    const curScroll = data.offset;
    let opacity = 1;
    const fadeStart = 1 / totalPages / 2;
    const fadeEnd = 1 / totalPages;
    if (curScroll > fadeStart) {
      const fadeProgress = (curScroll - fadeStart) / (fadeEnd - fadeStart);
      opacity = Math.max(0, 1 - fadeProgress);
    }
    const material = ref.current.material;
    if (Array.isArray(material)) {
      material.forEach((m) => {
        m.opacity = opacity;
        m.transparent = true;
      });
    } else {
      material.opacity = opacity;
      material.transparent = true;
    }
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

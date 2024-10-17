import * as THREE from "three";
import { Mesh, MeshBasicMaterial } from "three";
import { useEffect, useRef, useState } from "react";
import { ThreeEvent, useFrame } from "@react-three/fiber";
import { Billboard, BillboardProps, Text } from "@react-three/drei";

export function Word({ children, ...props }: BillboardProps) {
  const color = new THREE.Color();
  const fontProps = {
    fontSize: 0.2,
    letterSpacing: -0.05,
    lineHeight: 1,
    "material-toneMapped": false,
  };
  const ref = useRef<Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const hover = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    setHovered(true);
  };
  const unhover = () => {
    setHovered(false);
  };
  useEffect(() => {
    if (hovered) {
      document.body.style.cursor = "pointer";
    }
    return () => {
      document.body.style.cursor = "auto";
    };
  }, [hovered]);

  useFrame(() => {
    (ref.current?.material as MeshBasicMaterial).color.lerp(
      color.set(hovered ? "#fa2720" : "white"),
      0.1,
    );
  });

  return (
    <Billboard {...props}>
      <Text
        ref={ref}
        onPointerOver={hover}
        onPointerOut={unhover}
        children={children}
        {...fontProps}
      />
    </Billboard>
  );
}

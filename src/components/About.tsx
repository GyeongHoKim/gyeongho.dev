import { Physics } from "@react-three/rapier";
import { EmployeeCard } from "@/components/EmployeeCard.tsx";
import { useThree } from "@react-three/fiber";
import { Text } from "@react-three/drei";

export function About() {
  const { width, height } = useThree((state) => state.viewport);

  return (
    <>
      <Physics interpolate gravity={[0, -40, 0]} timeStep={1 / 60}>
        <EmployeeCard />
      </Physics>
      <Text
        color="white"
        anchorX="left"
        anchorY="top"
        position={[width * -0.45, -height * -0.45, -1]}
        fontSize={0.5}
      >
        I Build
      </Text>
      <Text
        color="white"
        anchorX="left"
        anchorY="top"
        position={[width * -0.45, -height * -0.35, -1]}
        fontSize={0.5}
      >
        Web Experience
      </Text>
    </>
  );
}

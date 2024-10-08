import { Physics } from "@react-three/rapier";
import { EmployeeCard } from "@/components/EmployeeCard.tsx";
import { Stars } from "@/components/Stars.tsx";

export function About() {
  return (
    <>
      <Physics interpolate gravity={[0, -40, 0]} timeStep={1 / 60}>
        <EmployeeCard />
      </Physics>
      <Stars />
    </>
  );
}

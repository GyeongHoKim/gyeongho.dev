import { Physics } from "@react-three/rapier";
import { EmployeeCard, Stars } from "@/components/three-resume";

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

import { Physics } from "@react-three/rapier";
import { EmployeeCard } from "./EmployeeCard.tsx";
import { ScrollText } from "./ScrollText.tsx";

export function About() {
  return (
    <>
      <Physics interpolate gravity={[0, -40, 0]} timeStep={1 / 60}>
        <EmployeeCard />
      </Physics>
      <ScrollText label="I Build" ratioX={-0.45} ratioY={-0.45} />
      <ScrollText label="Web Experience" ratioX={-0.45} ratioY={-0.35} />
    </>
  );
}

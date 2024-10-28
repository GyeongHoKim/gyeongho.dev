import { useContext } from "react";
import {
  OrbitControlsContext,
  OrbitControlsContextProps,
} from "@/components/three-resume/OrbitControlsProvider.tsx";

export const useOrbitControls = (): OrbitControlsContextProps => {
  const context = useContext(OrbitControlsContext);
  if (!context) {
    throw new Error(
      "useOrbitControl must be used within an OrbitControlsProvider",
    );
  }
  return context;
};

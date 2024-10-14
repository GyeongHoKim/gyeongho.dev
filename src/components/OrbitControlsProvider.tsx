// OrbitControlsContext.tsx
import React, { createContext, ReactNode, useCallback, useState } from "react";
import { OrbitControls } from "@react-three/drei";
import { useThree } from "@react-three/fiber";

export interface OrbitControlsContextProps {
  enabled: boolean;
  setEnabled: (enabled: boolean) => void;
  toggleEnabled: () => void;
}

export const OrbitControlsContext = createContext<
  OrbitControlsContextProps | undefined
>(undefined);

interface OrbitControlsProviderProps {
  children?: ReactNode;
}

export const OrbitControlsProvider: React.FC<OrbitControlsProviderProps> = ({
  children,
}) => {
  const [enabled, setEnabled] = useState<boolean>(true);
  const { camera, gl } = useThree();

  const toggleEnabled = useCallback(() => {
    setEnabled((prev) => !prev);
  }, []);

  return (
    <OrbitControlsContext.Provider
      value={{ enabled, setEnabled, toggleEnabled }}
    >
      <OrbitControls
        enableZoom={false}
        enabled={enabled}
        args={[camera, gl.domElement]}
        maxAzimuthAngle={Math.PI / 4}
        minAzimuthAngle={-Math.PI / 4}
        maxPolarAngle={Math.PI / 2}
        minPolarAngle={Math.PI / 4}
      />
      {children}
    </OrbitControlsContext.Provider>
  );
};

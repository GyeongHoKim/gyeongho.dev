import { useThree } from "@react-three/fiber";
import { Text } from "@react-three/drei";

interface ScrollTextProps {
  label: string;
  ratioX: number;
  ratioY: number;
  fontSize?: number;
  maxWidth?: number;
}

export function ScrollText({
  label,
  ratioX,
  ratioY,
  fontSize,
  maxWidth,
}: ScrollTextProps) {
  const { width, height } = useThree((state) => state.viewport);

  return (
    <Text
      color="white"
      anchorX="left"
      anchorY="top"
      position={[width * ratioX, -height * ratioY, -1]}
      fontSize={fontSize ?? 0.5}
      maxWidth={maxWidth}
    >
      {label}
    </Text>
  );
}

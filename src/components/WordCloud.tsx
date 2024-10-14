import * as THREE from "three";
import { Word } from "@/components/Word.tsx";
import { useMemo } from "react";

const dictionary: string[] = [
  "WebComponent",
  "Lit",
  "React",
  "Cypress",
  "BackstopJS",
  "DesignSystem",
  "Test",
  "Streaming",
  "Redux",
  "TanstackQuery",
  "Storybook",
  "Jenkins",
  "Terraform",
  "IaC",
  "RTSP",
  "WebRTC",
];

interface WordCloudProps {
  count?: number;
  radius?: number;
  center?: THREE.Vector3;
}

export function WordCloud({
  count = 4,
  radius = 2,
  center = new THREE.Vector3(0, -6, 0),
}: WordCloudProps) {
  const words = useMemo(() => {
    const temp = [];
    const spherical = new THREE.Spherical();
    const phiSpan = Math.PI / (count + 1);
    const thetaSpan = (Math.PI * 2) / count;
    for (let i = 1; i < count + 1; i++)
      for (let j = 0; j < count; j++)
        temp.push({
          pos: new THREE.Vector3()
            .setFromSpherical(spherical.set(radius, phiSpan * i, thetaSpan * j))
            .add(center),
          word: dictionary[Math.floor(Math.random() * dictionary.length)],
        });
    return temp;
  }, [count, radius, center]);
  return words.map(({ pos, word }, index) => (
    <Word key={index} position={pos} children={word} />
  ));
}

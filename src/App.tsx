import { Canvas, extend } from "@react-three/fiber";
import { MeshLineGeometry, MeshLineMaterial } from "meshline";
import {
  Environment,
  Lightformer,
  Scroll,
  ScrollControls,
} from "@react-three/drei";
import { About } from "@/components/About.tsx";
import { Title } from "@/components/Title.tsx";
import { WordCloud } from "@/components/WordCloud.tsx";
import { OrbitControlsProvider } from "@/components/OrbitControlsProvider.tsx";
import { Skills } from "@/components/Skills.tsx";

extend({ MeshLineGeometry, MeshLineMaterial });

export default function App() {
  return (
    <Canvas camera={{ position: [0, 0, 13], fov: 25 }}>
      <OrbitControlsProvider>
        <ScrollControls pages={3}>
          <Scroll>
            <About />
            <WordCloud />
          </Scroll>
          <Scroll html>
            <Title />
            <Skills />
          </Scroll>
        </ScrollControls>
      </OrbitControlsProvider>
      <ambientLight intensity={Math.PI} />
      <Environment background blur={0.75}>
        <color attach="background" args={["#12071f"]} />
        <Lightformer
          intensity={2}
          color="white"
          position={[0, -1, 5]}
          rotation={[0, 0, Math.PI / 3]}
          scale={[100, 0.1, 1]}
        />
        <Lightformer
          intensity={3}
          color="white"
          position={[-1, -1, 1]}
          rotation={[0, 0, Math.PI / 3]}
          scale={[100, 0.1, 1]}
        />
        <Lightformer
          intensity={3}
          color="white"
          position={[1, 1, 1]}
          rotation={[0, 0, Math.PI / 3]}
          scale={[100, 0.1, 1]}
        />
        <Lightformer
          intensity={10}
          color="white"
          position={[-10, 0, 14]}
          rotation={[0, Math.PI / 2, Math.PI / 3]}
          scale={[100, 10, 1]}
        />
      </Environment>
    </Canvas>
  );
}

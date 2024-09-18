import { useEffect, useRef, useState } from "react";
import { extend, useFrame, useThree } from "@react-three/fiber";
import {
  BallCollider,
  CuboidCollider,
  RapierRigidBody,
  RigidBody,
  RigidBodyProps,
  useRopeJoint,
  useSphericalJoint,
} from "@react-three/rapier";
import { MeshLineGeometry, MeshLineMaterial } from "meshline";
import {
  CatmullRomCurve3,
  Mesh,
  MeshStandardMaterial,
  RepeatWrapping,
  Vector2,
  Vector3,
  Vector3Like,
} from "three";
import { useGLTF, useTexture } from "@react-three/drei";

type RigidBodyWithLerp = RapierRigidBody & { lerped?: Vector3 };

useTexture.preload("/texture/Rope002_1K-JPG/Rope002_1K-JPG_Color.jpg");
useGLTF.preload("/models/employee_card.glb");
extend({ MeshLineGeometry, MeshLineMaterial });

interface EmployeeCardProps {
  maxSpeed?: number;
  minSpeed?: number;
}

export function EmployeeCard({
  maxSpeed = 50,
  minSpeed = 10,
}: EmployeeCardProps) {
  /**
   * Texture and Models
   */
  const texture = useTexture(
    "/texture/Rope002_1K-JPG/Rope002_1K-JPG_Color.jpg",
  );
  const { nodes, materials } = useGLTF("/models/employee_card.glb");
  /**
   * References for the band and the joints
   */
  const band = useRef<Mesh>(null!);
  const fixed = useRef<RapierRigidBody>(null);
  const j1 = useRef<RigidBodyWithLerp>(null);
  const j2 = useRef<RigidBodyWithLerp>(null);
  const j3 = useRef<RapierRigidBody>(null);
  const card = useRef<RapierRigidBody>(null);
  const vec = new Vector3();
  const ang = new Vector3();
  const rot = new Vector3();
  const dir = new Vector3();
  const segmentProps: RigidBodyProps = {
    type: "dynamic",
    canSleep: true,
    colliders: false,
    angularDamping: 2,
    linearDamping: 2,
  };
  /**
   * Canvas size
   */
  const { width, height } = useThree((state) => state.size);
  /**
   * A Catmull-Rom curve to draw the band
   */
  const [curve] = useState(
    () =>
      new CatmullRomCurve3([
        new Vector3(),
        new Vector3(),
        new Vector3(),
        new Vector3(),
      ]),
  );
  const [dragged, drag] = useState<Vector3Like>();
  const [hovered, hover] = useState(false);

  /**
   * Set limitation of two RigidBody(max distance)
   * you should set position of the joint in bodyA's local space, position of the joint in bodyB's local space, and the max distance between the two bodies
   */
  useRopeJoint(fixed, j1, [[0, 0, 0], [0, 0, 0], 1]);
  useRopeJoint(j1, j2, [[0, 0, 0], [0, 0, 0], 1]);
  useRopeJoint(j2, j3, [[0, 0, 0], [0, 0, 0], 1]);
  useSphericalJoint(j3, card, [
    [0, 0, 0],
    [0, 1.45, 0],
  ]);
  useEffect(() => {
    if (hovered) {
      document.body.style.cursor = dragged ? "grabbing" : "grab";
      return () => void (document.body.style.cursor = "auto");
    }
  }, [hovered, dragged]);

  useFrame((state, delta) => {
    if (dragged) {
      vec.set(state.pointer.x, state.pointer.y, 0.5).unproject(state.camera);
      dir.copy(vec).sub(state.camera.position).normalize();
      vec.add(dir.multiplyScalar(state.camera.position.length()));
      [card, j1, j2, j3, fixed].forEach((ref) => ref.current?.wakeUp());
      card.current?.setNextKinematicTranslation({
        x: vec.x - dragged.x,
        y: vec.y - dragged.y,
        z: vec.z - dragged.z,
      });
    }
    if (
      fixed.current &&
      j1.current &&
      j2.current &&
      j3.current &&
      card.current
    ) {
      // Fix most of the jitter when over pulling the card
      [j1, j2].forEach((ref) => {
        if (!ref.current?.lerped) {
          return;
        }
        if (!ref.current.lerped) {
          ref.current.lerped = new Vector3().copy(ref.current.translation());
        }
        const clampedDistance = Math.max(
          0.1,
          Math.min(1, ref.current.lerped.distanceTo(ref.current.translation())),
        );
        ref.current.lerped.lerp(
          ref.current.translation(),
          delta * (minSpeed + clampedDistance * (maxSpeed - minSpeed)),
        );
      });
      // Calculate catmul curve
      curve.points[0].copy(j3.current.translation());
      curve.points[1].copy(j2.current.translation());
      curve.points[2].copy(j1.current.translation());
      curve.points[3].copy(fixed.current.translation());
      (band.current.geometry as MeshLineGeometry).setPoints(
        curve.getPoints(32),
      );
      // Tilt it back towards the screen
      ang.copy(card.current.angvel());
      rot.copy(card.current.rotation());
      card.current.setAngvel(
        { x: ang.x, y: ang.y - rot.y * 0.25, z: ang.z },
        false,
      );
    }
  });

  curve.curveType = "chordal";
  texture.wrapS = texture.wrapT = RepeatWrapping;

  return (
    <>
      <group position={[0, 4, 0]}>
        <RigidBody ref={fixed} {...segmentProps} type="fixed" />
        <RigidBody position={[0.5, 0, 0]} ref={j1} {...segmentProps}>
          <BallCollider args={[0.1]} />
        </RigidBody>
        <RigidBody position={[1, 0, 0]} ref={j2} {...segmentProps}>
          <BallCollider args={[0.1]} />
        </RigidBody>
        <RigidBody position={[1.5, 0, 0]} ref={j3} {...segmentProps}>
          <BallCollider args={[0.1]} />
        </RigidBody>
        <RigidBody
          position={[2, 0, 0]}
          ref={card}
          {...segmentProps}
          type={dragged ? "kinematicPosition" : "dynamic"}
        >
          <CuboidCollider args={[0.8, 1.125, 0.01]} />
          <group
            scale={2.25}
            position={[0, -1.2, -0.05]}
            onPointerOver={() => hover(true)}
            onPointerOut={() => hover(false)}
            onPointerUp={(e) => {
              (e.target as HTMLElement).releasePointerCapture(e.pointerId);
              drag(undefined);
            }}
            onPointerDown={(e) => {
              (e.target as HTMLElement).setPointerCapture(e.pointerId);
              if (card.current) {
                drag(
                  new Vector3()
                    .copy(e.point)
                    .sub(vec.copy(card.current.translation())),
                );
              }
            }}
          >
            <mesh geometry={(nodes.card as Mesh).geometry}>
              <meshPhysicalMaterial
                map={(materials.base as MeshStandardMaterial).map}
                map-anisotropy={16}
                clearcoat={1}
                clearcoatRoughness={0.15}
                roughness={0.3}
                metalness={0.5}
              />
            </mesh>
            <mesh
              geometry={(nodes.clip as Mesh).geometry}
              material={materials.metal}
              material-roughness={0.3}
            />
            <mesh
              geometry={(nodes.clamp as Mesh).geometry}
              material={materials.metal}
            />
          </group>
        </RigidBody>
      </group>
      <mesh ref={band}>
        <meshLineGeometry />
        <meshLineMaterial
          color="white"
          depthTest={false}
          resolution={new Vector2(width, height)}
          useMap={1}
          map={texture}
          repeat={new Vector2(-3, 1)}
          lineWidth={1}
        />
      </mesh>
    </>
  );
}

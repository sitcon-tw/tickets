"use client";
import { Environment, Lightformer, useGLTF, useTexture } from "@react-three/drei";
import { Canvas, extend, useFrame } from "@react-three/fiber";
import { BallCollider, CuboidCollider, Physics, RapierRigidBody, RigidBody, RigidBodyProps, useRopeJoint, useSphericalJoint } from "@react-three/rapier";
import { MeshLineGeometry, MeshLineMaterial } from "meshline";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

const cardGLB = "/assets/card.glb";
const lanyard = "/assets/lanyard.png";

extend({ MeshLineGeometry, MeshLineMaterial });

import { Text } from "@react-three/drei";

interface LanyardProps {
	position?: [number, number, number];
	gravity?: [number, number, number];
	fov?: number;
	transparent?: boolean;
	name?: string;
}

export default function Lanyard({ position = [0, 0, 30], gravity = [0, -40, 0], fov = 20, transparent = true, name = "一般票" }: LanyardProps) {
       return (
	       <div className="absolute inset-0 w-full h-full flex justify-center items-center transform scale-100 origin-center">
		       <Canvas camera={{ position, fov }} gl={{ alpha: transparent }} onCreated={({ gl }) => gl.setClearColor(new THREE.Color(0x000000), transparent ? 0 : 1)}>
			       <ambientLight intensity={Math.PI} />
			       <Physics gravity={gravity} timeStep={1 / 60}>
				       <Band name={name} />
			       </Physics>
			       <Environment blur={0.75}>
				       <Lightformer intensity={2} color="white" position={[0, -1, 5]} rotation={[0, 0, Math.PI / 3]} scale={[100, 0.1, 1]} />
				       <Lightformer intensity={3} color="white" position={[-1, -1, 1]} rotation={[0, 0, Math.PI / 3]} scale={[100, 0.1, 1]} />
				       <Lightformer intensity={3} color="white" position={[1, 1, 1]} rotation={[0, 0, Math.PI / 3]} scale={[100, 0.1, 1]} />
				       <Lightformer intensity={10} color="white" position={[-10, 0, 14]} rotation={[0, Math.PI / 2, Math.PI / 3]} scale={[100, 10, 1]} />
			       </Environment>
		       </Canvas>
	       </div>
       );
}

interface BandProps {
	maxSpeed?: number;
	minSpeed?: number;
	name?: string;
}

function Band({ maxSpeed = 50, minSpeed = 0, name }: BandProps) {
	const band = useRef<THREE.Mesh & { geometry: MeshLineGeometry }>(null);
	const fixed = useRef<RapierRigidBody>(null!);
	const j1 = useRef<RapierRigidBody>(null!);
	const j2 = useRef<RapierRigidBody>(null!);
	const j3 = useRef<RapierRigidBody>(null!);
	const card = useRef<RapierRigidBody>(null!);

	const vec = new THREE.Vector3();
	const ang = new THREE.Vector3();
	const rot = new THREE.Vector3();
	const dir = new THREE.Vector3();

	const getFontSize = (text: string | undefined): number => {
		if (!text) return 0.2;
		const maxWidth = 0.7;
		const baseFontSize = 0.2;
		const maxLines = 3;

		let estimatedWidth = 0;
		for (let i = 0; i < text.length; i++) {
			const char = text[i];
			const isCJK = /[\u4e00-\u9fff\u3040-\u309f\u30a0-\u30ff\uac00-\ud7af]/.test(char);
			const charWidth = isCJK ? baseFontSize * 1.0 : baseFontSize * 0.5;
			estimatedWidth += charWidth;
		}

		const estimatedLines = Math.ceil(estimatedWidth / maxWidth);

		if (estimatedLines > maxLines) {
			const scaleFactor = maxLines / estimatedLines;
			return Math.max(0.08, baseFontSize * scaleFactor);
		}

		return baseFontSize;
	};

	const segmentProps: Partial<RigidBodyProps> = {
		type: "dynamic" as RigidBodyProps["type"],
		canSleep: true,
		colliders: false,
		angularDamping: 4,
		linearDamping: 4
	};

	const { nodes, materials } = useGLTF(cardGLB) as {
		nodes: Record<string, THREE.Object3D & { geometry?: THREE.BufferGeometry }>;
		materials: Record<string, THREE.Material & { map?: THREE.Texture }>;
	};
	const texture = useTexture(lanyard);
	const [curve] = useState(() => new THREE.CatmullRomCurve3([new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()]));
	const [dragged, drag] = useState<false | THREE.Vector3>(false);
	const [hovered, hover] = useState(false);

	const [isSmall, setIsSmall] = useState<boolean>(() => {
		if (typeof window !== "undefined") {
			return window.innerWidth < 1024;
		}
		return false;
	});

	useEffect(() => {
		const handleResize = (): void => {
			setIsSmall(window.innerWidth < 1024);
		};

		window.addEventListener("resize", handleResize);
		return (): void => window.removeEventListener("resize", handleResize);
	}, []);

	useRopeJoint(fixed, j1, [[0, 0, 0], [0, 0, 0], 1]);
	useRopeJoint(j1, j2, [[0, 0, 0], [0, 0, 0], 1]);
	useRopeJoint(j2, j3, [[0, 0, 0], [0, 0, 0], 1]);
	useSphericalJoint(j3, card, [
		[0, 0, 0],
		[0, 1.45, 0]
	]);

	useEffect(() => {
		if (hovered) {
			document.body.style.cursor = dragged ? "grabbing" : "grab";
			return () => {
				document.body.style.cursor = "auto";
			};
		}
	}, [hovered, dragged]);

	useFrame((state, delta) => {
		if (dragged && typeof dragged !== "boolean") {
			vec.set(state.pointer.x, state.pointer.y, 0.5).unproject(state.camera);
			dir.copy(vec).sub(state.camera.position).normalize();
			vec.add(dir.multiplyScalar(state.camera.position.length()));
			[card, j1, j2, j3, fixed].forEach(ref => ref.current?.wakeUp());
			card.current?.setNextKinematicTranslation({
				x: vec.x - dragged.x,
				y: vec.y - dragged.y,
				z: vec.z - dragged.z
			});
		}
		if (fixed.current) {
			[j1, j2].forEach(ref => {
				if (!(ref.current as unknown as { lerped?: THREE.Vector3 }).lerped) {
					(ref.current as unknown as { lerped: THREE.Vector3 }).lerped = new THREE.Vector3().copy(ref.current!.translation());
				}
				const lerped = (ref.current as unknown as { lerped: THREE.Vector3 }).lerped;
				const clampedDistance = Math.max(0.1, Math.min(1, lerped.distanceTo(ref.current!.translation())));
				lerped.lerp(ref.current!.translation(), delta * (minSpeed + clampedDistance * (maxSpeed - minSpeed)));
			});
			curve.points[0].copy(j3.current!.translation());
			curve.points[1].copy((j2.current as unknown as { lerped: THREE.Vector3 }).lerped);
			curve.points[2].copy((j1.current as unknown as { lerped: THREE.Vector3 }).lerped);
			curve.points[3].copy(fixed.current.translation());
			band.current!.geometry.setPoints(curve.getPoints(32));
			ang.copy(card.current!.angvel());
			rot.copy(card.current!.rotation());
			card.current!.setAngvel({ x: ang.x, y: ang.y - rot.y * 0.25, z: ang.z }, false);
		}
	});

	curve.curveType = "chordal";
	texture.wrapS = texture.wrapT = THREE.RepeatWrapping;

	return (
		<>
			<group position={[0, 4, 0]}>
				<RigidBody ref={fixed} {...segmentProps} type={"fixed" as RigidBodyProps["type"]} />
				<RigidBody position={[0.5, 0, 0]} ref={j1} {...segmentProps} type={"dynamic" as RigidBodyProps["type"]}>
					<BallCollider args={[0.1]} />
				</RigidBody>
				<RigidBody position={[1, 0, 0]} ref={j2} {...segmentProps} type={"dynamic" as RigidBodyProps["type"]}>
					<BallCollider args={[0.1]} />
				</RigidBody>
				<RigidBody position={[1.5, 0, 0]} ref={j3} {...segmentProps} type={"dynamic" as RigidBodyProps["type"]}>
					<BallCollider args={[0.1]} />
				</RigidBody>
				<RigidBody position={[2, 0, 0]} ref={card} {...segmentProps} type={dragged ? ("kinematicPosition" as RigidBodyProps["type"]) : ("dynamic" as RigidBodyProps["type"])}>
					<CuboidCollider args={[0.8, 1.125, 0.01]} />
			       <group
				       scale={2.25}
				       position={[0, -1.2, -0.05]}
				       onPointerOver={() => hover(true)}
				       onPointerOut={() => hover(false)}
				       onPointerUp={(e: React.PointerEvent<THREE.Group>) => {
					       (e.target as Element).releasePointerCapture(e.pointerId);
					       drag(false);
				       }}
				       onPointerDown={(e: React.PointerEvent<THREE.Group> & { point: THREE.Vector3 }) => {
					       (e.target as Element).setPointerCapture(e.pointerId);
					       drag(new THREE.Vector3().copy(e.point).sub(vec.copy(card.current!.translation())));
				       }}
			       >
				       <mesh geometry={nodes.card.geometry}>
					       <meshPhysicalMaterial map={materials.base.map} map-anisotropy={16} clearcoat={1} clearcoatRoughness={0.15} roughness={0.9} metalness={0.8} />
				       </mesh>
				       <mesh geometry={nodes.clip.geometry} material={materials.metal} material-roughness={0.3} />
				       <mesh geometry={nodes.clamp.geometry} material={materials.metal} />
				       {name && (
					       <Text
						       position={[0, 0.5, 0.01]}
						       fontSize={getFontSize(name)}
						       color="#fff"
						       anchorX="center"
						       anchorY="middle"
						       maxWidth={0.7}
						       textAlign="center"
						       font="/fonts/NotoSansTC-Regular.ttf"
						       overflowWrap="break-word"
						       whiteSpace="normal"
						       lineHeight={1.2}
					       >
						       {name}
					       </Text>
				       )}
			       </group>
				</RigidBody>
			</group>
			<mesh ref={band}>
				<meshLineGeometry />
				<meshLineMaterial color="white" depthTest={false} resolution={isSmall ? [1000, 2000] : [1000, 1000]} useMap map={texture} repeat={[-4, 1]} lineWidth={1} />
			</mesh>
		</>
	);
}

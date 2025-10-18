export {};

declare module "*.glb";
declare module "*.png";

declare module "meshline" {
	import { BufferGeometry, Material } from "three";

	export class MeshLineGeometry extends BufferGeometry {
		setPoints(points: THREE.Vector3[]): void;
	}

	export class MeshLineMaterial extends Material {
		constructor(parameters?: { color?: string | number; lineWidth?: number; map?: THREE.Texture; useMap?: boolean; repeat?: [number, number]; resolution?: [number, number]; depthTest?: boolean });
	}
}

declare module "@react-three/fiber" {
	interface ThreeElements {
		meshLineGeometry: object;
		meshLineMaterial: {
			color?: string;
			lineWidth?: number;
			map?: THREE.Texture;
			useMap?: boolean;
			repeat?: [number, number];
			resolution?: [number, number];
			depthTest?: boolean;
		};
	}
}

export {};

declare module "*.glb";
declare module "*.png";

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

/**
 * Three.js scene for the employee card (mission briefing).
 * Loads employee_card.glb with its original materials (no rope texture).
 */

import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

const GLB_URL = "/models/employee_card.glb";

export interface EmployeeCardScene {
	scene: THREE.Scene;
	camera: THREE.PerspectiveCamera;
	renderer: THREE.WebGLRenderer;
	dispose: () => void;
}

export function createEmployeeCardScene(
	canvas: HTMLCanvasElement,
	onLoad?: () => void,
): EmployeeCardScene {
	const scene = new THREE.Scene();
	scene.background = new THREE.Color(0x0a0a12);

	const camera = new THREE.PerspectiveCamera(
		40,
		canvas.clientWidth / canvas.clientHeight,
		0.1,
		100,
	);
	camera.position.set(0, 0, 2.5);
	camera.lookAt(0, 0, 0);

	const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
	renderer.setSize(canvas.clientWidth, canvas.clientHeight);
	renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

	const ambient = new THREE.AmbientLight(0x404060);
	scene.add(ambient);
	const key = new THREE.DirectionalLight(0xffffff, 0.8);
	key.position.set(2, 2, 3);
	scene.add(key);
	const fill = new THREE.DirectionalLight(0x6688cc, 0.3);
	fill.position.set(-1, 0.5, 2);
	scene.add(fill);

	const gltfLoader = new GLTFLoader();
	let animationId: number | null = null;
	let cardGroup: THREE.Group | null = null;

	gltfLoader.load(GLB_URL, (gltf: { scene: THREE.Group }) => {
		cardGroup = gltf.scene;
		// Use GLB's original materials (card texture is embedded or in the model)
		cardGroup.rotation.y = Math.PI * 0.1;
		cardGroup.scale.setScalar(0.8);
		scene.add(cardGroup);
		onLoad?.();
	});

	function animate() {
		animationId = requestAnimationFrame(animate);
		if (cardGroup) {
			cardGroup.rotation.y += 0.004;
		}
		renderer.render(scene, camera);
	}
	animate();

	function onResize() {
		const w = canvas.clientWidth;
		const h = canvas.clientHeight;
		camera.aspect = w / h;
		camera.updateProjectionMatrix();
		renderer.setSize(w, h);
	}
	window.addEventListener("resize", onResize);

	function dispose() {
		window.removeEventListener("resize", onResize);
		if (animationId !== null) {
			cancelAnimationFrame(animationId);
		}
		renderer.dispose();
		scene.clear();
	}

	return { scene, camera, renderer, dispose };
}

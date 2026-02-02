/**
 * Three.js scene for the desktop space background.
 * Loads need_some_space.glb with vertex colors and bloom (halo).
 * Model: "Need some space?" by Loïc Norgeot (CC BY).
 */

import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";

const GLB_URL = "/models/need_some_space.glb";
const ROTATION_SPEED = 0.0004;

export interface SpaceSceneApi {
	dispose: () => void;
}

export function createSpaceScene(
	canvas: HTMLCanvasElement,
	onLoad?: () => void,
): SpaceSceneApi {
	const scene = new THREE.Scene();
	scene.background = new THREE.Color(0x0a0a12);

	const camera = new THREE.PerspectiveCamera(
		50,
		canvas.clientWidth / canvas.clientHeight,
		0.1,
		1000,
	);
	camera.position.set(0, 1.2, 5);
	camera.lookAt(0, 0, 0);

	const renderer = new THREE.WebGLRenderer({
		canvas,
		antialias: true,
		alpha: false,
	});
	renderer.setSize(canvas.clientWidth, canvas.clientHeight);
	const pixelRatio = Math.min(window.devicePixelRatio, 2);
	renderer.setPixelRatio(pixelRatio);
	renderer.toneMapping = THREE.NoToneMapping;
	renderer.toneMappingExposure = 0.85; // slightly dim for comfort
	renderer.outputColorSpace = THREE.SRGBColorSpace;

	const composer = new EffectComposer(renderer);
	composer.addPass(new RenderPass(scene, camera));
	const bloomPass = new UnrealBloomPass(
		new THREE.Vector2(canvas.clientWidth * pixelRatio, canvas.clientHeight * pixelRatio),
		0.6, // strength
		0.35, // radius – less spread
		0.25, // threshold
	);
	composer.addPass(bloomPass);

	const ambient = new THREE.AmbientLight(0x8899cc, 0.55);
	scene.add(ambient);
	const key = new THREE.DirectionalLight(0xffffff, 0.55);
	key.position.set(2, 2, 5);
	scene.add(key);
	const fill = new THREE.DirectionalLight(0xaaccff, 0.35);
	fill.position.set(-2, 1, 3);
	scene.add(fill);
	const back = new THREE.DirectionalLight(0x6688cc, 0.25);
	back.position.set(0, -1, -2);
	scene.add(back);
	const point = new THREE.PointLight(0xffffff, 0.45, 10);
	point.position.set(0, 0.5, 2);
	scene.add(point);

	let animationId: number | null = null;
	let pivotGroup: THREE.Group | null = null;

	const gltfLoader = new GLTFLoader();

	gltfLoader.load(GLB_URL, (gltf: { scene: THREE.Group }) => {
		const model = gltf.scene;
		model.scale.setScalar(2);

		model.traverse((child) => {
			const mesh = child as THREE.Mesh | THREE.Points;
			const mat = mesh.material;
			const geom = mesh.geometry;
			if (!mat || !geom) return;

			const attrs = (geom as THREE.BufferGeometry).attributes;
			let colorAttr = attrs?.color;
			if (colorAttr && colorAttr.itemSize === 4 && colorAttr.array) {
				const n = colorAttr.count * 3;
				const rgb = new Float32Array(n);
				const src = colorAttr.array as Float32Array | Uint8Array;
				for (let i = 0; i < colorAttr.count; i++) {
					rgb[i * 3] = src[i * 4];
					rgb[i * 3 + 1] = src[i * 4 + 1];
					rgb[i * 3 + 2] = src[i * 4 + 2];
				}
				(geom as THREE.BufferGeometry).setAttribute("color", new THREE.Float32BufferAttribute(rgb, 3));
				colorAttr = (geom as THREE.BufferGeometry).attributes.color;
			}

			if (colorAttr && colorAttr.itemSize === 3 && colorAttr.array) {
				const count = colorAttr.count;
				const src = colorAttr.array as Float32Array;
				const linear = new Float32Array(count * 3);
				const c = new THREE.Color();
				for (let i = 0; i < count; i++) {
					c.setRGB(src[i * 3], src[i * 3 + 1], src[i * 3 + 2], THREE.SRGBColorSpace);
					linear[i * 3] = c.r;
					linear[i * 3 + 1] = c.g;
					linear[i * 3 + 2] = c.b;
				}
				(geom as THREE.BufferGeometry).setAttribute("color", new THREE.Float32BufferAttribute(linear, 3));
			}

			if (mesh.type === "Points" && geom && (geom as THREE.BufferGeometry).attributes?.color) {
				const oldMat = Array.isArray(mat) ? (mat as THREE.PointsMaterial[])[0] : (mat as THREE.PointsMaterial);
				mesh.material = new THREE.PointsMaterial({
					vertexColors: true,
					color: 0xffffff,
					size: oldMat?.size ?? 1,
					sizeAttenuation: oldMat?.sizeAttenuation ?? true,
					fog: true,
					transparent: true,
					opacity: 0.88, // softer overlap, less glare
					blending: THREE.AdditiveBlending,
					depthWrite: false,
				});
			}
		});

		const box = new THREE.Box3().setFromObject(model);
		const center = new THREE.Vector3();
		box.getCenter(center);
		model.position.sub(center);

		const pivot = new THREE.Group();
		pivot.add(model);
		scene.add(pivot);
		pivotGroup = pivot;
		onLoad?.();
	});

	function animate() {
		animationId = requestAnimationFrame(animate);
		if (pivotGroup) {
			pivotGroup.rotation.y += ROTATION_SPEED;
		}
		composer.render();
	}
	animate();

	function onResize() {
		const w = canvas.clientWidth;
		const h = canvas.clientHeight;
		camera.aspect = w / h;
		camera.updateProjectionMatrix();
		renderer.setSize(w, h);
		composer.setSize(w, h);
		composer.setPixelRatio(renderer.getPixelRatio());
	}
	window.addEventListener("resize", onResize);

	function dispose() {
		window.removeEventListener("resize", onResize);
		if (animationId !== null) {
			cancelAnimationFrame(animationId);
		}
		composer.dispose();
		renderer.dispose();
		scene.clear();
	}

	return { dispose };
}

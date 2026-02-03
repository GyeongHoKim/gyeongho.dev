import { defineConfig } from "vite";

export default defineConfig({
	build: {
		chunkSizeWarningLimit: 800,
		rollupOptions: {
			output: {
				manualChunks(id) {
					if (id.includes("node_modules/three") || id.includes("node_modules/three/")) {
						return "three";
					}
					if (
						id.includes("node_modules/@xterm") ||
						id.includes("node_modules/xterm")
					) {
						return "xterm";
					}
					if (id.includes("node_modules/marked")) {
						return "marked";
					}
					if (
						id.includes("node_modules/lit") ||
						id.includes("node_modules/@lit")
					) {
						return "lit";
					}
					if (id.includes("node_modules/zustand")) {
						return "zustand";
					}
					if (id.includes("node_modules/iconify-icon")) {
						return "iconify";
					}
				},
			},
		},
	},
});

import type { ImageMetadata } from "astro";

// Every file in the folder is picked up, so a new screen needs no import of its own.
const images = import.meta.glob<ImageMetadata>(
	"../assets/portfolio/*.{jpg,jpeg,png,webp,avif}",
	{ eager: true, import: "default" },
);
const videos = import.meta.glob<string>("../assets/portfolio/*.{mp4,webm}", {
	eager: true,
	query: "?url",
	import: "default",
});

function find<T>(files: Record<string, T>, name: string): T {
	const file = files[`../assets/portfolio/${name}`];
	if (file !== undefined) return file;
	const known = Object.keys(files).map((path) => path.split("/").pop());
	throw new Error(
		`src/assets/portfolio/${name} does not exist. Files there: ${known.join(", ")}`,
	);
}

/** The image named in projects.json. Throws, and so fails the build, when the file is missing. */
export const portfolioImage = (name: string): ImageMetadata =>
	find(images, name);

/** The URL of the video named in projects.json. Throws when the file is missing. */
export const portfolioVideo = (name: string): string => find(videos, name);

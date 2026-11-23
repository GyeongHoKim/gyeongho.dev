// Bilinear sampling with the same neighbour rule as the fisheye.js 2.2.0 shader.
// Used to render the still images; the live demo samples on the GPU.

export interface RawImage {
	data: Uint8Array;
	width: number;
	height: number;
	channels: number;
}

/**
 * The value of each channel at (x, y), where whole numbers are pixel centres.
 * Neighbours are clamped to [0, width - 1] and [0, height - 1].
 */
export function sampleBilinear(
	image: RawImage,
	x: number,
	y: number,
): number[] {
	const { data, width, height, channels } = image;
	const clamp = (v: number, max: number) => Math.min(max, Math.max(0, v));
	const left = Math.floor(x);
	const top = Math.floor(y);
	const fx = x - left;
	const fy = y - top;
	const x0 = clamp(left, width - 1);
	const x1 = clamp(left + 1, width - 1);
	const row0 = clamp(top, height - 1) * width;
	const row1 = clamp(top + 1, height - 1) * width;
	const values: number[] = [];
	for (let c = 0; c < channels; c++) {
		const at = (index: number) => data[index * channels + c] ?? 0;
		const upper = at(row0 + x0) * (1 - fx) + at(row0 + x1) * fx;
		const lower = at(row1 + x0) * (1 - fx) + at(row1 + x1) * fx;
		values.push(upper * (1 - fy) + lower * fy);
	}
	return values;
}

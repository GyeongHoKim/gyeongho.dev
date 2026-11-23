// Renders the two still images of the fisheye post demo from src/assets/home/cam1.jpg:
// the dewarped view at the initial view, and the picture used as the post's fallback content.
import { mkdir } from "node:fs/promises";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import tokens from "@ghds/tokens/json" with { type: "json" };
import sharp from "sharp";
import {
	CAM1,
	footprint,
	footprintPath,
	INITIAL_VIEW,
	scaleLens,
	sourcePoint,
	squareOutput,
} from "../src/demos/fisheye-inverse/mapping.ts";
import { sampleBilinear } from "../src/demos/fisheye-inverse/resample.ts";

const SIZE = 720;
const QUALITY = 82;
const POINTS_PER_EDGE = 24;
// The fallback picture is two panes wide and is laid out at half its size in the post body.
const LAYOUT_SCALE = 2;

const root = new URL("..", import.meta.url);
const path = (file) => fileURLToPath(new URL(file, root));
const PHOTO = path("src/assets/home/cam1.jpg");
const DEWARPED = path("src/demos/fisheye-inverse/dewarped.jpg");
const FALLBACK = path(
	"src/content/blog/assets/fisheye-dewarping-inverse-mapping/fallback.jpg",
);

const px = (value) => Number.parseFloat(value);
const outlineColor = tokens.sys.color.border.focus;
const haloColor = tokens.sys.color.bg.surface;
const outlineWidth = px(tokens.sys.border.width.thick) * LAYOUT_SCALE;
const haloWidth = outlineWidth + 2 * px(tokens.sys.border.width.default);

const { data, info } = await sharp(PHOTO)
	.removeAlpha()
	.toColourspace("srgb")
	.raw()
	.toBuffer({ resolveWithObject: true });
const photo = {
	data,
	width: info.width,
	height: info.height,
	channels: info.channels,
};
const lens = scaleLens(CAM1, photo.width / CAM1.width);
const output = squareOutput(lens, SIZE);

// Dewarped view: every output pixel reads one point of the photo, or stays black.
const dewarped = Buffer.alloc(SIZE * SIZE * photo.channels);
let empty = 0;
for (let y = 0; y < SIZE; y++) {
	for (let x = 0; x < SIZE; x++) {
		const source = sourcePoint(lens, INITIAL_VIEW, output, x, y);
		if (source === null) {
			empty++;
			continue;
		}
		const values = sampleBilinear(photo, source.x, source.y);
		const offset = (y * SIZE + x) * photo.channels;
		for (let c = 0; c < photo.channels; c++)
			dewarped[offset + c] = Math.round(values[c]);
	}
}
const dewarpedRaw = {
	raw: { width: SIZE, height: SIZE, channels: photo.channels },
};
await mkdir(dirname(DEWARPED), { recursive: true });
await sharp(dewarped, dewarpedRaw).jpeg({ quality: QUALITY }).toFile(DEWARPED);

// Fallback picture: the photo with the outline of the view on the left, the dewarped view on the right.
const outline = footprintPath(
	footprint(lens, INITIAL_VIEW, output, POINTS_PER_EDGE),
);
const unit = lens.width / SIZE; // one pixel of the pane in viewBox units
const stroke = (color, width) =>
	`<path d="${outline}" fill="none" stroke="${color}" stroke-width="${width * unit}" stroke-linejoin="round" stroke-linecap="round"/>`;
const overlay = `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 ${lens.width} ${lens.height}">${stroke(haloColor, haloWidth)}${stroke(outlineColor, outlineWidth)}</svg>`;
const left = await sharp(PHOTO)
	.resize(SIZE, SIZE)
	.composite([{ input: Buffer.from(overlay) }])
	.png()
	.toBuffer();
await mkdir(dirname(FALLBACK), { recursive: true });
await sharp({
	create: { width: SIZE * 2, height: SIZE, channels: 3, background: "#000" },
})
	.composite([
		{ input: left, left: 0, top: 0 },
		{ input: dewarped, ...dewarpedRaw, left: SIZE, top: 0 },
	])
	.jpeg({ quality: QUALITY })
	.toFile(FALLBACK);

console.log(
	`render-fisheye-stills: ${empty} of ${SIZE * SIZE} output pixels read nothing`,
);

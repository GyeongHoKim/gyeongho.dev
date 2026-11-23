import type { Locale } from "../../i18n";
import type { Point, View } from "./mapping";

export interface Strings {
	source: string;
	view: string;
	zoom: string;
	viewLabel: string;
	crossLabel: string;
	/** What the two pictures show, for a reader who cannot see them. */
	photoAlt: string;
	viewAlt: string;
	/** Under the pictures while the view can be turned. */
	hint: string;
	/** In the place of the hint while the view is the still image. */
	noGpu: string;
	outside: string;
}

const STRINGS: Record<Locale, Strings> = {
	ko: {
		source: "원본",
		view: "펴진 화면",
		zoom: "Zoom",
		viewLabel: "펴진 화면. 방향키로 시점을 돌립니다.",
		crossLabel: "가리키는 점. 방향키로 움직입니다.",
		photoAlt:
			"어안 사진 원본입니다. 펴진 화면이 읽는 영역의 윤곽이 그려져 있습니다.",
		viewAlt: "원본의 윤곽 안쪽을 편 화면입니다.",
		hint: "펴진 화면을 드래그하거나, 펴진 화면에 초점을 두고 방향키를 눌러서 시점을 돌립니다.",
		noGpu:
			"WebGPU를 쓸 수 없어서 펴진 화면을 정지 그림으로 보여 드립니다. 점을 가리키는 조작은 그대로 됩니다.",
		outside: "원본 사진 밖",
	},
	en: {
		source: "Original",
		view: "Dewarped view",
		zoom: "Zoom",
		viewLabel: "Dewarped view. Arrow keys turn the view.",
		crossLabel: "Pointed pixel. Arrow keys move it.",
		photoAlt:
			"The fisheye photo, with the outline of the area the dewarped view reads.",
		viewAlt: "The area inside the outline, dewarped.",
		hint: "Drag the dewarped view, or press the arrow keys while it has focus, to turn the view.",
		noGpu:
			"WebGPU is not available, so the dewarped view is a still image. Pointing at it still works.",
		outside: "outside the photo",
	},
};

export function strings(locale: Locale): Strings {
	return STRINGS[locale];
}

// What the readout calls the two pictures; shorter than the captions in English.
const READOUT: Record<Locale, { view: string; source: string }> = {
	ko: { view: "펴진 화면", source: "원본" },
	en: { view: "view", source: "photo" },
};

/**
 * The state of the demo in one line: the view, the pointed output pixel and
 * the source pixel it reads (null when it reads nothing).
 */
export function readout(
	locale: Locale,
	view: View,
	pointed: Point,
	source: Point | null,
): string {
	const names = READOUT[locale];
	const at = (p: Point) => `(${Math.round(p.x)}, ${Math.round(p.y)})`;
	const angle = (degrees: number) => `${Math.round(degrees)}°`;
	const read = source
		? `${names.source} ${at(source)}`
		: STRINGS[locale].outside;
	return `pan ${angle(view.pan)} · tilt ${angle(view.tilt)} · zoom ${view.zoom.toFixed(1)}× | ${names.view} ${at(pointed)} → ${read}`;
}

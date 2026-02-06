/**
 * App router — hash routing + flow orchestration.
 * Keeps UI components render-only by centralizing route changes here.
 */

import { createRouter } from "@ficusjs/router";
import type { AuthState } from "../../../shared/lib/auth-store.js";
import {
	getBriefingSeen,
	setBriefingSeen,
} from "../../../shared/lib/briefing-store.js";
import { isMobile } from "../../../shared/lib/device-store.js";
import { subscribeAuth } from "../../../shared/lib/auth-store.js";

type RouterInstance = ReturnType<typeof createRouter>;

type DeviceSegment = "desktop" | "mobile";

function getHashPathname(): string {
	if (typeof window === "undefined") return "";
	const hash = window.location.hash ?? "";
	if (!hash) return "";
	const raw = hash.startsWith("#") ? hash.slice(1) : hash;
	const cleaned = raw.startsWith("!") ? raw.slice(1) : raw;
	const [pathname] = cleaned.split("?");
	if (!pathname) return "";
	if (pathname.length > 1) {
		return pathname.replace(/\/+$/, "");
	}
	return pathname;
}

function getDeviceFromPath(pathname: string): DeviceSegment {
	if (pathname.startsWith("/mobile")) return "mobile";
	if (pathname.startsWith("/desktop")) return "desktop";
	return isMobile() ? "mobile" : "desktop";
}

function getInitialDesktopPath(): string {
	return getBriefingSeen() ? "/desktop/boot" : "/desktop/briefing";
}

function getInitialMobilePath(): string {
	return getBriefingSeen() ? "/mobile/lock" : "/mobile/briefing";
}

function getInitialPath(): string {
	return isMobile() ? getInitialMobilePath() : getInitialDesktopPath();
}

function routeTemplate(tagName: string): string {
	return `<div id="main" role="main" tabindex="-1"><${tagName}></${tagName}></div>`;
}

function lazyRoute(tagName: string, loader: () => Promise<unknown>) {
	return async () => {
		await loader();
		return routeTemplate(tagName);
	};
}

function buildRoutes() {
	return [
		{ path: "", action: () => ({ redirect: getInitialPath() }) },
		{ path: "/", action: () => ({ redirect: getInitialPath() }) },
		{ path: "/desktop", action: () => ({ redirect: getInitialDesktopPath() }) },
		{ path: "/mobile", action: () => ({ redirect: getInitialMobilePath() }) },
		{
			path: "/desktop/briefing",
			action: lazyRoute("mission-briefing", () =>
				import("../../../features/mission-briefing/ui/mission-briefing.ts"),
			),
		},
		{
			path: "/desktop/boot",
			action: lazyRoute("boot-page", () =>
				import("../../../pages/boot/ui/boot-page.ts"),
			),
		},
		{
			path: "/desktop/login",
			action: lazyRoute("login-page", () =>
				import("../../../pages/login/ui/login-page.ts"),
			),
		},
		{
			path: "/desktop/desktop",
			action: lazyRoute("desktop-page", () =>
				import("../../../pages/desktop/ui/desktop-page.ts"),
			),
		},
		{
			path: "/mobile/briefing",
			action: lazyRoute("mission-briefing", () =>
				import("../../../features/mission-briefing/ui/mission-briefing.ts"),
			),
		},
		{
			path: "/mobile/lock",
			action: lazyRoute("mobile-lock-page", () =>
				import("../../../pages/mobile-lock/ui/mobile-lock-page.ts"),
			),
		},
		{
			path: "/mobile/passcode",
			action: lazyRoute("mobile-passcode-page", () =>
				import("../../../pages/mobile-passcode/ui/mobile-passcode-page.ts"),
			),
		},
		{
			path: "/mobile/home",
			action: lazyRoute("mobile-home-page", () =>
				import("../../../pages/mobile-home/ui/mobile-home-page.ts"),
			),
		},
	];
}

function ensureInitialRoute(router: RouterInstance): void {
	const pathname = getHashPathname();
	if (!pathname || pathname === "/") {
		router.replace(getInitialPath());
	}
}

function setupDesktopFlows(router: RouterInstance): () => void {
	const unsubscribeAuth = subscribeAuth((state: AuthState) => {
		const pathname = getHashPathname();
		if (!pathname.startsWith("/desktop")) return;
		if (state.user) {
			router.push("/desktop/desktop");
			return;
		}
		if (pathname === "/desktop/desktop") {
			router.push("/desktop/login");
		}
	});

	return () => {
		unsubscribeAuth();
	};
}

function setupRouteEvents(root: HTMLElement, router: RouterInstance): () => void {
	const onAccept = () => {
		setBriefingSeen(true);
		const device = getDeviceFromPath(getHashPathname());
		if (device === "mobile") {
			router.push("/mobile/lock");
			return;
		}
		router.push("/desktop/boot");
	};

	const onShowPasscode = () => {
		router.push("/mobile/passcode");
	};

	const onUnlock = () => {
		router.push("/mobile/home");
	};

	const onCancelPasscode = () => {
		router.push("/mobile/lock");
	};

	const onBootComplete = () => {
		if (getHashPathname() === "/desktop/boot") {
			router.push("/desktop/login");
		}
	};

	root.addEventListener("accept", onAccept);
	root.addEventListener("show-passcode", onShowPasscode);
	root.addEventListener("unlock", onUnlock);
	root.addEventListener("cancel-passcode", onCancelPasscode);
	root.addEventListener("boot-complete", onBootComplete as EventListener);

	return () => {
		root.removeEventListener("accept", onAccept);
		root.removeEventListener("show-passcode", onShowPasscode);
		root.removeEventListener("unlock", onUnlock);
		root.removeEventListener("cancel-passcode", onCancelPasscode);
		root.removeEventListener("boot-complete", onBootComplete as EventListener);
	};
}

export function createAppRouter(root: HTMLElement): () => void {
	const router = createRouter(buildRoutes(), "#router-outlet", {
		mode: "hash",
	});

	ensureInitialRoute(router);

	const disposeEvents = setupRouteEvents(root, router);
	const disposeDesktopFlows = setupDesktopFlows(router);

	return () => {
		disposeEvents();
		disposeDesktopFlows();
	};
}

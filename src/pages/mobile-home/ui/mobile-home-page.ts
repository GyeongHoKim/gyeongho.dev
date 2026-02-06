/**
 * Mobile Home Page — authentic iOS home screen.
 * Search pill, 4-column app grid with squircle icons, page dots, 4-app dock.
 * Tapping Terminus opens the terminal simulation overlay.
 */

import { LitElement, css, html } from "lit";
import { customElement } from "lit/decorators.js";
import { msg, updateWhenLocaleChanges } from "@lit/localize";
import "iconify-icon";
import "../../../widgets/ios-status-bar/ui/ios-status-bar.ts";
import "../../../widgets/ios-home-indicator/ui/ios-home-indicator.ts";
import "../../mobile-terminus/ui/mobile-terminus-page.ts";
import "../../../features/resume-viewer/ui/resume-viewer.ts";
import { MobileHomeController } from "../lib/mobile-home-controller.js";

interface AppIcon {
	id: string;
	label: string;
	icon: string;
	color?: string;
	gradient?: string;
	action?: string;
}

@customElement("mobile-home-page")
export class MobileHomePage extends LitElement {
	private readonly _ctrl = new MobileHomeController(this);

	constructor() {
		super();
		updateWhenLocaleChanges(this);
	}

	static styles = css`
		:host {
			display: block;
			width: 100%;
			height: 100vh;
			height: 100dvh;
			overflow: hidden;
			position: relative;
		}

		.home-screen {
			width: 100%;
			height: 100%;
			background: linear-gradient(160deg, #0a0a1a 0%, #1a1a3e 40%, #0f2847 70%, #0a1628 100%);
			display: flex;
			flex-direction: column;
		}

		/* Search pill */
		.search-pill {
			margin: 8px 16px 16px 16px;
			height: 36px;
			background: rgba(255, 255, 255, 0.12);
			border-radius: 12px;
			display: flex;
			align-items: center;
			justify-content: center;
			gap: 6px;
			font-family: -apple-system, "SF Pro Text", "Helvetica Neue", sans-serif;
			font-size: 16px;
			color: rgba(255, 255, 255, 0.45);
			flex-shrink: 0;
		}

		.search-pill svg {
			display: block;
		}

		/* App grid */
		.app-grid {
			flex: 1;
			display: grid;
			grid-template-columns: repeat(4, 1fr);
			row-gap: 24px;
			column-gap: 0;
			padding: 0 20px;
			align-content: start;
		}

		.app-item {
			display: flex;
			flex-direction: column;
			align-items: center;
			gap: 5px;
			background: none;
			border: none;
			padding: 0;
			cursor: pointer;
			-webkit-tap-highlight-color: transparent;
		}

		.app-item:active .icon-squircle {
			transform: scale(0.88);
		}

		/* iOS squircle icon */
		.icon-squircle {
			width: 62px;
			height: 62px;
			border-radius: 14px;
			display: flex;
			align-items: center;
			justify-content: center;
			transition: transform 0.12s ease;
			box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
			position: relative;
			overflow: hidden;
		}

		.app-label {
			font-family: -apple-system, "SF Pro Text", "Helvetica Neue", sans-serif;
			font-size: 11px;
			font-weight: 500;
			color: rgba(255, 255, 255, 0.9);
			text-align: center;
			overflow: hidden;
			text-overflow: ellipsis;
			white-space: nowrap;
			max-width: 72px;
		}

		/* Page dots */
		.page-dots {
			display: flex;
			justify-content: center;
			gap: 8px;
			padding: 8px 0 12px 0;
			flex-shrink: 0;
		}

		.page-dot {
			width: 7px;
			height: 7px;
			border-radius: 50%;
			background: rgba(255, 255, 255, 0.25);
		}

		.page-dot.active {
			background: #fff;
		}

		/* Dock */
		.dock {
			margin: 0 8px 8px 8px;
			padding: 12px 16px;
			background: rgba(255, 255, 255, 0.15);
			backdrop-filter: blur(25px);
			-webkit-backdrop-filter: blur(25px);
			border-radius: 26px;
			display: grid;
			grid-template-columns: repeat(4, 1fr);
			gap: 0;
			flex-shrink: 0;
		}

		.dock .app-item {
			gap: 0;
		}

		.dock .app-label {
			display: none;
		}

		.dock .icon-squircle {
			width: 58px;
			height: 58px;
		}

		/* App overlay */
		.app-overlay {
			position: absolute;
			inset: 0;
			z-index: 100;
			animation: app-open 0.35s cubic-bezier(0.32, 0.72, 0, 1);
		}

		@keyframes app-open {
			from {
				transform: scale(0.92);
				opacity: 0;
			}
			to {
				transform: scale(1);
				opacity: 1;
			}
		}

		/* Resume overlay */
		.resume-overlay {
			position: fixed;
			top: 0;
			left: 0;
			width: 100%;
			height: 100%;
			background: rgba(0, 0, 0, 0.85);
			display: flex;
			align-items: center;
			justify-content: center;
			z-index: 200;
			padding: 16px;
		}

		resume-viewer {
			max-width: 100%;
			width: 100%;
		}

		@media (prefers-reduced-motion: reduce) {
			.app-overlay {
				animation: none;
			}
			.app-item:active .icon-squircle {
				transform: none;
			}
		}
	`;

	private _getApps(): AppIcon[] {
		return [
			{
				id: "terminus",
				label: "Terminus",
				icon: "lucide:terminal-square",
				color: "#000",
				action: "open-terminus",
			},
			{
				id: "safari",
				label: "Safari",
				icon: "lucide:compass",
				gradient:
					"linear-gradient(180deg, #4FC3F7 0%, #2196F3 50%, #1565C0 100%)",
			},
			{
				id: "settings",
				label: msg("Settings", { desc: "iOS Settings app" }),
				icon: "lucide:settings",
				color: "#8E8E93",
			},
			{
				id: "notes",
				label: msg("Notes", { desc: "iOS Notes app" }),
				icon: "lucide:notebook-pen",
				gradient: "linear-gradient(180deg, #FFCC02 0%, #F5A623 100%)",
			},
			{
				id: "files",
				label: msg("Files", { desc: "iOS Files app" }),
				icon: "lucide:folder",
				gradient: "linear-gradient(180deg, #52A3FF 0%, #007AFF 100%)",
			},
			{
				id: "photos",
				label: msg("Photos", { desc: "iOS Photos app" }),
				icon: "lucide:image",
				gradient:
					"linear-gradient(135deg, #FF6B6B 0%, #FFD93D 30%, #6BCB77 60%, #4D96FF 100%)",
			},
			{
				id: "clock",
				label: msg("Clock", { desc: "iOS Clock app" }),
				icon: "lucide:clock",
				color: "#000",
			},
			{
				id: "calculator",
				label: msg("Calculator", { desc: "iOS Calculator app" }),
				icon: "lucide:calculator",
				color: "#333",
			},
		];
	}

	private _getDockApps(): AppIcon[] {
		return [
			{
				id: "phone-dock",
				label: "Phone",
				icon: "lucide:phone",
				gradient: "linear-gradient(180deg, #5FD068 0%, #28A745 100%)",
			},
			{
				id: "safari-dock",
				label: "Safari",
				icon: "lucide:compass",
				gradient: "linear-gradient(180deg, #4FC3F7 0%, #1565C0 100%)",
			},
			{
				id: "messages-dock",
				label: "Messages",
				icon: "lucide:message-circle",
				gradient: "linear-gradient(180deg, #5FD068 0%, #28A745 100%)",
			},
			{
				id: "terminus-dock",
				label: "Terminus",
				icon: "lucide:terminal-square",
				color: "#000",
				action: "open-terminus",
			},
		];
	}

	private _onAppTap(app: AppIcon): void {
		if (app.action === "open-terminus") {
			this._ctrl.openApp("terminus");
		}
	}

	private _renderAppIcon(app: AppIcon) {
		const bg = app.gradient ? app.gradient : (app.color ?? "#333");
		return html`
			<button
				class="app-item"
				@click=${() => this._onAppTap(app)}
				aria-label=${app.label}
			>
				<div class="icon-squircle" style="background: ${bg}">
					<iconify-icon
						icon=${app.icon}
						width="30"
						height="30"
						style="color: #fff"
						aria-hidden="true"
					></iconify-icon>
				</div>
				<span class="app-label">${app.label}</span>
			</button>
		`;
	}

	render() {
		const apps = this._getApps();
		const dockApps = this._getDockApps();

		return html`
			<div class="home-screen">
				<ios-status-bar variant="light"></ios-status-bar>

				<div class="search-pill">
					<svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
						<circle cx="5.5" cy="5.5" r="4.5" stroke="rgba(255,255,255,0.45)" stroke-width="1.5"/>
						<path d="M9 9l4 4" stroke="rgba(255,255,255,0.45)" stroke-width="1.5" stroke-linecap="round"/>
					</svg>
					${msg("Search", { desc: "iOS search placeholder" })}
				</div>

				<div class="app-grid">
					${apps.map((app) => this._renderAppIcon(app))}
				</div>

				<div class="page-dots">
					<div class="page-dot active"></div>
					<div class="page-dot"></div>
					<div class="page-dot"></div>
				</div>

				<div class="dock">
					${dockApps.map((app) => this._renderAppIcon(app))}
				</div>

				<ios-home-indicator variant="light"></ios-home-indicator>
			</div>

			${
				this._ctrl.activeApp === "terminus"
					? html`
					<div class="app-overlay">
						<mobile-terminus-page
							@go-home=${() => this._ctrl.closeApp()}
							@resume-revealed=${() => this._ctrl.setResumeRevealed()}
						></mobile-terminus-page>
					</div>
				`
					: null
			}

			${
				this._ctrl.resumeVisible
					? html`
					<div class="resume-overlay" @click=${() => this._ctrl.closeResume()}>
						<resume-viewer @close=${() => this._ctrl.closeResume()}></resume-viewer>
					</div>
				`
					: null
			}
		`;
	}
}

declare global {
	interface HTMLElementTagNameMap {
		"mobile-home-page": MobileHomePage;
	}
}

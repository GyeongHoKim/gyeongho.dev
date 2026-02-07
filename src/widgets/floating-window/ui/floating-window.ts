/**
 * Floating Window Widget
 *
 * Reusable window chrome: title bar, close/minimize/maximize,
 * drag, and slot for body content. Dispatches window-* events.
 */

import { LitElement, css, html } from "lit";
import { customElement, property, state } from "lit/decorators.js";

const WINDOW_CLOSE = "window-close";
const WINDOW_MINIMIZE = "window-minimize";
const WINDOW_MAXIMIZE = "window-maximize";
const WINDOW_SHOW = "window-show";
const WINDOW_HIDE = "window-hide";
/** Fired when the user interacts with the title bar (e.g. click/drag) so the host can bring this window to front. */
const WINDOW_FOCUS = "window-focus";
/** Fired while dragging so the host can update external positioning. */
const WINDOW_DRAG = "window-drag";

function dispatchWindowEvent(
	host: LitElement,
	eventName: string,
	detail?: unknown,
) {
	host.dispatchEvent(
		new CustomEvent(eventName, {
			detail: detail ?? {},
			bubbles: true,
			composed: true,
		}),
	);
}

@customElement("floating-window")
export class FloatingWindow extends LitElement {
	static styles = css`
		:host {
			display: block;
			pointer-events: none;
		}

		:host([hidden]) .window {
			display: none;
		}

		.window {
			background: #2d2d2d;
			border-radius: 8px;
			overflow: hidden;
			box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
			width: 800px;
			height: 500px;
			display: flex;
			flex-direction: column;
			pointer-events: auto;
			transition: width 0.2s ease, height 0.2s ease, border-radius 0.2s ease;
		}

		.window.maximized {
			width: 100vw;
			height: calc(100vh - 32px);
			border-radius: 0;
		}

		.title-bar {
			display: flex;
			align-items: center;
			justify-content: space-between;
			height: 36px;
			background: #383838;
			padding: 0 12px;
			user-select: none;
			cursor: grab;
		}

		.title-bar:active {
			cursor: grabbing;
		}

		.window.maximized .title-bar {
			cursor: default;
		}

		.title-bar-left {
			display: flex;
			align-items: center;
			gap: 8px;
		}

		.window-controls {
			display: flex;
			gap: 8px;
		}

		.window-control {
			width: 12px;
			height: 12px;
			border-radius: 50%;
			border: none;
			cursor: pointer;
		}

		.window-control.close {
			background: #ff5f56;
		}

		.window-control.close:hover {
			background: #ff3b30;
		}

		.window-control.minimize {
			background: #ffbd2e;
		}

		.window-control.minimize:hover {
			background: #f5a623;
		}

		.window-control.maximize {
			background: #27ca40;
		}

		.window-control.maximize:hover {
			background: #1db954;
		}

		.window-control:focus-visible {
			outline: 2px solid #fff;
			outline-offset: 2px;
		}

		.title {
			color: #ccc;
			font-size: 13px;
			position: absolute;
			left: 50%;
			transform: translateX(-50%);
		}

		.content {
			flex: 1;
			overflow: hidden;
			display: flex;
			flex-direction: column;
		}

		::slotted([slot="content"]) {
			flex: 1;
			min-height: 0;
			overflow: hidden;
		}
	`;

	/** Window title shown in the title bar. */
	@property({ type: String }) title = "";

	/** When true, the window frame is not displayed (dispatch window-hide when set to true). */
	@property({ type: Boolean, reflect: true }) hidden = false;

	@state() private isMaximized = false;
	@state() private posX = 0;
	@state() private posY = 0;
	private usesExternalPositioning = false;

	private isDragging = false;
	private dragStartX = 0;
	private dragStartY = 0;
	private dragStartPosX = 0;
	private dragStartPosY = 0;

	private handleDragMove = (e: MouseEvent) => {
		if (!this.isDragging) return;
		const deltaX = e.clientX - this.dragStartX;
		const deltaY = e.clientY - this.dragStartY;
		this.posX = this.dragStartPosX + deltaX;
		this.posY = this.dragStartPosY + deltaY;
		if (this.usesExternalPositioning) {
			dispatchWindowEvent(this, WINDOW_DRAG, { x: this.posX, y: this.posY });
		}
	};

	private handleDragEnd = () => {
		this.isDragging = false;
		document.body.style.userSelect = "";
		document.removeEventListener("mousemove", this.handleDragMove);
		document.removeEventListener("mouseup", this.handleDragEnd);
	};

	private _hasInitiallyShown = false;

	private resolveExternalPositioning(): boolean {
		const root = this.getRootNode();
		if (root instanceof ShadowRoot && root.host instanceof HTMLElement) {
			if (root.host.closest("[data-app-id]")) return true;
		}
		return Boolean(this.closest("[data-app-id]"));
	}

	override connectedCallback() {
		super.connectedCallback();
		this.usesExternalPositioning = this.resolveExternalPositioning();
	}

	override updated(changed: Map<string, unknown>) {
		if (changed.has("hidden")) {
			if (this.hidden) {
				dispatchWindowEvent(this, WINDOW_HIDE);
			} else {
				dispatchWindowEvent(this, WINDOW_SHOW);
			}
		}
	}

	protected override firstUpdated() {
		if (!this.hidden && !this._hasInitiallyShown) {
			this._hasInitiallyShown = true;
			dispatchWindowEvent(this, WINDOW_SHOW);
		}
	}

	override disconnectedCallback() {
		super.disconnectedCallback();
		document.removeEventListener("mousemove", this.handleDragMove);
		document.removeEventListener("mouseup", this.handleDragEnd);
	}

	private handleClose() {
		dispatchWindowEvent(this, WINDOW_CLOSE);
	}

	private handleMinimize() {
		dispatchWindowEvent(this, WINDOW_MINIMIZE);
	}

	private handleMaximize() {
		this.isMaximized = !this.isMaximized;
		if (this.isMaximized) {
			this.posX = 0;
			this.posY = 0;
			if (this.usesExternalPositioning) {
				dispatchWindowEvent(this, WINDOW_DRAG, { x: 0, y: 0 });
			}
		}
		dispatchWindowEvent(this, WINDOW_MAXIMIZE, { maximized: this.isMaximized });
	}

	private handleDragStart(e: MouseEvent) {
		if ((e.target as HTMLElement).closest(".window-controls")) return;
		if (this.isMaximized) return;
		this.isDragging = true;
		this.dragStartX = e.clientX;
		this.dragStartY = e.clientY;
		this.dragStartPosX = this.posX;
		this.dragStartPosY = this.posY;
		document.body.style.userSelect = "none";
		document.addEventListener("mousemove", this.handleDragMove);
		document.addEventListener("mouseup", this.handleDragEnd);
	}

	private handleWindowMouseDown(e: MouseEvent) {
		// Bring to front when clicking anywhere on the window (title or content)
		dispatchWindowEvent(this, WINDOW_FOCUS);
		// Title bar drag is handled in handleDragStart
		if ((e.target as HTMLElement).closest(".title-bar")) {
			this.handleDragStart(e);
		}
	}

	override render() {
		return html`
			<div
				class="window ${this.isMaximized ? "maximized" : ""}"
				style="${
					this.isMaximized || this.usesExternalPositioning
						? ""
						: `transform: translate(${this.posX}px, ${this.posY}px)`
				}"
				@mousedown=${this.handleWindowMouseDown}
			>
				<div class="title-bar">
					<div class="title-bar-left">
						<div class="window-controls">
							<button
								type="button"
								class="window-control close"
								@click=${this.handleClose}
								aria-label="Close"
							></button>
							<button
								type="button"
								class="window-control minimize"
								@click=${this.handleMinimize}
								aria-label="Minimize"
							></button>
							<button
								type="button"
								class="window-control maximize"
								@click=${this.handleMaximize}
								aria-label="${this.isMaximized ? "Restore" : "Maximize"}"
							></button>
						</div>
					</div>
					<span class="title">${this.title}</span>
					<div></div>
				</div>
				<div class="content">
					<slot name="content"></slot>
				</div>
			</div>
		`;
	}
}

declare global {
	interface HTMLElementTagNameMap {
		"floating-window": FloatingWindow;
	}
}

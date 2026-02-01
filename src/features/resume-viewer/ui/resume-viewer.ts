/**
 * Resume Viewer
 *
 * Displays the resume content after successful sudo + ./resume.
 */

import { LitElement, css, html } from "lit";
import { customElement } from "lit/decorators.js";
import "iconify-icon";
import "../../../widgets/markdown-renderer/ui/markdown-renderer.ts";
import resumeMarkdown from "../../../assets/resume.md?raw";

@customElement("resume-viewer")
export class ResumeViewer extends LitElement {
	static styles = css`
		:host {
			display: block;
		}

		.resume-window {
			background: #1e1e1e;
			border-radius: 12px;
			overflow: hidden;
			box-shadow: 0 16px 64px rgba(0, 0, 0, 0.6);
			max-width: 700px;
			max-height: 80vh;
		}

		.title-bar {
			display: flex;
			align-items: center;
			justify-content: space-between;
			height: 40px;
			background: #2d2d2d;
			padding: 0 16px;
		}

		.close-button {
			background: #ff5f56;
			border: none;
			width: 14px;
			height: 14px;
			border-radius: 50%;
			cursor: pointer;
		}

		.close-button:hover {
			background: #ff3b30;
		}

		.close-button:focus-visible {
			outline: 2px solid #fff;
			outline-offset: 2px;
		}

		.title {
			color: #ccc;
			font-size: 14px;
		}

		.content {
			padding: 32px;
			overflow-y: auto;
			max-height: calc(80vh - 40px);
		}

		.unlock-message {
			text-align: center;
			padding: 16px;
			background: linear-gradient(135deg, #2d5016 0%, #1e3a1e 100%);
			border-radius: 8px;
			margin-bottom: 24px;
		}

		.unlock-message span {
			color: #4ec9b0;
			font-weight: 600;
		}
	`;

	private handleClose(e: Event) {
		e.stopPropagation();
		this.dispatchEvent(new CustomEvent("close"));
	}

	render() {
		return html`
			<div class="resume-window" @click=${(e: Event) => e.stopPropagation()}>
				<div class="title-bar">
					<button class="close-button" @click=${this.handleClose} aria-label="Close resume viewer"></button>
					<span class="title">Resume - Unlocked</span>
					<div></div>
				</div>
				<div class="content">
					<div class="unlock-message">
						<iconify-icon icon="lucide:party-popper" width="20" height="20" style="color: #4ec9b0" aria-hidden="true"></iconify-icon>
						<span>Congratulations!</span> You've unlocked the secret resume!
					</div>
					<markdown-renderer .content=${resumeMarkdown}></markdown-renderer>
				</div>
			</div>
		`;
	}
}

declare global {
	interface HTMLElementTagNameMap {
		"resume-viewer": ResumeViewer;
	}
}

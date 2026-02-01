/**
 * Resume Viewer
 *
 * Displays the resume content after successful sudo + ./resume.
 */

import { LitElement, css, html } from "lit";
import { customElement } from "lit/decorators.js";
import "iconify-icon";

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
			color: #e0e0e0;
			font-family: "Segoe UI", "Cantarell", sans-serif;
			overflow-y: auto;
			max-height: calc(80vh - 40px);
		}

		.header {
			text-align: center;
			margin-bottom: 32px;
			border-bottom: 2px solid #3584e4;
			padding-bottom: 24px;
		}

		h1 {
			margin: 0 0 8px 0;
			font-size: 28px;
			font-weight: 600;
			color: #fff;
		}

		.subtitle {
			color: #9cdcfe;
			font-size: 16px;
		}

		.section {
			margin-bottom: 24px;
		}

		h2 {
			color: #4ec9b0;
			font-size: 18px;
			margin: 0 0 12px 0;
			border-bottom: 1px solid #333;
			padding-bottom: 8px;
		}

		p {
			margin: 0 0 12px 0;
			line-height: 1.6;
		}

		.skills-grid {
			display: grid;
			grid-template-columns: repeat(2, 1fr);
			gap: 8px 24px;
		}

		.skill {
			display: flex;
			align-items: center;
			gap: 8px;
		}

		.skill::before {
			content: "•";
			color: #3584e4;
		}

		.contact-list {
			list-style: none;
			padding: 0;
			margin: 0;
		}

		.contact-list li {
			margin-bottom: 8px;
			display: flex;
			align-items: center;
			gap: 8px;
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

					<div class="header">
						<h1>Gyeongho Kim</h1>
						<div class="subtitle">Software Engineer</div>
					</div>

					<div class="section">
						<h2>About</h2>
						<p>
							Passionate software engineer who loves building creative web
							experiences. Always exploring new technologies and pushing the
							boundaries of what's possible on the web.
						</p>
					</div>

					<div class="section">
						<h2>Skills</h2>
						<div class="skills-grid">
							<div class="skill">TypeScript / JavaScript</div>
							<div class="skill">React / Lit</div>
							<div class="skill">Node.js</div>
							<div class="skill">Python</div>
							<div class="skill">Web APIs</div>
							<div class="skill">Cloud Services</div>
						</div>
					</div>

					<div class="section">
						<h2>Contact</h2>
						<ul class="contact-list">
							<li>
								<iconify-icon icon="lucide:mail" width="16" height="16" style="color: #3584e4" aria-hidden="true"></iconify-icon>
								hello@gyeongho.dev
							</li>
							<li>
								<iconify-icon icon="lucide:link" width="16" height="16" style="color: #3584e4" aria-hidden="true"></iconify-icon>
								github.com/gyeongho
							</li>
						</ul>
					</div>
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

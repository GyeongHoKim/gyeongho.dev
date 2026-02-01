/**
 * Markdown Renderer Widget
 *
 * Renders markdown string as HTML using marked. Accepts content via property.
 */

import { LitElement, css, html } from "lit";
import { customElement, property } from "lit/decorators.js";
import { unsafeHTML } from "lit/directives/unsafe-html.js";
import { marked } from "marked";

@customElement("markdown-renderer")
export class MarkdownRenderer extends LitElement {
	static styles = css`
		:host {
			display: block;
		}

		.markdown-body {
			color: #e0e0e0;
			font-family: "Segoe UI", "Cantarell", sans-serif;
			line-height: 1.6;
		}

		.markdown-body h1 {
			margin: 0 0 8px 0;
			font-size: 28px;
			font-weight: 600;
			color: #fff;
		}

		.markdown-body h2 {
			color: #4ec9b0;
			font-size: 18px;
			margin: 24px 0 12px 0;
			border-bottom: 1px solid #333;
			padding-bottom: 8px;
		}

		.markdown-body h3 {
			color: #9cdcfe;
			font-size: 16px;
			margin: 16px 0 8px 0;
		}

		.markdown-body p {
			margin: 0 0 12px 0;
		}

		.markdown-body ul,
		.markdown-body ol {
			margin: 0 0 12px 0;
			padding-left: 24px;
		}

		.markdown-body li {
			margin-bottom: 4px;
		}

		.markdown-body strong {
			color: #fff;
			font-weight: 600;
		}

		.markdown-body a {
			color: #3584e4;
			text-decoration: none;
		}

		.markdown-body a:hover {
			text-decoration: underline;
		}

		.markdown-body em {
			color: #9cdcfe;
			font-style: italic;
		}
	`;

	@property({ type: String })
	content = "";

	private get renderedHtml(): string {
		if (!this.content) return "";
		return marked.parse(this.content, { gfm: true }) as string;
	}

	render() {
		return html` <div class="markdown-body">${unsafeHTML(this.renderedHtml)}</div> `;
	}
}

declare global {
	interface HTMLElementTagNameMap {
		"markdown-renderer": MarkdownRenderer;
	}
}

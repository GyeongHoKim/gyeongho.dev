# gyeongho.dev

## Commands

```bash
mise install
mise run dev
mise run ci
```

## Portfolio screens

Each project in `src/data/projects.json` can show a screen beside it on the Portfolio page.
Put the file in `src/assets/portfolio/` and name it in the project's `media`. No code changes.
A file name that does not exist fails the build.

A screenshot:

```json
"media": {
	"kind": "image",
	"src": "uxlint-report.png",
	"alt": { "ko": "UXLint가 만든 리포트 화면", "en": "A report written by UXLint" }
}
```

A screen recording (`poster` is optional; it plays muted, only while its card is in front):

```json
"media": {
	"kind": "video",
	"src": "fisheye-dewarping.mp4",
	"poster": "fisheye-dewarping.jpg",
	"label": { "ko": "화면 녹화 설명", "en": "What the recording shows" }
}
```

Other kinds:

- `flow`: a row of boxes from `flow` (`ko`, `en` lists), with the box at index `highlight` marked.
- `custom`: a hand-built panel. `component` names one registered in `src/components/portfolio/MediaFrame.astro` and listed in `CUSTOM_PANELS` in `src/lib/projects.ts`.
- No `media`: the "on its way" panel.

`address` sets the text in the screen's address bar and falls back to the project name.

## Agent Skills (project scope, `.claude/skills/`)

- ghds
- find-docs
- modern-web-guidance
- astro
- terraform-style-guide
- terraform-search-import
- deployments-cicd
- env-vars
- vercel-cli

## MCP servers (`.mcp.json`)

- serena
- astro-docs

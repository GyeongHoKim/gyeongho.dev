# gyeongho.dev

## Commands

```bash
mise install
mise run dev
mise run ci
```

## Writing posts

Start a post with `pnpm new:post <slug>`.

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

### Animated screens

The animations are [HyperFrames](https://hyperframes.heygen.com) projects in `videos/`, one folder per screen, named after the file it produces. To change one, edit its `index.html`, then render and compress it:

```sh
cd videos/media-server
pnpm exec hyperframes render --output /tmp/media-server.mp4
ffmpeg -i /tmp/media-server.mp4 -c:v libx264 -crf 24 -preset slow -pix_fmt yuv420p -movflags +faststart -an ../../src/assets/portfolio/media-server.mp4
ffmpeg -ss 9.5 -i /tmp/media-server.mp4 -frames:v 1 -q:v 4 ../../src/assets/portfolio/media-server.jpg
```

Two screens are built from browser captures instead: `videos/gitea-pull-requests/` and `videos/ids-storybook/` hold the PNGs and a `build.sh` that writes the video and its poster. Replace a capture and run the script.

Biome skips `videos/` because its formatter breaks the whitespace the terminal and code blocks rely on.

The road footage in `cam.mp4` is cut from [Gau-Bischofsheim - Eine Minute an der L 415](https://commons.wikimedia.org/wiki/File:Gau-Bischofsheim_-_Eine_Minute_an_der_L_415.webm) on Wikimedia Commons (CC0).

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

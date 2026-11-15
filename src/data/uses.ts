import type { Locale } from "../i18n";

export interface UsesItem {
	name: string;
	note: Record<Locale, string>;
}
export interface UsesGroup {
	title: string;
	items: UsesItem[];
}
export interface HomelabNode {
	name: Record<Locale, string>;
	role: string;
	note: Record<Locale, string>;
	status: "up" | "idle";
}

const same = (text: string): Record<Locale, string> => ({ ko: text, en: text });

export const usesGroups: UsesGroup[] = [
	{
		title: "Terminal & shell",
		items: [
			{
				name: "WezTerm · Alacritty",
				note: {
					ko: "터미널. 글꼴은 JetBrainsMono Nerd Font",
					en: "Terminals. The font is JetBrainsMono Nerd Font",
				},
			},
			{
				name: "zsh + Oh My Zsh",
				note: {
					ko: "fino-time 테마, git·z 플러그인",
					en: "fino-time theme, git and z plugins",
				},
			},
			{
				name: "tmux",
				note: {
					ko: "vi key binding, tpm으로 resurrect·continuum",
					en: "vi key bindings, resurrect and continuum through tpm",
				},
			},
			{
				name: "zoxide · fzf",
				note: {
					ko: "디렉터리 이동과 fuzzy search",
					en: "Directory jumping and fuzzy search",
				},
			},
			{
				name: "ripgrep · fd · bat",
				note: {
					ko: "grep, find, cat 대신 쓰는 것들",
					en: "What I use instead of grep, find and cat",
				},
			},
		],
	},
	{
		title: "Editor",
		items: [
			{
				name: "Neovim (LazyVim)",
				note: {
					ko: "kanagawa-wave 테마. v 한 글자로 띄웁니다",
					en: "kanagawa-wave theme. One letter, v, launches it",
				},
			},
			{
				name: "LazyVim extras",
				note: {
					ko: "Go, TypeScript, Tailwind, Biome formatter",
					en: "Go, TypeScript, Tailwind, Biome formatter",
				},
			},
			{
				name: "tinygo.nvim",
				note: {
					ko: "TinyGo target을 에디터 안에서 바꿉니다",
					en: "Switches the TinyGo target inside the editor",
				},
			},
			{
				name: "VSCodium",
				note: {
					ko: "Linux·macOS에서 쓰는 editor",
					en: "The editor I use on Linux and macOS",
				},
			},
			{
				name: "Agent Skills",
				note: {
					ko: "AI 코딩 에이전트용 스킬도 dotfiles로 같이 설치합니다",
					en: "Skills for AI coding agents are installed with the dotfiles too",
				},
			},
		],
	},
	{
		title: "Languages & runtimes (mise)",
		items: [
			{ name: "Node.js", note: same("LTS") },
			{ name: "Bun", note: same("latest") },
			{ name: "Go", note: same("latest") },
			{ name: "Rust", note: same("latest") },
			{ name: "Python", note: same("latest, Poetry") },
		],
	},
	{
		title: "Infra & CLI",
		items: [
			{ name: "Docker", note: { ko: "컨테이너", en: "Containers" } },
			{
				name: "kubectl · Helm",
				note: {
					ko: "kubectl은 k로 줄여 씁니다",
					en: "I shorten kubectl to k",
				},
			},
			{
				name: "Terraform",
				note: { ko: "인프라 프로비저닝", en: "Infrastructure provisioning" },
			},
			{
				name: "Git · GitHub CLI · lazygit",
				note: { ko: "터미널에서 하는 Git", en: "Git from the terminal" },
			},
			{
				name: "go-task",
				note: {
					ko: "task runner. task로 부릅니다",
					en: "Task runner. I call it as task",
				},
			},
			{
				name: "glow",
				note: {
					ko: "터미널에서 Markdown 읽기",
					en: "Reading Markdown in the terminal",
				},
			},
			{
				name: "FFmpeg",
				note: { ko: "영상 변환과 확인", en: "Converting and inspecting video" },
			},
			{
				name: "Tailscale",
				note: {
					ko: "Linux 기기를 한 네트워크로",
					en: "Putting Linux machines on one network",
				},
			},
		],
	},
	{
		title: "Desktop apps",
		items: [
			{ name: "Brave", note: { ko: "브라우저", en: "Browser" } },
			{ name: "Obsidian", note: { ko: "노트", en: "Notes" } },
			{ name: "OBS Studio", note: { ko: "화면 녹화", en: "Screen recording" } },
			{ name: "VLC", note: { ko: "영상 재생", en: "Video playback" } },
			{ name: "GIMP", note: { ko: "이미지 편집", en: "Image editing" } },
			{ name: "Blender", note: same("3D") },
			{ name: "Insomnia", note: { ko: "API 테스트", en: "API testing" } },
			{
				name: "Meld · DB Browser for SQLite",
				note: {
					ko: "파일 비교와 SQLite 뷰어",
					en: "File diffs and a SQLite viewer",
				},
			},
		],
	},
];

export const homelabNodes: HomelabNode[] = [
	{
		name: same("Beelink"),
		role: "k3s master",
		note: {
			ko: "Gitea · Penpot. 가끔 toy project 서버로도 씁니다",
			en: "Gitea and Penpot. Sometimes a toy project server too",
		},
		status: "up",
	},
	{
		name: same("Raspberry Pi 4"),
		role: "k3s agent",
		note: same("Action runner"),
		status: "up",
	},
	{
		name: same("Raspberry Pi 3"),
		role: "NVR",
		note: { ko: "카메라 영상 녹화", en: "Records camera video" },
		status: "idle",
	},
	{
		name: { ko: "GMKtec 미니 PC", en: "GMKtec mini PC" },
		role: "dev machine",
		note: {
			ko: "mosh로 접속해서 LazyVim으로 개발합니다",
			en: "I connect with mosh and develop in LazyVim",
		},
		status: "up",
	},
];

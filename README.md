# gyeongho.dev — Personal Website Terminal Game

A personal website presented as a Gnome Fedora Workstation-style desktop with an interactive terminal game.

## 🎮 How to Play

1. **Visit the site** and click "Activities" to open the menu
2. **Open the Terminal** from the Applications menu
3. **Explore** the virtual filesystem using Linux commands:
   - `ls` - list directory contents
   - `cd` - change directory
   - `pwd` - print working directory
   - `cat` - display file contents
   - `help` - show available commands
4. **Find the hint**: Navigate to find the README file containing a special hint (1116)
5. **Unlock the resume**: From root (`/`), run `sudo ./resume` and enter the password `1116`
6. **Victory!** View the unlocked resume

## 🚀 Development

```bash
# Install dependencies
pnpm install

# Start development server
pnpm run dev

# Run quality checks
pnpm run format && pnpm run lint && pnpm run typecheck

# Run tests
pnpm run test
```

## 📁 Project Structure (Feature Sliced Design)

```
src/
├── app/                    # App entry and routing
├── pages/desktop/          # Desktop page
├── widgets/
│   ├── menu/              # Activities menu
│   └── terminal/          # xterm.js terminal
├── features/
│   └── resume-viewer/     # Resume display after unlock
├── entities/
│   ├── virtual-filesystem/ # Virtual FS entities
│   └── session/           # Session state
└── shared/                # Shared utilities
```

---

<h2 align="center">👋 Hello! I'm GyeongHo Kim</h2>
<p align="center"><em>My name is 徑昊 and it means <strong>The one who knows the right way</strong></em></p>
<p align="center">
  <a href="https://blog.gyeongho.dev">Blog</a> •
  <a href="https://www.linkedin.com/in/gyeonghokim2017/">LinkedIn</a> •
  <a href="mailto:gyeongho.dev@proton.me">Email</a>
</p>

- 💼 Currently working on [IDIS](https://www.idisglobal.com/?lang=EN&country=IDIS), building EVERYTHING of ids(iNEX Design System Components)
- 💬 Ask me about **Live Streaming Protocols, WebGPU, and WebAssembly**
- 🏹 I enjoy Korean archery!
- I love terminal and use [LazyVim](https://www.lazyvim.org/) IDE.

## 🛠️ Tech Stack

### Languages

![Go](https://img.shields.io/badge/Go-00ADD8?style=flat&logo=go&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat&logo=typescript&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat&logo=javascript&logoColor=black)

### I Love

![FFmpeg](https://img.shields.io/badge/FFmpeg-007808?style=flat&logo=ffmpeg&logoColor=white)
![Gin](https://img.shields.io/badge/Gin-00ADD8?style=flat&logo=go&logoColor=white)
![WebComponents](https://img.shields.io/badge/WebComponents-4A90E2?style=flat&logo=html5&logoColor=white)
![Lit](https://img.shields.io/badge/Lit-324FFF?style=flat&logo=lit&logoColor=white)
![React](https://img.shields.io/badge/React-61DAFB?style=flat&logo=react&logoColor=black)
![Storybook](https://img.shields.io/badge/Storybook-FF4785?style=flat&logo=storybook&logoColor=white)
![Terraform](https://img.shields.io/badge/Terraform-7B42BC?style=flat&logo=terraform&logoColor=white)
![Cypress](https://img.shields.io/badge/Cypress-17202C?style=flat&logo=cypress&logoColor=white)
![Jenkins](https://img.shields.io/badge/Jenkins-D24939?style=flat&logo=jenkins&logoColor=white)
![DroneCI](https://img.shields.io/badge/DroneCI-212121?style=flat&logo=drone&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=flat&logo=docker&logoColor=white)
![RTSP](https://img.shields.io/badge/RTSP-FF6B6B?style=flat&logo=youtube&logoColor=white)
![WebRTC](https://img.shields.io/badge/WebRTC-333333?style=flat&logo=webrtc&logoColor=white)
![HLS](https://img.shields.io/badge/HLS-FF6B6B?style=flat&logo=apple&logoColor=white)

## 💻 Configurations of my machine

[Canonical GyeongHo](https://github.com/GyeongHoKim/dotfiles)

## 🏠 HomeLab

🤓 I have my HomeLab which includes...

- NVR, Onvif compatible
- IP Camera
- Headscale VPN control server
- DNS server
- Drone CI server
- Gitea Server
- K3S Control Plane Server and Agent Servers for my toy projects

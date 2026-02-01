**GyeongHo Kim**

Full-Stack Video Streaming Engineer

(+82) 010-3812-5469 | gyeongho.dev@proton.me  
https://gyeongho.dev | https://blog.gyeongho.dev

**PROFESSIONAL SUMMARY**

Specialized full-stack engineer architecting end-to-end video streaming solutions with expertise in WebAssembly, video streaming protocols (RTSP, WebRTC, WebSocket, WebTransport, HTTP), and modern web technologies. Proven track record of delivering high-performance media streaming systems and contributing to open-source communities.

**CORE COMPETENCIES**

* Video Streaming Protocols: RTSP, HLS, LL-HLS, WebRTC, WebTransport, WebSocket  
* WebAssembly Development: Custom decoders (AVC, HEVC) utilizing x264, x265, AVCodec  
* Open Source Contributions: Enhanced RTSP client libraries (Yellowstone, VDK)  
* Frontend Architecture: Design System development with Storybook, automated regression testing  
* DevOps & Automation: CI/CD pipelines (npm), Jenkins automation, test orchestration

**EXPERIENCE**

**Web Engineer** | IDIS, Pangyo

*July 2023 \- Present*

**Foundation Libraries & Infrastructure**

Architected and deployed 8 core libraries serving multiple frontend development teams:

* @ids/web-components \- Design System with automated regression testing  
* @ids/inex-video-player \- WebGPU/WebGL video rendering engine  
* @ids/inex-wasm-decoder \- High-performance WebAssembly decoder  
* @ids/event-emitter \- Event-driven pub/sub architecture  
* @ids/deferred \- External promise resolution utility  
* @ids/inex-http-client \- iNEX Solution Suite API client  
* @ids/inex-react-http-client \- React state management wrapper  
* @ids/eslint, @ids/ts-config \- Coding convention enforcement  
* @ids/jenkins \- CI/CD pipeline automation

**Media Infrastructure & Solutions**

* Engineered media server transforming RTSP streams to multiple protocols (WebSocket/WebTransport/HLS/WebRTC)  
* Delivered Map UI WebApp featuring real-time vehicle tracking synchronized with NVR video feeds  
* Implemented authentication system (login/logout) across multiple web applications

**PROJECTS**

**iNEX Video Player & WebAssembly Decoder**

*February 2024 \- Present*

**Technologies:** TypeScript, Go, WebAssembly (Emscripten), C++

Engineered comprehensive video streaming solution enabling RTSP playback in web browsers.

**Achievements:**

* Designed INEXVideoPlayer interface with 4 implementation strategies (Canvas/Video × WebCodecs/WebAssembly)  
* Built custom WebAssembly decoders for AVC/HEVC codecs using x264, x265, AVCodec with Emscripten  
* Architected 3-tier Web Worker system: Command processing & NALu buffer reception, YUV buffer decoding, WebGPU/WebGL2 rendering pipeline  
* Developed Media Server extracting AV from RTP, serving via HTTP (HLS/DASH), WebSocket, and WebTransport  
* Deployed to 5+ SI WebApps, enabling production video rendering capabilities

**Clip Archive Service**

*May 2024 \- Present*

**Technologies:** React, TanStack Query, React Router, FSD Architecture | Gin, VDK, FFmpeg C bindings

Enterprise solution for managing mobile video recorder (MVR) footage from depot-based buses.

**Achievements:**

* Developed full-stack web interface (dashboard, clip management, health monitoring, settings)  
* Built Media Server streaming video and GPS data to web clients  
* Contributed to open-source libraries, resolving race conditions and RTP payload parsing issues  
* Implemented robust UX patterns: Optimistic UI updates, Error Boundaries, lazy loading fallbacks  
* Enabled clip creation (up to 2 hours), status tracking, metadata management (tags/comments)  
* Integrated Google Maps for historical vehicle tracking and log visualization

**GIS Tracking Service**

*February 2024 \- Present*

Real-time location tracking and monitoring platform for construction sites and infrastructure management.

**Achievements:**

* Deployed to domestic and international clients (construction companies, local governments)  
* Customized solutions: Water level sensors, remote circuit breaker control, construction blueprint overlay, vehicle/helicopter tracking  
* Integrated multiple mapping SDKs (Google Maps, OpenLayers, Kakao Maps)  
* Contributed to open-source map SDK web component wrappers  
* Optimized multi-stream video performance for resource-constrained environments (low memory/CPU)

**RECOGNITION**

**Google Developer Students Clubs Hackathon** | Grand Prize

*December 2023*

Led full-stack development for AI-powered interview preparation platform (1 designer, 2 ML engineers, 1 developer).

**Technical Implementation:**

* Orchestrated Google Cloud infrastructure (GCR for Docker, GKE for containers, GCS for storage)  
* Developed RESTful APIs and authentication system using Nest.js  
* Built Flask-based ML model APIs supporting speech-to-text and AI interview generation  
* Integrated OpenAI for question generation and Google Speech-to-Text for video transcription

**EDUCATION**

**Hanyang University, Seoul** | Bachelor's Degree

*March 2018 \- February 2024*

Double Major in Electronics Engineering & Big Data Analytics

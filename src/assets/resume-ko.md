**김경호**

풀스택 비디오 스트리밍 엔지니어

(+82) 010-3812-5469 | gyeongho.dev@proton.me  
https://gyeongho.dev | https://blog.gyeongho.dev

**프로필 요약**

WebAssembly, 비디오 스트리밍 프로토콜(RTSP, WebRTC, WebSocket, WebTransport, HTTP), 현대 웹 기술에 대한 전문 지식을 바탕으로 엔드투엔드 비디오 스트리밍 솔루션을 설계하는 풀스택 엔지니어. 고성능 미디어 스트리밍 시스템 제공 및 오픈소스 커뮤니티 기여 실적 보유.

**핵심 역량**

* 비디오 스트리밍 프로토콜: RTSP, HLS, LL-HLS, WebRTC, WebTransport, WebSocket  
* WebAssembly 개발: x264, x265, AVCodec을 활용한 커스텀 디코더(AVC, HEVC)  
* 오픈소스 기여: RTSP 클라이언트 라이브러리 개선(Yellowstone, VDK)  
* 프론트엔드 아키텍처: Storybook을 활용한 디자인 시스템, 자동화 회귀 테스트  
* DevOps 및 자동화: CI/CD 파이프라인(npm), Jenkins 자동화, 테스트 오케스트레이션

**경력**

**웹 엔지니어** | IDIS, 판교

*2023년 7월 \- 현재*

**기반 라이브러리 및 인프라**

다수의 프론트엔드 개발팀을 지원하는 8개 핵심 라이브러리 설계 및 배포:

* @ids/web-components \- 자동화 회귀 테스트가 포함된 디자인 시스템  
* @ids/inex-video-player \- WebGPU/WebGL 비디오 렌더링 엔진  
* @ids/inex-wasm-decoder \- 고성능 WebAssembly 디코더  
* @ids/event-emitter \- 이벤트 기반 pub/sub 아키텍처  
* @ids/deferred \- 외부 프로미스 해결 유틸리티  
* @ids/inex-http-client \- iNEX Solution Suite API 클라이언트  
* @ids/inex-react-http-client \- React 상태 관리 래퍼  
* @ids/eslint, @ids/ts-config \- 코딩 규약 적용  
* @ids/jenkins \- CI/CD 파이프라인 자동화

**미디어 인프라 및 솔루션**

* RTSP 스트림을 다중 프로토콜(WebSocket/WebTransport/HLS/WebRTC)로 변환하는 미디어 서버 구축  
* NVR 비디오 피드와 동기화된 실시간 차량 추적 기능을 갖춘 Map UI 웹앱 제공  
* 다수의 웹 애플리케이션에 걸친 인증 시스템(로그인/로그아웃) 구현

**프로젝트**

**iNEX Video Player & WebAssembly Decoder**

*2024년 2월 \- 현재*

**기술:** TypeScript, Go, WebAssembly (Emscripten), C++

웹 브라우저에서 RTSP 재생을 가능하게 하는 종합 비디오 스트리밍 솔루션 구축.

**성과:**

* 4가지 구현 전략(Canvas/Video × WebCodecs/WebAssembly)을 갖춘 INEXVideoPlayer 인터페이스 설계  
* x264, x265, AVCodec with Emscripten을 사용한 AVC/HEVC 코덱용 커스텀 WebAssembly 디코더 구축  
* 3단계 Web Worker 시스템 설계: 명령 처리 및 NALu 버퍼 수신, YUV 버퍼 디코딩, WebGPU/WebGL2 렌더링 파이프라인  
* RTP에서 AV를 추출하여 HTTP(HLS/DASH), WebSocket, WebTransport로 제공하는 미디어 서버 개발  
* 5개 이상 SI 웹앱에 배포, 프로덕션 비디오 렌더링 역량 제공

**Clip Archive Service**

*2024년 5월 \- 현재*

**기술:** React, TanStack Query, React Router, FSD 아키텍처 | Gin, VDK, FFmpeg C 바인딩

차고 기반 버스의 모바일 비디오 레코더(MVR) 영상 관리를 위한 엔터프라이즈 솔루션.

**성과:**

* 풀스택 웹 인터페이스 개발(대시보드, 클립 관리, 상태 모니터링, 설정)  
* 비디오 및 GPS 데이터를 웹 클라이언트에 스트리밍하는 미디어 서버 구축  
* 레이스 컨디션 및 RTP 페이로드 파싱 이슈 해결을 위한 오픈소스 라이브러리 기여  
* 낙관적 UI 업데이트, Error Boundaries, 지연 로딩 폴백 등 견고한 UX 패턴 구현  
* 최대 2시간 클립 생성, 상태 추적, 메타데이터 관리(태그/댓글) 지원  
* Google Maps 연동을 통한 차량 이력 추적 및 로그 시각화

**GIS Tracking Service**

*2024년 2월 \- 현재*

건설 현장 및 인프라 관리를 위한 실시간 위치 추적 및 모니터링 플랫폼.

**성과:**

* 국내외 클라이언트(건설사, 지자체)에 배포  
* 맞춤 솔루션: 수위 센서, 원격 차단기 제어, 건설 청사진 오버레이, 차량/헬리콥터 추적  
* 다중 맵 SDK 통합(Google Maps, OpenLayers, Kakao Maps)  
* 오픈소스 맵 SDK 웹 컴포넌트 래퍼 기여  
* 리소스 제약 환경(저메모리/저CPU)에서 멀티 스트림 비디오 성능 최적화

**수상**

**Google Developer Students Clubs Hackathon** | 대상

*2023년 12월*

AI 기반 면접 준비 플랫폼 풀스택 개발 주도(디자이너 1명, ML 엔지니어 2명, 개발자 1명).

**기술 구현:**

* Google Cloud 인프라 구성(GCR for Docker, GKE for containers, GCS for storage)  
* Nest.js 기반 RESTful API 및 인증 시스템 개발  
* 음성-텍스트 변환 및 AI 면접 생성 지원 Flask ML 모델 API 구축  
* 질문 생성을 위한 OpenAI, 비디오 전사용 Google Speech-to-Text 연동

**학력**

**한양대학교, 서울** | 학사

*2018년 3월 \- 2024년 2월*

전자공학 및 빅데이터분석학 복수전공

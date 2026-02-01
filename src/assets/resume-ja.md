**キム・ギョンホ (GyeongHo Kim)**

フルスタック・ビデオストリーミングエンジニア

(+82) 010-3812-5469 | gyeongho.dev@proton.me  
https://gyeongho.dev | https://blog.gyeongho.dev

**プロフィール概要**

WebAssembly、ビデオストリーミングプロトコル（RTSP、WebRTC、WebSocket、WebTransport、HTTP）、モダンWeb技術に関する専門知識を持ち、エンドツーエンドのビデオストリーミングソリューションを設計するフルスタックエンジニア。高性能メディアストリーミングシステムの提供およびオープンソースコミュニティへの貢献実績あり。

**コアコンピテンシー**

* ビデオストリーミングプロトコル: RTSP、HLS、LL-HLS、WebRTC、WebTransport、WebSocket  
* WebAssembly開発: x264、x265、AVCodecを活用したカスタムデコーダ（AVC、HEVC）  
* オープンソース貢献: RTSPクライアントライブラリの強化（Yellowstone、VDK）  
* フロントエンドアーキテクチャ: Storybookを用いたデザインシステム、自動回帰テスト  
* DevOps・自動化: CI/CDパイプライン（npm）、Jenkins自動化、テストオーケストレーション

**経歴**

**Webエンジニア** | IDIS、板橋

*2023年7月 \- 現在*

**基盤ライブラリとインフラ**

複数のフロントエンド開発チーム向けに8つのコアライブラリを設計・デプロイ:

* @ids/web-components \- 自動回帰テスト付きデザインシステム  
* @ids/inex-video-player \- WebGPU/WebGLビデオレンダリングエンジン  
* @ids/inex-wasm-decoder \- 高性能WebAssemblyデコーダ  
* @ids/event-emitter \- イベント駆動pub/subアーキテクチャ  
* @ids/deferred \- 外部Promise解決ユーティリティ  
* @ids/inex-http-client \- iNEX Solution Suite APIクライアント  
* @ids/inex-react-http-client \- React状態管理ラッパー  
* @ids/eslint、@ids/ts-config \- コーディング規約の適用  
* @ids/jenkins \- CI/CDパイプライン自動化

**メディアインフラとソリューション**

* RTSPストリームを複数プロトコル（WebSocket/WebTransport/HLS/WebRTC）に変換するメディアサーバーを構築  
* NVRビデオフィードと同期したリアルタイム車両追跡機能を備えたMap UI WebAppを提供  
* 複数Webアプリケーションにわたる認証システム（ログイン/ログアウト）を実装

**プロジェクト**

**iNEX Video Player & WebAssembly Decoder**

*2024年2月 \- 現在*

**技術:** TypeScript、Go、WebAssembly（Emscripten）、C++

WebブラウザでRTSP再生を可能にする総合ビデオストリーミングソリューションを構築。

**実績:**

* 4つの実装戦略（Canvas/Video × WebCodecs/WebAssembly）を持つINEXVideoPlayerインターフェースを設計  
* x264、x265、AVCodec with Emscriptenを用いたAVC/HEVCコーデック用カスタムWebAssemblyデコーダを構築  
* 3層Web Workerシステムを設計: コマンド処理・NALuバッファ受信、YUVバッファデコード、WebGPU/WebGL2レンダリングパイプライン  
* RTPからAVを抽出しHTTP（HLS/DASH）、WebSocket、WebTransportで配信するメディアサーバーを開発  
* 5以上のSI WebAppにデプロイし、本番ビデオレンダリング機能を提供

**Clip Archive Service**

*2024年5月 \- 現在*

**技術:** React、TanStack Query、React Router、FSDアーキテクチャ | Gin、VDK、FFmpeg Cバインディング

車庫ベースのバスからのモバイルビデオレコーダー（MVR）映像管理のためのエンタープライズソリューション。

**実績:**

* フルスタックWebインターフェースを開発（ダッシュボード、クリップ管理、ヘルスモニタリング、設定）  
* ビデオとGPSデータをWebクライアントにストリーミングするメディアサーバーを構築  
* レースコンディションおよびRTPペイロードパース問題の解消にオープンソースライブラリへ貢献  
* Optimistic UI更新、Error Boundaries、遅延ロードフォールバックなど堅牢なUXパターンを実装  
* 最大2時間のクリップ作成、ステータス追跡、メタデータ管理（タグ/コメント）を実現  
* Google Maps連携による車両履歴追跡とログ可視化

**GIS Tracking Service**

*2024年2月 \- 現在*

建設現場およびインフラ管理のためのリアルタイム位置追跡・モニタリングプラットフォーム。

**実績:**

* 国内外クライアント（建設会社、自治体）にデプロイ  
* カスタムソリューション: 水位センサー、遠隔遮断器制御、建設青図オーバーレイ、車両/ヘリコプター追跡  
* 複数マップSDK統合（Google Maps、OpenLayers、Kakao Maps）  
* オープンソースマップSDK Webコンポーネントラッパーへ貢献  
* リソース制約環境（低メモリ/低CPU）でのマルチストリームビデオパフォーマンスを最適化

**受賞**

**Google Developer Students Clubs Hackathon** | 大賞

*2023年12月*

AI面接準備プラットフォームのフルスタック開発を主導（デザイナー1名、MLエンジニア2名、開発者1名）。

**技術実装:**

* Google Cloudインフラを構築（GCR for Docker、GKE for containers、GCS for storage）  
* Nest.jsによるRESTful APIおよび認証システムを開発  
* 音声テキスト変換およびAI面接生成をサポートするFlask MLモデルAPIを構築  
* 質問生成のためのOpenAI、ビデオ文字起こしのためのGoogle Speech-to-Textを統合

**学歴**

**漢陽大学校、ソウル** | 学士

*2018年3月 \- 2024年2月*

電子工学・ビッグデータ分析学 複数専攻

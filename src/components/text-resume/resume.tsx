import { FileText, Github, Globe, Mail, Phone } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ThreeCanvas from "@/components/three-resume/three-canvas";
import { useState } from "react";
import { BottomNav } from "@/components/text-resume";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card.tsx";

export function Resume() {
  const [activeTab, setActiveTab] = useState("skills");

  return (
    <>
      <div className="flex flex-col min-h-screen bg-background text-foreground pb-[76px] sm:pb-0">
        <header className="p-4 md:p-6 bg-primary text-primary-foreground">
          <div className="container mx-auto">
            <h1 className="text-2xl md:text-3xl font-bold">GyeongHo Kim</h1>
            <p className="text-lg md:text-xl">
              building A to Z of Video Streaming WebAPP
            </p>
            <div className="flex flex-wrap items-center mt-2 md:space-x-4 sm:space-x-0">
              <a
                href="mailto:gyeongho.dev@proton.me"
                className="flex items-center mr-4 md:mr-0"
              >
                <Mail className="w-4 h-4 mr-2" />
                <span className="hidden md:inline">gyeongho.dev@proton.me</span>
              </a>
              <a
                href="tel:+821038125469"
                className="flex items-center mr-4 md:mr-0"
              >
                <Phone className="w-4 h-4 mr-2" />
                <span className="hidden md:inline">(+82) 10-3812-5469</span>
              </a>
              <a
                href="https://github.com/gyeonghokim"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center mr-4 md:mr-0"
              >
                <Github className="w-4 h-4 mr-2" />
                <span className="hidden md:inline">GitHub</span>
              </a>
              <a
                href="https://blog.gyeongho.dev"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center mr-4 md:mr-0"
              >
                <Globe className="w-4 h-4 mr-2" />
                <span className="hidden md:inline">Blog</span>
              </a>
              <a
                href="/Resume.pdf"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center"
              >
                <FileText className="w-4 h-4 mr-2" />
                <span className="hidden md:inline">PDF</span>
              </a>
            </div>
          </div>
        </header>

        <div className="flex-grow pb-16 md:pb-0">
          <Tabs
            defaultValue="skills"
            className="w-full"
            value={activeTab}
            onValueChange={setActiveTab}
          >
            <nav className="bg-secondary hidden sm:block">
              <div className="container mx-auto">
                <TabsList className="hidden md:grid w-full grid-cols-6">
                  <TabsTrigger aria-label="skills" value="skills">
                    Skills
                  </TabsTrigger>
                  <TabsTrigger aria-label="experience" value="experience">
                    Experience
                  </TabsTrigger>
                  <TabsTrigger aria-label="projects" value="projects">
                    Projects
                  </TabsTrigger>
                  <TabsTrigger aria-label="awards" value="awards">
                    Awards
                  </TabsTrigger>
                  <TabsTrigger aria-label="education" value="education">
                    Education
                  </TabsTrigger>
                  <TabsTrigger
                    className="overflow-ellipsis"
                    aria-label="employee card"
                    value="employee card"
                  >
                    Employee Card
                  </TabsTrigger>
                </TabsList>
              </div>
            </nav>

            <main className="container mx-auto py-6">
              <TabsContent value="skills">
                <Card>
                  <CardHeader>
                    <CardTitle>Skills</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="list-disc pl-5 space-y-2">
                      <li>
                        Video Streaming System(RTSP, HLS, LL-HLS, WebRTC,
                        WebTransport, WebSocket)
                      </li>
                      <li>
                        Web Assembly Decoder(AVC, HEVC) using x264, x265,
                        AVCodec
                      </li>
                      <li>
                        Open Source contribution to RTSP Client
                        libraries(Yellowstone, VDK)
                      </li>
                      <li>
                        Building Design System Web Component library with
                        Storybook, Regression test
                      </li>
                      <li>
                        CI(Test Automation)/CD(npm), several automated
                        pipelines(Jenkins)
                      </li>
                    </ul>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="experience">
                <Card>
                  <CardHeader>
                    <CardTitle>Experience</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-lg font-semibold">
                          IDIS, Pangyo
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          Web Engineer | July 2023 - PRESENT
                        </p>
                        <ul className="list-disc pl-5 mt-2 space-y-1">
                          <li>
                            Deployed foundation libraries for our frontend
                            developers
                            <ul className="list-disc pl-5 mt-1 space-y-1">
                              <li>
                                Web Component Design System library with
                                automated regression test,{" "}
                                <code>@ids/web-components</code>
                              </li>
                              <li>
                                WebGPU/WebGL Video Player library,{" "}
                                <code>@ids/inex-video-player</code>
                              </li>
                              <li>
                                WebAssembly Decoder library,{" "}
                                <code>@ids/inex-wasm-decoder</code>
                              </li>
                              <li>
                                Event pub/sub library,{" "}
                                <code>@ids/event-emitter</code>
                              </li>
                              <li>
                                External promise resolving library,{" "}
                                <code>@ids/deferred</code>
                              </li>
                              <li>
                                iNEX Solution Suite Client's API Client library,{" "}
                                <code>@ids/inex-http-client</code>
                              </li>
                              <li>
                                State library for React users{" "}
                                <code>@ids/inex-react-http-client</code>
                              </li>
                              <li>
                                Config libraries for iNEX coding convention,{" "}
                                <code>@ids/eslint</code>,{" "}
                                <code>@ids/ts-config</code>
                              </li>
                              <li>
                                Jenkins pipelines, <code>@ids/jenkins</code>
                              </li>
                            </ul>
                          </li>
                          <li>
                            Build Media Server(RTSP -&gt;
                            WebSocket/WebTransport/HLS/WebRTC)
                          </li>
                          <li>
                            Map UI's WebAPP solutions that track the vehicle
                            with real-time video with its NVR
                          </li>
                          <li>Introduced login/logout feature for WebAPPs.</li>
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="projects">
                <div className="space-y-6">
                  {[
                    {
                      title: "iNEX Video Player & iNEX WebAssembly Decoder",
                      date: "Feb 2023 - PRESENT",
                      description:
                        "Libraries for displaying RTSP video streams on WebAPPs.",
                      technologies:
                        "Typescript, Go, WebAssembly(Emscripten)",
                      achievements: [
                        "Developed INEXVideoPlayer interface(Play, Pause, Seek, Stop) and 4 impl objects(Canvas/Video * WebCodecs/WebAssembly)",
                        "Build WebAssembly Decoder(AVC, HEVC) with x264, x265, AVCodecs, Emscripten(C++)",
                        "3 Web Workers: send commands & receive NALu buffer, decode to YUV buffer, render using WebGPU or WebGL2",
                        "Build Media Server which extracts AV from RTP and serves AV to WebAPPs with http(HLS,DASH), websocket and webtransport.",
                        "5+ Our SI WebAPPs use this library to render videos on their WebAPP.",
                      ],
                    },
                    {
                      title: "Clip Archive Service",
                      date: "May 2023 - PRESENT",
                      description:
                        "When buses equipped with MVR reach the depot, recorded videos are uploaded to a recording server. The system allows users to check the status of the recorder, search, manage, and create short clips under 2 Hours via the web interface. Users can view the clip creation status, check detailed information, add tags and comments, and view logs. The system also supports downloading clips, printing logs, and tracking buses at that time with Google maps.",
                      technologies:
                        "React, Tanstack Query, React Router Dom, FSD; Gin, VDK, Video streaming, FFmpeg C binding",
                      achievements: [
                        "Developed Web UI(dashboard, clip request, clip history, clip detail, health notification, settings page).",
                        "Developed Media Server for streaming Videos and GPS data to WebAPP.",
                        "Contributed open source libraries fixing race conditions and rtp payload parsing.",
                        "Focused on Optimistic UI, Error Boundary, Fallback components for lazy loading",
                      ],
                    },
                    {
                      title: "GIS Tracking Service",
                      date: "Feb 2023 - PRESENT",
                      description:
                        "Introduced to domestic and overseas construction companies or local governments for the purpose of construction site management or on/off management of roads and footbreakers around rivers in the event of heavy rain, and provides customized functions to each company or local government (display water level sensors, remote control of circuit breakers, upload construction site drawings, tracking the location of vehicles or helicopters, etc.)",
                      technologies: "",
                      achievements: [
                        "System Integration to each companies or local governments",
                        "Developed Web UI with Google maps or Openlayers map or Kakao maps",
                        "Contributed open source libraries wrapping map sdk into web components.",
                        "Focused on multiple video streaming with restricted resources(low memory, low cpu power).",
                      ],
                      link: "https://youtu.be/YrOl5wlji0o?si=3yw6fd5_dSKNJac0",
                    },
                  ].map((project, index) => (
                    <Card key={index}>
                      <CardHeader>
                        <CardTitle>{project.title}</CardTitle>
                        <CardDescription>{project.date}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p>{project.description}</p>
                        {project.technologies && (
                          <p className="mt-2">
                            <strong>Technologies:</strong> {project.technologies}
                          </p>
                        )}
                        <ul className="list-disc pl-5 mt-2 space-y-1">
                          {project.achievements.map((achievement, i) => (
                            <li key={i}>{achievement}</li>
                          ))}
                        </ul>
                        {project.link && (
                          <p className="mt-2">
                            <a
                              href={project.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary hover:underline"
                            >
                              View Demo Video
                            </a>
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="awards">
                <Card>
                  <CardHeader>
                    <CardTitle>Awards</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <h3 className="text-lg font-semibold">
                      Google Developer Students Clubs Hackathon
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Grand Prize | December 2023
                    </p>
                    <p className="mt-2">
                      Participated in a hackathon where teams developed services
                      using Google technologies. Our team consisted of one
                      designer, two machine learning engineers, and one
                      full-stack developer. We built a service that generates
                      virtual interview questions using OpenAI and extracts
                      scripts from uploaded videos using Google's speech-to-text
                      model. I was responsible for both backend and frontend
                      development.
                    </p>
                    <ul className="list-disc pl-5 mt-2 space-y-1">
                      <li>
                        Set up GCR for Docker images, GKE for container
                        orchestration, and GCS for video uploads.
                      </li>
                      <li>
                        Developed REST APIs & Auth APIs for User entities on the
                        Main page, using Nest.js.
                      </li>
                      <li>
                        Assisted machine learning developers by building REST
                        APIs using Flask for their models.
                      </li>
                    </ul>
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="education">
                <Card>
                  <CardHeader>
                    <CardTitle>Education</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <h3 className="text-lg font-semibold">
                      Hanyang Univ, Seoul
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Bachelor | March 2018 - Feb 2024
                    </p>
                    <p className="mt-2">Double major in Electronics and Big Data</p>
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="employee card">
                <div className="relative min-h-screen">
                  <ThreeCanvas />
                </div>
              </TabsContent>
            </main>
          </Tabs>
        </div>

        <footer className="bg-secondary py-4">
          <div className="container mx-auto text-center">
            <p>© 2024 GyeongHo Kim. All rights reserved.</p>
          </div>
        </footer>
      </div>
      <div className="fixed bottom-0 left-0 right-0 z-10 sm:hidden block">
        <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
      </div>
    </>
  );
}

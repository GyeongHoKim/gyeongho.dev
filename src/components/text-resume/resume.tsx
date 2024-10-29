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
              I Build Web Experience, Full Stack
            </p>
            <div className="flex flex-wrap items-center mt-2 md:space-x-4 sm:space-x-0">
              <a
                href="mailto:rlarudgh2017@gmail.com"
                className="flex items-center mr-4 md:mr-0"
              >
                <Mail className="w-4 h-4 mr-2" />
                <span className="hidden md:inline">rlarudgh2017@gmail.com</span>
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
                href="https://velog.io/@rlarudgh"
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
                <TabsList className="hidden md:grid w-full grid-cols-5">
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
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Skills(Front End)</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="list-disc pl-5 space-y-2">
                        <li>
                          Developing flexible and adaptable components (Lit, Web
                          Components, React)
                        </li>
                        <li>
                          Component Test, Visual Regression Test (Cypress,
                          BackstopJS, Percy)
                        </li>
                        <li>
                          Design System & Storybook (Typography, Theme Color,
                          Grid System)
                        </li>
                        <li>
                          Real-time Video Streaming Player (Browser side H264 &
                          H265 decode)
                        </li>
                      </ul>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle>Skills(Back End)</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="list-disc pl-5 space-y-2">
                        <li>Developing testable APIs (Nest.js, Gin)</li>
                        <li>RTP Client Library (Node.js, Golang)</li>
                        <li>
                          Real-time Video Streaming (WebRTC, HLS, ll-HLS,
                          WebSocket(Raw NALu))
                        </li>
                      </ul>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle>Skills(Devops)</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="list-disc pl-5 space-y-2">
                        <li>CI/CD (Jenkins, GitHub Actions)</li>
                        <li>Infrastructure as code (Terraform)</li>
                        <li>Cloud (AWS ECR, AWS ECS)</li>
                      </ul>
                    </CardContent>
                  </Card>
                </div>
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
                          IDIS / Web Engineer
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          July 2023 - PRESENT, Pangyo
                        </p>
                        <ul className="list-disc pl-5 mt-2 space-y-1">
                          <li>
                            Developed Web UIs for the Video Management System
                            (VMS)
                          </li>
                          <li>
                            Introduced ES modules and a component-based
                            development approach
                          </li>
                          <li>
                            Created a Design System using Web Component and
                            StoryBook Server
                          </li>
                          <li>
                            Integrated component testing, visual regression
                            testing into the Jenkins CI pipeline
                          </li>
                          <li>
                            Developed several web solutions using the design
                            system I built
                          </li>
                          <li>
                            Built a REALTIME WEB VIDEO PLAYER that parses RTP
                            packets in the browser environment
                          </li>
                          <li>
                            Developed an RTSP library that operates in a Node.js
                            environment
                          </li>
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
                      title: "iNEX Web Components",
                      date: "November 2023 - PRESENT",
                      description:
                        "Created a library of web components for a design system applied to all serviced web solutions.",
                      technologies:
                        "Lit, Storybook, Design System (Typography, Theme Color, Grid System)",
                      achievements: [
                        "Introduced the concept of design systems and created a web component library.",
                        "Introduced concept of theme using shadow DOM and tokens for productivity for OEM-specific designs.",
                        "Built an internal NPM registry server and StoryBook server.",
                        "Implemented component testing with Cypress and visual regression testing with BackstopJS, and integrated them into the CI pipeline.",
                        "Introduced importMap, grunt minifying, and the rollup bundler for compatibility with existing pages, improving the initial load time of the legacy pages from over one minute to less than three-resume seconds.",
                      ],
                    },
                    {
                      title: "iNEX Live Player",
                      date: "February 2024 - June 2024",
                      description:
                        "A library designed to display RTSP streams on the web.",
                      technologies:
                        "Lit, Nest.js, Gin, FFMPEG, Live-streaming (RTP, HLS, WebRTC)",
                      achievements: [
                        "Developed a proxy server using Node.js or Golang for RTSP connection and extracting Video NALu.",
                        "Created a Web Component to decode NALu using WebCodecs API or a WebAssembly decoder and render the video.",
                        "Added Worker Thread support for video decoding to display multiple CCTV streams on a single screen.",
                        "Developed additional support for WebRTC, HLS, and LL-HLS protocols.",
                      ],
                    },
                    {
                      title: "Clip Archive",
                      date: "May 2023 - PRESENT",
                      description:
                        "A system for managing and creating short clips from CCTV recordings.",
                      technologies:
                        "React, Tanstack Query, React Router Dom, FSD",
                      achievements: [
                        "Developed the WEB UI",
                        "Focused on domain separation and abstraction as I wanted to add GPS location information for the clips.",
                        "Abstracted the api Client due to frequent changes in both our protocol and the HTTP protocol, and separated the Entity, DTO, and RDO for the frequently changing API.",
                      ],
                    },
                    {
                      title: "Real-time Flood Monitor",
                      date: "February 2024 - July 2024",
                      description:
                        "A project for monitoring CCTV status and controlling road barriers in flood-prone areas.",
                      technologies: "Lit, Redux, Gin",
                      achievements: [
                        "Developed the WEB UI.",
                        "Developed a Golang Gin-based media server that receives video via RTP and transmits it via various protocols (WebRTC, HLS, ll-HLS, RTP).",
                      ],
                    },
                  ].map((project, index) => (
                    <Card key={index}>
                      <CardHeader>
                        <CardTitle>{project.title}</CardTitle>
                        <CardDescription>{project.date}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p>{project.description}</p>
                        <p className="mt-2">
                          <strong>Technologies:</strong> {project.technologies}
                        </p>
                        <ul className="list-disc pl-5 mt-2 space-y-1">
                          {project.achievements.map((achievement, i) => (
                            <li key={i}>{achievement}</li>
                          ))}
                        </ul>
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
                      Grand Prize in Hackathon
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      December 2023, Namuthon hosted by Google Developer Student
                      Clubs & alpaco
                    </p>
                    <p className="mt-2">
                      Participated in a hackathon where teams developed services
                      using Google technologies. Our team consisted of one
                      designer, two machine learning engineers, and one
                      full-stack developer.
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

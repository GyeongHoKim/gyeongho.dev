import { ReactNode, useEffect, useRef, useState } from "react";
import { HeaderTabs } from "./HeaderTabs.tsx";
import { MainContent } from "./MainContent.tsx";

interface SectionContent {
  [key: string]: ReactNode;
}

interface LayoutProps {
  sections: SectionContent;
}

export default function Layout({ sections }: LayoutProps) {
  const sectionNames = Object.keys(sections);
  const [activeTab, setActiveTab] = useState(sectionNames[0] || "");
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveTab(entry.target.id);
          }
        });
      },
      { threshold: 0.5 },
    );

    sectionNames.forEach((section) => {
      if (sectionRefs.current[section]) {
        observerRef.current?.observe(sectionRefs.current[section]!);
      }
    });

    return () => observerRef.current?.disconnect();
  }, [sectionNames]);

  const handleTabClick = (section: string) => {
    setActiveTab(section);
    sectionRefs.current[section]?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen text-white">
      <HeaderTabs
        sections={sectionNames}
        activeTab={activeTab}
        onTabClick={handleTabClick}
      />
      <MainContent
        sections={sectionNames}
        sectionRefs={sectionRefs}
        sectionContent={sections}
      />
    </div>
  );
}

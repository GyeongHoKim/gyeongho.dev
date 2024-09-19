import { ReactNode, RefObject } from "react";

interface MainContentProps {
  sections: string[];
  sectionRefs: RefObject<Record<string, HTMLElement | null>>;
  sectionContent: Record<string, ReactNode>;
}

export function MainContent({
  sections,
  sectionRefs,
  sectionContent,
}: MainContentProps) {
  return (
    <main className="pt-16">
      {sections.map((section) => (
        <section
          key={section}
          id={section}
          ref={(el) => {
            if (sectionRefs.current) {
              sectionRefs.current[section] = el;
            }
          }}
          className="relative min-h-screen flex items-center justify-center"
        >
          {sectionContent[section] || (
            <h2 className="text-4xl font-bold capitalize">{section}</h2>
          )}
        </section>
      ))}
    </main>
  );
}

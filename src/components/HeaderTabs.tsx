import { motion } from "framer-motion";

interface HeaderTabsProps {
  sections: string[];
  activeTab: string;
  onTabClick: (section: string) => void;
}

export function HeaderTabs({
  sections,
  activeTab,
  onTabClick,
}: HeaderTabsProps) {
  return (
    <header className="fixed top-0 left-0 right-0 bg-black z-10">
      <nav className="container mx-auto px-4">
        <ul className="flex justify-center space-x-8 py-4">
          {sections.map((section) => (
            <li key={section} className="relative">
              <button
                onClick={() => onTabClick(section)}
                className={`text-white text-2xl font-medium capitalize focus:outline-none ${
                  activeTab === section ? "text-sky-400" : ""
                }`}
              >
                {section}
              </button>
              {activeTab === section && (
                <motion.div
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-sky-400"
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: 0.3 }}
                  layoutId="underline"
                />
              )}
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}

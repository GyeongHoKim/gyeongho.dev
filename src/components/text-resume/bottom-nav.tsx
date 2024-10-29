import { Award, Briefcase, Code, CreditCard, User } from "lucide-react";

type BottomNavProps = {
  activeTab: string;
  setActiveTab: (tab: string) => void;
};

export function BottomNav({ activeTab, setActiveTab }: BottomNavProps) {
  return (
    <nav className="bg-secondary/95 backdrop-blur-sm p-2">
      <div className="flex justify-around">
        <button
          onClick={() => setActiveTab("skills")}
          className={`flex flex-col items-center p-2 ${
            activeTab === "skills" ? "text-primary" : "text-muted-foreground"
          }`}
        >
          <User size={24} />
          <span className="text-xs mt-1">Skills</span>
        </button>
        <button
          onClick={() => setActiveTab("experience")}
          className={`flex flex-col items-center p-2 ${
            activeTab === "experience"
              ? "text-primary"
              : "text-muted-foreground"
          }`}
        >
          <Briefcase size={24} />
          <span className="text-xs mt-1">Experience</span>
        </button>
        <button
          onClick={() => setActiveTab("projects")}
          className={`flex flex-col items-center p-2 ${
            activeTab === "projects" ? "text-primary" : "text-muted-foreground"
          }`}
        >
          <Code size={24} />
          <span className="text-xs mt-1">Projects</span>
        </button>
        <button
          onClick={() => setActiveTab("awards")}
          className={`flex flex-col items-center p-2 ${
            activeTab === "awards" ? "text-primary" : "text-muted-foreground"
          }`}
        >
          <Award size={24} />
          <span className="text-xs mt-1">Awards</span>
        </button>
        <button
          onClick={() => setActiveTab("employee card")}
          className={`flex flex-col items-center p-2 ${
            activeTab === "employee card"
              ? "text-primary"
              : "text-muted-foreground"
          }`}
        >
          <CreditCard size={24} />
          <span className="text-xs mt-1">Card</span>
        </button>
      </div>
    </nav>
  );
}

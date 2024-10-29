import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { Resume } from "@/components/text-resume";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Resume />
  </StrictMode>,
);

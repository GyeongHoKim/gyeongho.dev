import Layout from "./components/Layout.tsx";
import { About } from "./components/about/About.tsx";

export default function App() {
  const sections = {
    about: <About />,
    projects: null,
    contact: null,
  };

  return <Layout sections={sections} />;
}

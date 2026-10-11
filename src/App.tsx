import { HashRouter, Route, Routes } from "react-router-dom";
import AuthGate from "./components/AuthGate";
import Layout from "./components/Layout";
import Calendar from "./pages/Calendar";
import Dashboard from "./pages/Dashboard";
import Ideas from "./pages/Ideas";
import ProjectDetail from "./pages/ProjectDetail";
import Projects from "./pages/Projects";

// HashRouter : les liens fonctionnent sur GitHub Pages (hébergement statique).
export default function App() {
  return (
    <AuthGate>
    <HashRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="calendrier" element={<Calendar />} />
          <Route path="projets" element={<Projects />} />
          <Route path="projets/:id" element={<ProjectDetail />} />
          <Route path="idees" element={<Ideas />} />
        </Route>
      </Routes>
    </HashRouter>
    </AuthGate>
  );
}

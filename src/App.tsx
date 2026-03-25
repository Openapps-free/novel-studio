import { useEffect, useMemo } from "react";
import { useStore } from "./store";
import { Layout } from "./components/Layout";
import { Logo } from "./components/Logo";
import { OverviewView } from "./views/Overview";
import { WriteView } from "./views/Write";
import { PlanView } from "./views/Plan";
import { CodexView } from "./views/Codex";
import { TimelineView } from "./views/Timeline";
import { CharacterMapView } from "./views/CharacterMap";
import { TagsView } from "./views/Tags";
import { ResearchView } from "./views/Research";
import { AnalyzeView } from "./views/Analyze";
import { RevisionsView } from "./views/Revisions";
import { ChatView } from "./views/Chat";
import { SettingsView } from "./views/Settings";

export default function App() {
  const { 
    initializeWorkspace, 
    isLoading, 
    settings, 
    currentView,
    workspace,
    selectProject,
    addProject,
  } = useStore();
  
  useEffect(() => {
    initializeWorkspace();
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", settings.theme);
  }, [settings.theme]);

  const hasProjects = workspace.projects.length > 0;

  const viewContent = useMemo(() => {
    if (!hasProjects) return null;

    switch (currentView) {
      case "overview":
        return <OverviewView />;
      case "write":
        return <WriteView />;
      case "plan":
        return <PlanView />;
      case "codex":
        return <CodexView />;
      case "timeline":
        return <TimelineView />;
      case "characters":
        return <CharacterMapView />;
      case "tags":
        return <TagsView />;
      case "research":
        return <ResearchView />;
      case "analyze":
        return <AnalyzeView />;
      case "revisions":
        return <RevisionsView />;
      case "chat":
        return <ChatView />;
      case "settings":
        return <SettingsView />;
      default:
        return <OverviewView />;
    }
  }, [currentView, hasProjects]);

  if (isLoading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading Novel Studio...</p>
        </div>
      </div>
    );
  }

  if (!hasProjects) {
    return (
      <div className="welcome-screen">
        <div className="welcome-content">
          <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'center' }}>
            <Logo size={80} />
          </div>
          <h1>Novel Studio</h1>
          <p className="tagline">Professional Writing Environment</p>
          <div className="welcome-features">
            <div className="feature">AI Writing Assistant</div>
            <div className="feature">World Codex</div>
            <div className="feature">Story Planning</div>
            <div className="feature">Timeline</div>
            <div className="feature">Character Maps</div>
            <div className="feature">Export Anywhere</div>
          </div>
          <button className="btn btn-primary btn-lg" onClick={() => {
            const projectId = addProject("My First Novel");
            selectProject(projectId);
          }}>
            Create New Project
          </button>
        </div>
      </div>
    );
  }

  return <Layout>{viewContent}</Layout>;
}

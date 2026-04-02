import { useEffect, useMemo } from "react";
import { useStore } from "./store";
import { Layout } from "./components/Layout";
import { Logo } from "./components/Logo";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { ConfirmModal } from "./components/ConfirmModal";
import { studioEngine } from "./CoreEngine";
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
import { TemplatesView } from "./views/Templates";

export default function App() {
  const { 
    initializeWorkspace, 
    isLoading, 
    settings, 
    currentView,
    workspace,
    selectProject,
    addProject,
    save,
  } = useStore();
  
  useEffect(() => {
    initializeWorkspace();
  }, []);

  useEffect(() => {
    if (!settings.autoSaveInterval) return;
    const interval = setInterval(() => {
      save();
    }, settings.autoSaveInterval);
    return () => clearInterval(interval);
  }, [settings.autoSaveInterval, save]);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", settings.theme);
    
    const themeMap = {
      dark: 'midnight',
      light: 'classic',
      sepia: 'sepia',
      midnight: 'midnight',
      zen: 'zen',
      royal: 'royal',
      oled: 'oled'
    };
    const coreTheme = themeMap[settings.theme] || 'classic';
    
    const profile = studioEngine.getThemeProfile(coreTheme as any);
    const variableMap = {
      '--studio-bg': '--bg-primary',
      '--studio-surface': '--bg-secondary',
      '--studio-text': '--text-primary',
      '--studio-accent': '--accent-primary',
      '--studio-border': '--border-subtle',
      '--studio-shadow': null,
      '--font-main': null,
    };
    
    Object.entries(profile).forEach(([key, value]) => {
      const cssVar = variableMap[key as keyof typeof variableMap];
      if (cssVar) {
        document.documentElement.style.setProperty(cssVar, value);
      }
    });
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
      case "templates":
        return <TemplatesView />;
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

  return <Layout><ErrorBoundary>{viewContent}</ErrorBoundary><ConfirmModal /></Layout>;
}

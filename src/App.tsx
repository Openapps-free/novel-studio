import { useEffect, useMemo, lazy, Suspense } from "react";
import { useStore } from "./store";
import { Layout } from "./components/Layout";
import { Logo } from "./components/Logo";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { ConfirmModal } from "./components/ConfirmModal";
import { studioEngine } from "./CoreEngine";

const OverviewView = lazy(() => import("./views/Overview").then(m => ({ default: m.OverviewView })));
const WriteView = lazy(() => import("./views/Write").then(m => ({ default: m.WriteView })));
const PlanView = lazy(() => import("./views/Plan").then(m => ({ default: m.PlanView })));
const CodexView = lazy(() => import("./views/Codex").then(m => ({ default: m.CodexView })));
const TimelineView = lazy(() => import("./views/Timeline").then(m => ({ default: m.TimelineView })));
const CharacterMapView = lazy(() => import("./views/CharacterMap").then(m => ({ default: m.CharacterMapView })));
const TagsView = lazy(() => import("./views/Tags").then(m => ({ default: m.TagsView })));
const ResearchView = lazy(() => import("./views/Research").then(m => ({ default: m.ResearchView })));
const AnalyzeView = lazy(() => import("./views/Analyze").then(m => ({ default: m.AnalyzeView })));
const RevisionsView = lazy(() => import("./views/Revisions").then(m => ({ default: m.RevisionsView })));
const ChatView = lazy(() => import("./views/Chat").then(m => ({ default: m.ChatView })));
const SettingsView = lazy(() => import("./views/Settings").then(m => ({ default: m.SettingsView })));
const TemplatesView = lazy(() => import("./views/Templates").then(m => ({ default: m.TemplatesView })));
const WritingStatsView = lazy(() => import("./views/WritingStats").then(m => ({ default: m.WritingStatsView })));

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
    setCurrentView,
    addScene,
    selectedChapterId,
  } = useStore();
  
  useEffect(() => {
    initializeWorkspace();
  }, []);

  // Keyboard Shortcuts Implementation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey)) {
        switch (e.key.toLowerCase()) {
          case 's':
            e.preventDefault();
            save();
            break;
          case 'n':
            e.preventDefault();
            if (selectedChapterId) addScene(selectedChapterId, "New Scene");
            break;
          case '1': setCurrentView("overview"); break;
          case '2': setCurrentView("write"); break;
          case '3': setCurrentView("plan"); break;
          case '4': setCurrentView("codex"); break;
          case '5': setCurrentView("timeline"); break;
          case '6': setCurrentView("characters"); break;
          case '7': setCurrentView("research"); break;
          case '8': setCurrentView("analyze"); break;
          case '9': setCurrentView("settings"); break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [save, addScene, selectedChapterId, setCurrentView]);

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
      case "stats":
        return <WritingStatsView />;
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

  return (
    <Layout>
      <ErrorBoundary>
        <Suspense fallback={<div className="view-loader">Loading view...</div>}>
          {viewContent}
        </Suspense>
      </ErrorBoundary>
      <ConfirmModal />
    </Layout>
  );
}

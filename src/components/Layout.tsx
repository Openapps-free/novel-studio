import { ReactNode, useState } from "react";
import { useStore } from "../store";
import { ViewType } from "../types";
import { Logo } from "./Logo";

interface LayoutProps {
  children: ReactNode;
}

const navItems: { id: ViewType; icon: string; label: string }[] = [
  { id: "overview", icon: "📊", label: "Overview" },
  { id: "write", icon: "✏️", label: "Write" },
  { id: "plan", icon: "📋", label: "Plan" },
  { id: "codex", icon: "📖", label: "Codex" },
  { id: "timeline", icon: "📅", label: "Timeline" },
  { id: "characters", icon: "🔗", label: "Characters" },
  { id: "tags", icon: "🏷️", label: "Tags" },
  { id: "research", icon: "📚", label: "Research" },
  { id: "templates", icon: "📋", label: "Templates" },
  { id: "analyze", icon: "📈", label: "Analyze" },
  { id: "revisions", icon: "📜", label: "History" },
  { id: "chat", icon: "💬", label: "AI Chat" },
  { id: "settings", icon: "⚙️", label: "Settings" },
];

export function Layout({ children }: LayoutProps) {
  const { 
    workspace, 
    selectedProjectId, 
    selectedChapterId, 
    selectedSceneId,
    currentView,
    selectProject,
    selectChapter,
    selectScene,
    addProject,
    addChapter,
    addScene,
    setCurrentView,
    settings,
    setTheme,
    save,
    reorderChapters,
    updateProject,
    updateChapter,
    deleteProject,
    deleteChapter,
    deleteScene,
  } = useStore();
  
  const [draggingChapter, setDraggingChapter] = useState<string | null>(null);
  const [dragOverChapter, setDragOverChapter] = useState<string | null>(null);

  const project = workspace.projects.find(p => p.id === selectedProjectId);
  const chapters = workspace.chapters.filter(c => c.projectId === selectedProjectId);

  const cycleTheme = () => {
    const themes: Array<"dark" | "light" | "sepia"> = ["dark", "light", "sepia"];
    const currentIndex = themes.indexOf(settings.theme);
    const nextIndex = (currentIndex + 1) % themes.length;
    setTheme(themes[nextIndex]);
  };

  return (
    <div className="app">
      <nav className="sidebar-nav">
        <Logo size={44} />
        <div className="nav-items">
          {navItems.map((item) => (
            <button
              key={item.id}
              className={`nav-item ${currentView === item.id ? "active" : ""}`}
              onClick={() => setCurrentView(item.id)}
              title={item.label}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
              <span className="nav-tooltip">{item.label}</span>
            </button>
          ))}
        </div>
      </nav>

      <aside className="navigator">
        <div className="nav-header">
          <div className="nav-header-label">Workspace</div>
          <div className="nav-header-title">{project?.title || "No project"}</div>
        </div>
        
        <div className="project-selector">
          {workspace.projects.map((p) => (
            <div
              key={p.id}
              className={`project-item ${p.id === selectedProjectId ? "active" : ""}`}
            >
              <div className="project-item-content" onClick={() => selectProject(p.id)}>
                <span className="project-name">{p.title}</span>
                <span className="project-status">{p.status}</span>
              </div>
              <button 
                className="project-delete-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  if (confirm(`Delete "${p.title}"? This cannot be undone.`)) {
                    deleteProject(p.id);
                  }
                }}
                title="Delete project"
              >
                ×
              </button>
            </div>
          ))}
          <button 
            className="add-project-btn"
            onClick={() => {
              const projectId = addProject("New Project");
              selectProject(projectId);
              setCurrentView("overview");
            }}
          >
            + New Project
          </button>
        </div>

        {project && (
          <div className="chapter-list">
            {chapters.map((chapter) => (
              <div 
                key={chapter.id} 
                className="chapter-section"
                draggable
                onDragStart={(e) => {
                  setDraggingChapter(chapter.id);
                  e.dataTransfer.setData("text/plain", chapter.id);
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  if (draggingChapter && draggingChapter !== chapter.id) {
                    setDragOverChapter(chapter.id);
                  }
                }}
                onDragLeave={() => setDragOverChapter(null)}
                onDrop={(e) => {
                  e.preventDefault();
                  if (draggingChapter && draggingChapter !== chapter.id) {
                    const newOrder = [...chapters];
                    const fromIdx = newOrder.findIndex(c => c.id === draggingChapter);
                    const toIdx = newOrder.findIndex(c => c.id === chapter.id);
                    const [removed] = newOrder.splice(fromIdx, 1);
                    newOrder.splice(toIdx, 0, removed);
                    reorderChapters(newOrder.map(c => c.id));
                  }
                  setDraggingChapter(null);
                  setDragOverChapter(null);
                }}
                onDragEnd={() => {
                  setDraggingChapter(null);
                  setDragOverChapter(null);
                }}
                style={{ 
                  opacity: draggingChapter === chapter.id ? 0.5 : 1,
                  borderLeft: dragOverChapter === chapter.id ? '3px solid var(--accent-primary)' : '3px solid transparent'
                }}
              >
                <div
                  className={`chapter-header ${chapter.id === selectedChapterId ? "active" : ""}`}
                  onClick={() => {
                    selectChapter(chapter.id);
                    const scenes = workspace.scenes.filter(s => s.chapterId === chapter.id);
                    if (scenes.length > 0) {
                      selectScene(scenes[0].id);
                    }
                  }}
                >
                  <span className="chapter-drag-handle">⋮⋮</span>
                  <input
                    className="chapter-title-input"
                    value={chapter.title}
                    onChange={(e) => updateChapter(chapter.id, { title: e.target.value })}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <span className="chapter-count">
                    {workspace.scenes.filter(s => s.chapterId === chapter.id).length}
                  </span>
                  <button 
                    className="chapter-delete-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm(`Delete "${chapter.title}" and all its scenes?`)) {
                        deleteChapter(chapter.id);
                      }
                    }}
                    title="Delete chapter"
                  >
                    ×
                  </button>
                </div>
                    {workspace.scenes
                      .filter(s => s.chapterId === chapter.id)
                      .map((scene) => (
                        <div
                          key={scene.id}
                          className={`scene-item ${scene.id === selectedSceneId ? "active" : ""}`}
                          onClick={() => {
                            selectScene(scene.id);
                            setCurrentView("write");
                          }}
                        >
                          <span className={`scene-status-dot ${scene.status}`} />
                          <span className="scene-title">{scene.title}</span>
                          <button 
                            className="scene-delete-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (confirm(`Delete "${scene.title}"?`)) {
                                deleteScene(scene.id);
                              }
                            }}
                            title="Delete scene"
                          >
                            ×
                          </button>
                        </div>
                      ))}
              </div>
            ))}
          </div>
        )}

        <div className="nav-actions">
          <button className="action-btn" onClick={() => {
            if (selectedProjectId) {
              addChapter("New Chapter");
            }
          }}>+ Chapter</button>
          <button className="action-btn" onClick={() => {
            if (selectedChapterId) {
              addScene(selectedChapterId, "New Scene");
            }
          }}>+ Scene</button>
        </div>
      </aside>

      <main className="main-content">
        <header className="top-bar">
          <div className="top-bar-left">
            {project ? (
              <input
                value={project.title}
                onChange={(e) => updateProject(project.id, { title: e.target.value })}
                style={{
                  background: 'transparent',
                  border: 'none',
                  fontSize: '22px',
                  fontWeight: '700',
                  color: 'var(--text-primary)',
                  width: '300px'
                }}
              />
            ) : (
              <h1>Novel Studio</h1>
            )}
            <span className="top-bar-meta">
              {project?.type || ""} · {project?.status || ""}
            </span>
          </div>
          <div className="top-bar-right">
            <button className="icon-btn" onClick={cycleTheme} title="Toggle theme">
              {settings.theme === "dark" ? "🌙" : settings.theme === "light" ? "☀️" : "📜"}
            </button>
            <button className="icon-btn" onClick={save} title="Save">
              💾
            </button>
          </div>
        </header>
        <div className="content-area">
          {children}
        </div>
      </main>
    </div>
  );
}

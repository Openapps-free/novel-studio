import { useStore } from "../store";
import { calculateWordCount } from "../services/storage";
import { WritingGoalsPanel } from "../components/WritingGoalsPanel";

export function OverviewView() {
  const { getProject, getProjectStats, updateProject, setCurrentView } = useStore();
  
  const project = getProject();
  const stats = getProjectStats();

  if (!project) {
    return (
      <div className="view overview-view">
        <div className="empty-state">
          <h2>No Project Selected</h2>
          <p>Create a new project to get started</p>
        </div>
      </div>
    );
  }

  return (
    <div className="view overview-view">
      <div className="hero-card">
        <div className="hero-content">
          <div className="hero-header" style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '12px' }}>
            <input
              className="scene-title-input"
              value={project.title}
              onChange={(e) => updateProject(project.id, { title: e.target.value })}
              style={{ fontSize: '24px', fontWeight: '700', background: 'transparent', border: 'none', color: 'var(--text-primary)', flex: 1 }}
            />
            <select
              className="status-select"
              value={project.status}
              onChange={(e) => updateProject(project.id, { status: e.target.value as any })}
              style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-subtle)', padding: '8px 16px', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)' }}
            >
              <option value="drafting">Drafting</option>
              <option value="planning">Planning</option>
              <option value="brainstorming">Brainstorming</option>
              <option value="complete">Complete</option>
            </select>
          </div>
          <textarea
            className="synopsis-input"
            value={project.synopsis}
            onChange={(e) => updateProject(project.id, { synopsis: e.target.value })}
            placeholder="Write your story synopsis..."
          />
          <div className="hero-tags">
            {project.tags.map((tag, i) => (
              <span key={i} className="tag">{tag}</span>
            ))}
          </div>
        </div>
        <div className="hero-progress">
          <div className="progress-ring">
            <svg viewBox="0 0 120 120">
              <defs>
                <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#8b5cf6" />
                  <stop offset="100%" stopColor="#6366f1" />
                </linearGradient>
              </defs>
              <circle className="progress-bg" cx="60" cy="60" r="52" />
              <circle 
                className="progress-fill" 
                cx="60" cy="60" r="52"
                strokeDasharray={326.72}
                strokeDashoffset={326.72 - (326.72 * (stats?.completion ?? 0) / 100)}
              />
            </svg>
            <div className="progress-text">
              <span className="progress-value">{stats?.completion ?? 0}%</span>
              <span className="progress-label">Complete</span>
            </div>
          </div>
          <div className="progress-stats">
            <div className="progress-stat">
              <span className="stat-value">{stats?.wordCount.toLocaleString() ?? 0}</span>
              <span className="stat-label">Written</span>
            </div>
            <div className="progress-stat">
              <span className="stat-value">{stats?.targetWords.toLocaleString() ?? 0}</span>
              <span className="stat-label">Target</span>
            </div>
            <div className="progress-stat">
              <span className="stat-value">{Math.max(0, (stats?.targetWords ?? 0) - (stats?.wordCount ?? 0))}</span>
              <span className="stat-label">Remaining</span>
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '24px' }}>
        <div>
          <div className="stats-grid">
            <div className="stat-card">
              <span className="stat-icon">📝</span>
              <span className="stat-number">{stats?.sceneCount ?? 0}</span>
              <span className="stat-name">Scenes</span>
            </div>
            <div className="stat-card">
              <span className="stat-icon">✅</span>
              <span className="stat-number">{stats?.completedScenes ?? 0}</span>
              <span className="stat-name">Completed</span>
            </div>
            <div className="stat-card">
              <span className="stat-icon">👥</span>
              <span className="stat-number">{stats?.characters ?? 0}</span>
              <span className="stat-name">Characters</span>
            </div>
            <div className="stat-card">
              <span className="stat-icon">📍</span>
              <span className="stat-number">{stats?.locations ?? 0}</span>
              <span className="stat-name">Locations</span>
            </div>
          </div>

          <div className="chapters-overview">
            <h3>Chapters</h3>
            <div className="chapter-cards">
              {project.chapters.map((chapter, idx) => {
                const words = project.scenes
                  .filter(s => s.chapterId === chapter.id)
                  .reduce((sum, s) => sum + calculateWordCount(s.content), 0);
                const percent = stats?.wordCount ? (words / stats.wordCount) * 100 : 0;
                return (
                  <div key={chapter.id} className="chapter-card" onClick={() => setCurrentView("write")}>
                    <span className="chapter-num">{idx + 1}</span>
                    <div className="chapter-info">
                      <span className="chapter-name">{chapter.title}</span>
                      <span className="chapter-meta">
                        {project.scenes.filter(s => s.chapterId === chapter.id).length} scenes · {words.toLocaleString()} words
                      </span>
                    </div>
                    <div className="chapter-progress">
                      <div className="chapter-bar">
                        <div className="chapter-bar-fill" style={{ width: `${percent}%` }} />
                      </div>
                      <span className="chapter-progress-text">{Math.round(percent)}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        
        <WritingGoalsPanel />
      </div>
    </div>
  );
}

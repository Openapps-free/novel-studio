import { useMemo } from "react";
import { useStore } from "../store";

export function WritingStatsView() {
  const { 
    getProject, 
    getProjectStats, 
    getDailyWordCountsHistory, 
    getWritingStreak, 
    settings,
    workspace 
  } = useStore();

  const project = getProject();
  const stats = getProjectStats();
  const history = getDailyWordCountsHistory();
  const streak = getWritingStreak();

  const last7Days = useMemo(() => {
    const days: { date: string; words: number; label: string }[] = [];
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split("T")[0] ?? "";
      const dayName = date.toLocaleDateString("en-US", { weekday: "short" });
      
      const entry = history.find((h) => h.date === dateStr);
      days.push({
        date: dateStr,
        words: entry?.words || 0,
        label: dayName,
      });
    }
    return days;
  }, [history]);

  const maxWords = Math.max(...last7Days.map((d) => d.words), settings.dailyGoal || 500);

  const totalWords = workspace.scenes
    .filter((s) => s.projectId === project?.id)
    .reduce((sum, s) => sum + (s.content?.split(/\s+/).filter(Boolean).length || 0), 0);

  const avgWordsPerDay = history.length > 0 
    ? Math.round(history.reduce((sum, h) => sum + h.words, 0) / history.length)
    : 0;

  const daysToGoal = settings.dailyGoal && project?.targetWordCount
    ? Math.ceil((project.targetWordCount - totalWords) / (settings.dailyGoal || 500))
    : 0;

  if (!project) {
    return (
      <div className="view stats-view">
        <div className="empty-state">
          <h2>No Project Selected</h2>
          <p>Select a project to view writing statistics</p>
        </div>
      </div>
    );
  }

  return (
    <div className="view stats-view">
      <div className="stats-header">
        <h2>📊 Writing Statistics</h2>
        <p className="stats-subtitle">Track your progress and build your writing habit</p>
      </div>

      {/* Streak Card */}
      <div className="stats-grid">
        <div className="stat-card streak-card">
          <div className="streak-flame">🔥</div>
          <div className="streak-value">{streak}</div>
          <div className="streak-label">Day Writing Streak</div>
          <div className="streak-message">
            {streak >= 30 ? "Incredible dedication!" :
             streak >= 14 ? "You're on fire!" :
             streak >= 7 ? "Great consistency!" :
             streak >= 3 ? "Keep it going!" :
             streak > 0 ? "Good start!" : "Start your streak today!"}
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">📝</div>
          <div className="stat-value">{totalWords.toLocaleString()}</div>
          <div className="stat-label">Total Words</div>
          <div className="stat-progress">
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${Math.min(100, (totalWords / (project.targetWordCount || 80000)) * 100)}%` }}
              />
            </div>
            <span>{Math.round((totalWords / (project.targetWordCount || 80000)) * 100)}% of {project.targetWordCount?.toLocaleString()} goal</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">📅</div>
          <div className="stat-value">{settings.dailyWords?.toLocaleString() || 0}</div>
          <div className="stat-label">Today's Words</div>
          <div className="stat-progress">
            <div className="progress-bar">
              <div 
                className="progress-fill today"
                style={{ width: `${Math.min(100, ((settings.dailyWords || 0) / (settings.dailyGoal || 500)) * 100)}%` }}
              />
            </div>
            <span>{Math.round(((settings.dailyWords || 0) / (settings.dailyGoal || 500)) * 100)}% of {settings.dailyGoal || 500} goal</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">📈</div>
          <div className="stat-value">{avgWordsPerDay.toLocaleString()}</div>
          <div className="stat-label">Avg Words/Day</div>
          <div className="stat-info">
            {daysToGoal > 0 
              ? `~${daysToGoal} days to goal at this pace`
              : "Goal achieved! 🎉"}
          </div>
        </div>
      </div>

      {/* Weekly Chart */}
      <div className="chart-section">
        <h3>Last 7 Days</h3>
        <div className="weekly-chart">
          {last7Days.map((day) => (
            <div key={day.date} className="chart-bar-container">
              <div className="chart-bar-wrapper">
                <div 
                  className={`chart-bar ${day.words >= (settings.dailyGoal || 500) ? "goal-met" : ""}`}
                  style={{ height: `${Math.max(4, (day.words / maxWords) * 150)}px` }}
                >
                  <span className="chart-value">{day.words > 0 ? day.words.toLocaleString() : ""}</span>
                </div>
              </div>
              <span className="chart-label">{day.label}</span>
            </div>
          ))}
        </div>
        <div className="chart-legend">
          <span className="legend-item">
            <span className="legend-dot goal-met" /> Goal Met
          </span>
          <span className="legend-item">
            <span className="legend-dot" /> Below Goal
          </span>
        </div>
      </div>

      {/* Project Progress */}
      <div className="progress-section">
        <h3>Project Progress</h3>
        <div className="progress-details">
          <div className="progress-item">
            <span className="progress-label">Chapters</span>
            <span className="progress-value">{stats?.chapterCount || 0}</span>
          </div>
          <div className="progress-item">
            <span className="progress-label">Scenes</span>
            <span className="progress-value">{stats?.sceneCount || 0}</span>
          </div>
          <div className="progress-item">
            <span className="progress-label">Completed Scenes</span>
            <span className="progress-value">{stats?.completedScenes || 0}</span>
          </div>
          <div className="progress-item">
            <span className="progress-label">Drafted Scenes</span>
            <span className="progress-value">{stats?.draftedScenes || 0}</span>
          </div>
          <div className="progress-item">
            <span className="progress-label">Characters</span>
            <span className="progress-value">{stats?.characters || 0}</span>
          </div>
          <div className="progress-item">
            <span className="progress-label">Locations</span>
            <span className="progress-value">{stats?.locations || 0}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

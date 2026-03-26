import { useMemo } from "react";
import { useStore } from "../store";
import { calculateWordCount } from "../services/storage";

export function WritingGoalsPanel() {
  const { 
    settings, 
    toggleNanoWriMo,
    getProject,
  } = useStore();
  
  const project = getProject();
  
  const projectWordCount = useMemo(() => {
    if (!project) return 0;
    return project.scenes.reduce((sum, s) => sum + calculateWordCount(s.content), 0);
  }, [project?.scenes]);
  
  const today = new Date().toISOString().split("T")[0];
  const isToday = settings.lastWritingDate === today;
  
  const dailyProgress = isToday ? settings.dailyWords : 0;
  const dailyPercent = Math.min(100, (dailyProgress / settings.dailyGoal) * 100);
  
  const nanoProgress = projectWordCount;
  const nanoPercent = Math.min(100, (nanoProgress / settings.nanoWriMoTarget) * 100);
  
  const daysLeft = useMemo(() => {
    const now = new Date();
    const end = new Date(now.getFullYear(), 10, 30);
    if (now > end) return 0;
    return Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  }, []);
  
  const wordsPerDayNeeded = useMemo(() => {
    if (!settings.nanoWriMoMode) return 0;
    const remaining = settings.nanoWriMoTarget - nanoProgress;
    return Math.ceil(remaining / Math.max(1, daysLeft));
  }, [settings.nanoWriMoMode, nanoProgress, daysLeft]);

  return (
    <div className="goals-panel">
      <div className="goals-header">
        <h3>Writing Goals</h3>
        {settings.nanoWriMoMode && (
          <span className="nano-badge">NaNoWriMo</span>
        )}
      </div>
      
      <div className="goal-card daily-goal">
        <div className="goal-header">
          <span className="goal-title">Today's Progress</span>
          <span className="goal-count">{dailyProgress} / {settings.dailyGoal}</span>
        </div>
        <div className="goal-bar">
          <div className="goal-fill" style={{ width: `${dailyPercent}%` }} />
        </div>
        <div className="goal-footer">
          <span className="goal-remaining">
            {settings.dailyGoal - dailyProgress > 0 
              ? `${settings.dailyGoal - dailyProgress} words to go` 
              : "✅ Goal reached!"}
          </span>
        </div>
      </div>
      
      {settings.nanoWriMoMode && (
        <div className="goal-card nano-goal">
          <div className="goal-header">
            <span className="goal-title">NaNoWriMo Progress</span>
            <span className="goal-count">{nanoProgress.toLocaleString()} / {settings.nanoWriMoTarget.toLocaleString()}</span>
          </div>
          <div className="goal-bar nano-bar">
            <div className="goal-fill nano-fill" style={{ width: `${nanoPercent}%` }} />
          </div>
          <div className="goal-footer">
            <span className="goal-remaining">
              {wordsPerDayNeeded > 0 
                ? `${wordsPerDayNeeded} words/day needed` 
                : "🎉 You've won!"}
            </span>
            <span className="goal-days">{daysLeft} days left</span>
          </div>
        </div>
      )}
      
      <div className="goals-actions">
        <button 
          className={`goal-toggle ${settings.nanoWriMoMode ? 'active' : ''}`}
          onClick={toggleNanoWriMo}
        >
          {settings.nanoWriMoMode ? '🏁 Exit NaNoWriMo' : '🏁 Join NaNoWriMo'}
        </button>
      </div>
    </div>
  );
}

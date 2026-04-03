import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useStore } from "../store";
import RichTextEditor from "../lib/RichTextEditor";
import { calculateWordCount } from "../services/storage";
import { callAI, hasAIConfigured, generateAIPrompt, AI_MODES } from "../services/ai";
import { AIRequest } from "../types";
import { showConfirm } from "../components/ConfirmModal";

export function WriteView() {
  // Get primitive values first
  const selectedSceneId = useStore((s) => s.selectedSceneId);
  const selectedProjectId = useStore((s) => s.selectedProjectId);
  const selectedChapterId = useStore((s) => s.selectedChapterId);
  const settings = useStore((s) => s.settings);
  const writingSession = useStore((s) => s.writingSession);
  
  // Get functions
  const updateScene = useStore((s) => s.updateScene);
  const updateSettings = useStore((s) => s.updateSettings);
  const updateSessionWords = useStore((s) => s.updateSessionWords);
  const setAIProcessing = useStore((s) => s.setAIProcessing);
  
  // Get workspace data
  const scenes = useStore((s) => s.workspace.scenes);
  const chapters = useStore((s) => s.workspace.chapters);
  const projects = useStore((s) => s.workspace.projects);
  const revisions = useStore((s) => s.workspace.revisions);
  
  // Compute derived values with useMemo
  const scene = useMemo(() => 
    scenes.find((sc) => sc.id === selectedSceneId) || null,
    [scenes, selectedSceneId]
  );
  
  const project = useMemo(() => {
    if (!selectedProjectId) return null;
    const p = projects.find((proj) => proj.id === selectedProjectId);
    if (!p) return null;
    // Return a stable reference if data hasn't changed
    return p;
  }, [projects, selectedProjectId]);
  
  const chapter = useMemo(() => 
    chapters.find((c) => c.id === selectedChapterId) || null,
    [chapters, selectedChapterId]
  );
  
  const sceneRevisions = useMemo(() => 
    revisions.filter((r) => r.sceneId === selectedSceneId),
    [revisions, selectedSceneId]
  );

  // Internal State for debounced UI
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // AI State
  const [showAI, setShowAI] = useState(false);
  const [aiMode, setAiMode] = useState<AIRequest["type"]>("continue");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState("");
  const [aiError, setAiError] = useState("");
  const [aiInsertMode, setAiInsertMode] = useState<"replace" | "append">("append");

  // UI State
  const [showRevisions, setShowRevisions] = useState(false);
  const [splitView, setSplitView] = useState(false);
  const [focusMode, setFocusMode] = useState(false);

  // Sprint State
  const [sprintActive, setSprintActive] = useState(false);
  const [sprintTime, setSprintTime] = useState(15);
  const [sprintWords, setSprintWords] = useState(0);
  const sprintRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [sprintTimeLeft, setSprintTimeLeft] = useState(0);
  const [sprintStartWords, setSprintStartWords] = useState(0);

  const sessionGoalProgress = Math.min(100, (writingSession.wordsWritten / (settings.sessionGoal || 500)) * 100);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowAI(false);
        setShowRevisions(false);
      }
      // Power user shortcuts
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'j') {
        e.preventDefault();
        setShowAI(prev => !prev);
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        setFocusMode(prev => !prev);
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        // Manual save trigger if needed, though auto-save is active
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const startSprint = () => {
    setSprintWords(0);
    setSprintStartWords(calculateWordCount(scene?.content || ""));
    setSprintTimeLeft(sprintTime * 60);
    setSprintActive(true);
  };

  const stopSprint = () => {
    setSprintActive(false);
    if (sprintRef.current) {
      clearInterval(sprintRef.current);
      sprintRef.current = null;
    }
  };

  useEffect(() => {
    if (!sprintActive) return;
    
    sprintRef.current = setInterval(() => {
      setSprintTimeLeft(prev => {
        if (prev <= 1) {
          if (sprintRef.current) {
            clearInterval(sprintRef.current);
            sprintRef.current = null;
          }
          setSprintActive(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => {
      if (sprintRef.current) {
        clearInterval(sprintRef.current);
        sprintRef.current = null;
      }
    };
  }, [sprintActive]); // Only depend on sprintActive, not sprintTimeLeft

  const handleAI = async () => {
    if (!scene || !hasAIConfigured(settings)) {
      setAiError("Please configure your API key in Settings first");
      return;
    }
    setAiLoading(true);
    setAiError("");
    setAIProcessing(true);
    try {
      const prompt = generateAIPrompt(aiMode, { 
        sceneContent: scene.content,
        chapterContext: chapter?.title,
      });
      const response = await callAI({ type: aiMode, prompt }, settings);
      setAiResult(response.text);
    } catch (err: any) {
      setAiError(err.message || "AI request failed");
    } finally {
      setAIProcessing(false);
      setAiLoading(false);
    }
  };

  const insertAIResult = (mode: "replace" | "append") => {
    if (!scene || !aiResult) return;
    
    if (mode === "replace") {
      updateScene(scene.id, { content: aiResult });
    } else {
      updateScene(scene.id, { content: scene.content + "\n\n" + aiResult });
    }
    setAiResult("");
  };

  // Use a ref to track the latest scene to avoid dependency issues
  const sceneRef = useRef(scene);
  sceneRef.current = scene;
  
  const handleContentChange = useCallback((content: string) => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    
    saveTimerRef.current = setTimeout(() => {
      const currentScene = sceneRef.current;
      if (!currentScene) return;
      const oldWords = calculateWordCount(currentScene.content);
      const newWords = calculateWordCount(content);
      
      updateScene(currentScene.id, { content });
      
      if (newWords > oldWords) {
        const delta = newWords - oldWords;
        updateSessionWords(delta);
        // Update sprint words if sprint is active
        if (sprintActive) {
          setSprintWords(newWords - sprintStartWords);
        }
      }
    }, 1000); // Debounce store updates by 1s
  }, [sprintActive]); // Only depend on sprintActive now

  if (!project || !scene) {
    return (
      <div className="view write-view">
        <div className="empty-state">
          <h2>No Scene Selected</h2>
          <p>Select or create a scene to start writing</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`view write-view ${focusMode ? "focus-mode" : ""} ${settings.highContrastMode ? "high-contrast" : ""}`}
      role="main"
      aria-label="Manuscript Editor"
    >
      {/* Accessibility Skip Link */}
      <a href="#main-editor" className="sr-only sr-only-focusable">Skip to editor</a>

      {/* Header */}
      <header className="scene-header" role="banner">
        <div className="scene-breadcrumb">
          {project.title} / {chapter?.title} / <strong>{scene.title}</strong>
        </div>
        <div className="scene-title-row">
          <input
            className="scene-title-input"
            value={scene.title}
            onChange={(e) => updateScene(scene.id, { title: e.target.value })}
            aria-label="Scene Title"
          />
          <select
            className="scene-status-select"
            value={scene.status}
            onChange={(e) => updateScene(scene.id, { status: e.target.value as any })}
            aria-label="Scene Status"
          >
            <option value="outline">Outline</option>
            <option value="draft">Draft</option>
            <option value="revising">Revising</option>
            <option value="complete">Complete</option>
          </select>
          <input
            type="color"
            className="color-picker"
            value={scene.color}
            onChange={(e) => updateScene(scene.id, { color: e.target.value })}
          />
        </div>
        <div className="scene-meta-row">
          <input placeholder="POV Character" value={scene.pov} onChange={(e) => updateScene(scene.id, { pov: e.target.value })} />
          <input placeholder="Location" value={scene.location} onChange={(e) => updateScene(scene.id, { location: e.target.value })} />
          <select value={scene.timeOfDay} onChange={(e) => updateScene(scene.id, { timeOfDay: e.target.value })}>
            <option value="">Time of Day</option>
            <option value="morning">Morning</option>
            <option value="afternoon">Afternoon</option>
            <option value="evening">Evening</option>
            <option value="night">Night</option>
            <option value="dawn">Dawn</option>
          </select>
        </div>
        <div className="scene-actions">
          <button className={`tool-btn ${settings.typewriterMode ? "active" : ""}`} onClick={() => updateSettings({ typewriterMode: !settings.typewriterMode })}>Typewriter</button>
          <button className={`tool-btn ${focusMode ? "active" : ""}`} onClick={() => setFocusMode(!focusMode)}>Focus</button>
          <button className={`tool-btn ${splitView ? "active" : ""}`} onClick={() => setSplitView(!splitView)}>Split</button>
          <button className={`tool-btn ${showRevisions ? "active" : ""}`} onClick={() => setShowRevisions(!showRevisions)}>History</button>
          <button className={`tool-btn ai-btn ${showAI ? "active" : ""}`} onClick={() => setShowAI(!showAI)} aria-expanded={showAI}>AI Assistant</button>
        </div>
      </header>

      {/* Sprint Bar */}
      {sprintActive && (
        <div className="sprint-bar" style={{ 
          background: 'var(--accent-subtle)', 
          padding: '12px 20px', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          borderBottom: '1px solid var(--border-subtle)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <span style={{ fontWeight: '600', color: 'var(--accent-primary)' }}>🏃 Writing Sprint</span>
            <span style={{ fontSize: '24px', fontWeight: '700', fontFamily: 'var(--font-mono)' }}>
              {Math.floor(sprintTimeLeft / 60)}:{(sprintTimeLeft % 60).toString().padStart(2, '0')}
            </span>
            <span style={{ color: 'var(--text-secondary)' }}>{sprintWords} words this sprint</span>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={stopSprint}>Stop Sprint</button>
        </div>
      )}

      {!sprintActive && (
        <div className="sprint-setup" style={{ 
          padding: '12px 20px', 
          background: 'var(--bg-secondary)',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <span style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>🏃 Quick Sprint:</span>
          <select 
            value={sprintTime} 
            onChange={(e) => setSprintTime(parseInt(e.target.value))}
            style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-subtle)', padding: '6px 12px', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)' }}
          >
            <option value={5}>5 min</option>
            <option value={10}>10 min</option>
            <option value={15}>15 min</option>
            <option value={25}>25 min</option>
            <option value={30}>30 min</option>
            <option value={45}>45 min</option>
            <option value={60}>60 min</option>
          </select>
          <button className="btn btn-primary btn-sm" onClick={startSprint}>Start Sprint</button>
        </div>
      )}

      {/* AI Panel */}
      {showAI && (
        <section 
          className="ai-panel" 
          aria-label="AI Writing Assistant"
          aria-live="polite"
        >
          <div className="ai-panel-header">
            <h4>AI Writing Assistant</h4>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <label style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
                <input 
                  type="radio" 
                  checked={aiInsertMode === "append"} 
                  onChange={() => setAiInsertMode("append")}
                /> Append
              </label>
              <label style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
                <input 
                  type="radio" 
                  checked={aiInsertMode === "replace"} 
                  onChange={() => setAiInsertMode("replace")}
                /> Replace
              </label>
            </div>
          </div>
          
          <div className="ai-modes-section">
            <div className="ai-mode-category">
              <span className="ai-category-label">✍️ Writing</span>
              <div className="ai-modes-grid">
                {AI_MODES.filter(m => m.category === "writing").map(mode => (
                  <button
                    key={mode.id}
                    onClick={() => setAiMode(mode.id as AIRequest["type"])}
                    className={`ai-mode-btn ${aiMode === mode.id ? "active" : ""}`}
                  >
                    <span className="ai-mode-icon">{mode.icon}</span>
                    <span className="ai-mode-label">{mode.label}</span>
                  </button>
                ))}
              </div>
            </div>
            
            <div className="ai-mode-category">
              <span className="ai-category-label">🎭 Character</span>
              <div className="ai-modes-grid">
                {AI_MODES.filter(m => m.category === "creation").slice(0, 6).map(mode => (
                  <button
                    key={mode.id}
                    onClick={() => setAiMode(mode.id as AIRequest["type"])}
                    className={`ai-mode-btn ${aiMode === mode.id ? "active" : ""}`}
                  >
                    <span className="ai-mode-icon">{mode.icon}</span>
                    <span className="ai-mode-label">{mode.label}</span>
                  </button>
                ))}
              </div>
            </div>
            
            <div className="ai-mode-category">
              <span className="ai-category-label">📋 Summary & Planning</span>
              <div className="ai-modes-grid">
                {AI_MODES.filter(m => m.category === "planning" || m.category === "summary").map(mode => (
                  <button
                    key={mode.id}
                    onClick={() => setAiMode(mode.id as AIRequest["type"])}
                    className={`ai-mode-btn ${aiMode === mode.id ? "active" : ""}`}
                  >
                    <span className="ai-mode-icon">{mode.icon}</span>
                    <span className="ai-mode-label">{mode.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
          
          <button 
            className="ai-submit-btn" 
            onClick={handleAI} 
            disabled={aiLoading} 
            aria-busy={aiLoading}
            tabIndex={0}
          >
            {aiLoading ? "🤔 Thinking..." : `✨ ${AI_MODES.find(m => m.id === aiMode)?.label}`}
          </button>
          
          {aiError && <div className="ai-error" role="alert">{aiError}</div>}
          
          {aiResult && (
            <div className="ai-result-container" role="region" aria-label="AI Suggestion">
              <div className="ai-result">{aiResult}</div>
              <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                <button className="btn btn-primary btn-sm" onClick={() => insertAIResult(aiInsertMode)}>
                  {aiInsertMode === "append" ? "➕ Append to Scene" : "🔄 Replace Content"}
                </button>
                <button className="btn btn-ghost btn-sm" onClick={() => setAiResult("")}>Dismiss</button>
              </div>
            </div>
          )}
        </section>
      )}

      {/* Main Editor Area */}
      <div className={`editor-wrapper ${splitView ? "split" : ""}`}>
        <div className="editor-main">
          <RichTextEditor
            content={scene.content}
            onChange={handleContentChange}
            placeholder="Start writing your scene..."
            typewriterMode={settings.typewriterMode}
          />
        </div>

        {/* Sidebar */}
        <div className="editor-sidebar">
          {/* Session Goal */}
          <div className="sidebar-section session-goal">
            <h4>Session Goal</h4>
            <div className="goal-progress">
              <div className="goal-bar">
                <div className="goal-fill" style={{ width: `${sessionGoalProgress}%` }} />
              </div>
              <span>{writingSession.wordsWritten} / {settings.sessionGoal || 500} words</span>
            </div>
          </div>

          {/* Scene Stats */}
          <div className="sidebar-section">
            <h4>Scene Stats</h4>
            <div className="stats-row" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Words</span>
              <span style={{ fontWeight: '600' }}>{calculateWordCount(scene.content).toLocaleString()}</span>
            </div>
            <div className="scene-card-progress">
              <div className="progress-fill" style={{ width: `${Math.min(100, (calculateWordCount(scene.content) / 900) * 100)}%`, background: scene.color }} />
            </div>
            <span className="pulse-text">{Math.min(100, Math.round((calculateWordCount(scene.content) / 900) * 100))}% of ~900 word target</span>
          </div>

          {/* Story Beats */}
          <div className="sidebar-section">
            <h4>Story Beats</h4>
            <div className="beat-inputs">
              <textarea
                placeholder="Goal: What does the character want?"
                value={scene.goal}
                onChange={(e) => updateScene(scene.id, { goal: e.target.value })}
              />
              <textarea
                placeholder="Conflict: What stands in the way?"
                value={scene.conflict}
                onChange={(e) => updateScene(scene.id, { conflict: e.target.value })}
              />
              <textarea
                placeholder="Outcome: How does it end?"
                value={scene.outcome}
                onChange={(e) => updateScene(scene.id, { outcome: e.target.value })}
              />
            </div>
          </div>

          {/* Revisions */}
          {showRevisions && (
            <div className="sidebar-section">
              <h4>Revision History</h4>
              {sceneRevisions.slice(0, 10).map((rev) => (
                <div key={rev.id} className="revision-item" onClick={async () => {
                  const confirmed = await showConfirm("Restore Revision", `Restore version from ${new Date(rev.createdAt).toLocaleString()}?`);
                  if (confirmed) updateScene(scene.id, { content: rev.content });
                }}>
                  <span className="rev-time">{new Date(rev.createdAt).toLocaleString()}</span>
                  <span className="rev-words">{rev.wordCount.toLocaleString()} words</span>
                </div>
              ))}
              {sceneRevisions.length === 0 && <p className="no-revisions">No revisions yet</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
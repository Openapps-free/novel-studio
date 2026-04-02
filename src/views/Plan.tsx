import { useState } from "react";
import { useStore } from "../store";
import { calculateWordCount } from "../services/storage";

export function PlanView() {
  const { 
    getProject, 
    getCurrentChapter,
    selectChapter,
    selectScene,
    setCurrentView,
    reorderScenes,
    updateScene,
    addScene,
    addChapter,
  } = useStore();
  
  const project = getProject();
  const currentChapter = getCurrentChapter();
  const [draggedScene, setDraggedScene] = useState<string | null>(null);
  const [dragOverScene, setDragOverScene] = useState<string | null>(null);
  const [expandedScene, setExpandedScene] = useState<string | null>(null);

  if (!project) {
    return (
      <div className="view plan-view">
        <div className="empty-state">
          <h2>No Project</h2>
          <p>Create a project to start planning</p>
        </div>
      </div>
    );
  }

  const handleDragStart = (e: React.DragEvent, sceneId: string) => {
    setDraggedScene(sceneId);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", sceneId);
  };

  const handleDragOver = (e: React.DragEvent, sceneId: string) => {
    e.preventDefault();
    if (draggedScene && draggedScene !== sceneId) {
      setDragOverScene(sceneId);
    }
  };

  const handleDragLeave = () => {
    setDragOverScene(null);
  };

  const handleDrop = (e: React.DragEvent, targetSceneId: string) => {
    e.preventDefault();
    if (!draggedScene || draggedScene === targetSceneId) return;
    
    const chapterScenes = project.scenes.filter(s => s.chapterId === currentChapter?.id);
    const draggedIndex = chapterScenes.findIndex(s => s.id === draggedScene);
    const targetIndex = chapterScenes.findIndex(s => s.id === targetSceneId);
    
    if (draggedIndex === -1 || targetIndex === -1) return;
    
    const newOrder = [...chapterScenes];
    const [removed] = newOrder.splice(draggedIndex, 1);
    if (removed) newOrder.splice(targetIndex, 0, removed);
    
    reorderScenes(currentChapter!.id, newOrder.map(s => s.id));
    setDraggedScene(null);
    setDragOverScene(null);
  };

  const handleDragEnd = () => {
    setDraggedScene(null);
    setDragOverScene(null);
  };

  return (
    <div className="view plan-view">
      <div className="plan-header">
        <h2>Story Matrix</h2>
        <button className="btn btn-primary" onClick={() => addChapter("New Chapter")}>
          + Add Chapter
        </button>
      </div>
      
      <div className="timeline-nav">
        {project.chapters.map((chapter, idx) => (
          <div 
            key={chapter.id} 
            className={`timeline-chapter ${chapter.id === currentChapter?.id ? "active" : ""}`}
            onClick={() => selectChapter(chapter.id)}
          >
            <span className="timeline-num">{idx + 1}</span>
            <span className="timeline-name">{chapter.title}</span>
          </div>
        ))}
      </div>
      
      <div className="matrix-grid">
        {project.chapters.map((chapter) => (
          <div key={chapter.id} className="matrix-column">
            <div className="column-header">{chapter.title}</div>
            <div className="column-scenes">
              {project.scenes
                .filter(s => s.chapterId === chapter.id)
                .map((scene, idx) => (
                  <div
                    key={scene.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, scene.id)}
                    onDragOver={(e) => handleDragOver(e, scene.id)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, scene.id)}
                    onDragEnd={handleDragEnd}
                    className={`scene-card ${draggedScene === scene.id ? "dragging" : ""} ${dragOverScene === scene.id ? "drag-over" : ""}`}
                    style={{ 
                      borderLeftColor: scene.color,
                      opacity: draggedScene === scene.id ? 0.5 : 1,
                      transform: dragOverScene === scene.id ? 'scale(1.02)' : 'none',
                    }}
                    onClick={() => {
                      selectScene(scene.id);
                      setCurrentView("write");
                    }}
                  >
                    <div className="scene-card-drag-handle" style={{ 
                      cursor: 'grab', 
                      marginRight: '8px',
                      color: 'var(--text-muted)',
                      fontSize: '16px'
                    }}>
                      ⋮⋮
                    </div>
                    <div className="scene-card-content" style={{ flex: 1 }}>
                      <div className="scene-card-header">
                        <input
                          value={scene.title}
                          onChange={(e) => updateScene(scene.id, { title: e.target.value })}
                          onClick={(e) => e.stopPropagation()}
                          className="scene-card-title"
                          style={{ background: 'transparent', border: 'none', fontSize: '15px', fontWeight: '600', color: 'var(--text-primary)', width: '100%' }}
                        />
                        <select
                          value={scene.status}
                          onChange={(e) => updateScene(scene.id, { status: e.target.value as any })}
                          onClick={(e) => e.stopPropagation()}
                          className={`scene-card-status ${scene.status}`}
                          style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-subtle)', padding: '4px 8px', borderRadius: '4px', fontSize: '10px' }}
                        >
                          <option value="outline">Outline</option>
                          <option value="draft">Draft</option>
                          <option value="revising">Revising</option>
                          <option value="complete">Complete</option>
                        </select>
                      </div>
                      <input
                        value={scene.summary}
                        onChange={(e) => updateScene(scene.id, { summary: e.target.value })}
                        onClick={(e) => e.stopPropagation()}
                        placeholder="Add summary..."
                        className="scene-card-summary"
                        style={{ background: 'transparent', border: 'none', fontSize: '13px', color: 'var(--text-secondary)', width: '100%', marginBottom: '8px' }}
                      />
                      <div className="scene-card-meta">
                        <input
                          value={scene.pov}
                          onChange={(e) => updateScene(scene.id, { pov: e.target.value })}
                          onClick={(e) => e.stopPropagation()}
                          placeholder="POV"
                          style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-subtle)', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', color: 'var(--text-secondary)', width: '60px' }}
                        />
                        <input
                          value={scene.location}
                          onChange={(e) => updateScene(scene.id, { location: e.target.value })}
                          onClick={(e) => e.stopPropagation()}
                          placeholder="Location"
                          style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-subtle)', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', color: 'var(--text-secondary)', width: '80px' }}
                        />
                        <span style={{ marginLeft: 'auto', color: 'var(--text-muted)', fontSize: '11px' }}>
                          #{idx + 1}
                        </span>
                      </div>
                      <div className="scene-card-progress">
                        <div className="progress-fill" style={{ width: `${Math.min(100, (calculateWordCount(scene.content) / 1000) * 100)}%`, background: scene.color }} />
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setExpandedScene(expandedScene === scene.id ? null : scene.id);
                        }}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: 'var(--accent-primary)',
                          fontSize: '12px',
                          cursor: 'pointer',
                          padding: '4px 0',
                          marginTop: '4px'
                        }}
                      >
                        {expandedScene === scene.id ? '▼ Hide Details' : '▶ Show Details'}
                      </button>
                      {expandedScene === scene.id && (
                        <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid var(--border-subtle)' }}>
                          <div style={{ marginBottom: '8px' }}>
                            <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>GOAL</label>
                            <input
                              value={scene.goal}
                              onChange={(e) => updateScene(scene.id, { goal: e.target.value })}
                              onClick={(e) => e.stopPropagation()}
                              placeholder="What does the character want?"
                              style={{ width: '100%', background: 'var(--bg-primary)', border: '1px solid var(--border-subtle)', padding: '8px', borderRadius: '4px', fontSize: '12px', color: 'var(--text-primary)' }}
                            />
                          </div>
                          <div style={{ marginBottom: '8px' }}>
                            <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>CONFLICT</label>
                            <input
                              value={scene.conflict}
                              onChange={(e) => updateScene(scene.id, { conflict: e.target.value })}
                              onClick={(e) => e.stopPropagation()}
                              placeholder="What stands in their way?"
                              style={{ width: '100%', background: 'var(--bg-primary)', border: '1px solid var(--border-subtle)', padding: '8px', borderRadius: '4px', fontSize: '12px', color: 'var(--text-primary)' }}
                            />
                          </div>
                          <div>
                            <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>OUTCOME</label>
                            <input
                              value={scene.outcome}
                              onChange={(e) => updateScene(scene.id, { outcome: e.target.value })}
                              onClick={(e) => e.stopPropagation()}
                              placeholder="What happens as a result?"
                              style={{ width: '100%', background: 'var(--bg-primary)', border: '1px solid var(--border-subtle)', padding: '8px', borderRadius: '4px', fontSize: '12px', color: 'var(--text-primary)' }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                <button 
                  onClick={() => addScene(chapter.id)}
                  style={{ 
                    width: '100%', 
                    padding: '12px', 
                    background: 'var(--bg-tertiary)', 
                    border: '1px dashed var(--border-default)', 
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--text-tertiary)',
                    cursor: 'pointer',
                    marginTop: '8px'
                  }}
                >
                  + Add Scene
                </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

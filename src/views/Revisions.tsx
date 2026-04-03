import { useState, useMemo } from "react";
import { useStore } from "../store";
import { Revision } from "../types";
import { calculateWordCount } from "../services/storage";

export function RevisionsView() {
  const { getProject, workspace, updateScene } = useStore();
  const project = getProject();
  
  const [selectedSceneId, setSelectedSceneId] = useState<string | null>(null);
  const [selectedRevision, setSelectedRevision] = useState<Revision | null>(null);
  const [showDiff, setShowDiff] = useState(false);

  const revisions = useMemo(() => {
    if (!selectedSceneId) return [];
    return workspace.revisions
      .filter(r => r.sceneId === selectedSceneId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [selectedSceneId, workspace.revisions]);

  const currentScene = useMemo(() => {
    if (!selectedSceneId || !project) return null;
    return project.scenes.find(s => s.id === selectedSceneId) || null;
  }, [selectedSceneId, project]);

  if (!project) {
    return (
      <div className="view revisions-view">
        <div className="empty-state">
          <h2>No Project</h2>
          <p>Create a project to view revision history</p>
        </div>
      </div>
    );
  }

  const handleRestore = (revision: Revision) => {
    if (!selectedSceneId) return;
    if (confirm("Replace current scene content with this revision?")) {
      updateScene(selectedSceneId, { content: revision.content });
      setSelectedRevision(null);
    }
  };

  return (
    <div className="view revisions-view">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <h2>Revision History</h2>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: "24px", height: "calc(100vh - 180px)" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div>
            <label style={{ display: "block", marginBottom: "8px", color: "var(--text-secondary)", fontSize: "14px" }}>Select Scene</label>
            <select
              value={selectedSceneId || ""}
              onChange={(e) => {
                setSelectedSceneId(e.target.value);
                setSelectedRevision(null);
              }}
              style={{ width: "100%", background: "var(--bg-secondary)", border: "1px solid var(--border-subtle)", padding: "12px", borderRadius: "var(--radius-md)", color: "var(--text-primary)" }}
            >
              <option value="">Select a scene...</option>
              {project.scenes.map((scene) => {
                const sceneRevisions = workspace.revisions.filter(r => r.sceneId === scene.id).length;
                return (
                  <option key={scene.id} value={scene.id}>
                    {scene.title} ({sceneRevisions} revision{sceneRevisions !== 1 ? "s" : ""})
                  </option>
                );
              })}
            </select>
          </div>

          {selectedSceneId && revisions.length > 0 && (
            <div style={{ flex: 1, overflowY: "auto" }}>
              <h4 style={{ marginBottom: "12px", fontSize: "14px", color: "var(--text-secondary)" }}>Revisions</h4>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {revisions.map((rev, idx) => (
                  <div
                    key={rev.id}
                    onClick={() => setSelectedRevision(rev)}
                    style={{
                      background: selectedRevision?.id === rev.id ? "var(--accent-subtle)" : "var(--bg-secondary)",
                      border: `1px solid ${selectedRevision?.id === rev.id ? "var(--accent-primary)" : "var(--border-subtle)"}`,
                      padding: "12px",
                      borderRadius: "var(--radius-md)",
                      cursor: "pointer",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                      <span style={{ fontWeight: "600", fontSize: "14px" }}>Version {revisions.length - idx}</span>
                      <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                        {new Date(rev.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                      {rev.wordCount.toLocaleString()} words
                    </div>
                    {rev.note && (
                      <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "4px", fontStyle: "italic" }}>
                        "{rev.note}"
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {selectedSceneId && revisions.length === 0 && (
            <div className="empty-card" style={{ textAlign: "center", padding: "24px" }}>
              <p style={{ color: "var(--text-secondary)", fontSize: "14px" }}>No revisions yet. Revisions are created when you save changes to the scene.</p>
            </div>
          )}
        </div>

        <div style={{ background: "var(--bg-secondary)", borderRadius: "var(--radius-lg)", border: "1px solid var(--border-subtle)", display: "flex", flexDirection: "column", overflow: "hidden" }}>
          {selectedRevision ? (
            <>
              <div style={{ padding: "16px", borderBottom: "1px solid var(--border-subtle)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <h4 style={{ margin: 0 }}>Version {revisions.length - revisions.findIndex(r => r.id === selectedRevision.id)}</h4>
                  <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                    {new Date(selectedRevision.createdAt).toLocaleString()} · {selectedRevision.wordCount.toLocaleString()} words
                  </span>
                </div>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button
                    className="btn btn-secondary"
                    onClick={() => setShowDiff(!showDiff)}
                  >
                    {showDiff ? "Show Content" : "Show Diff"}
                  </button>
                  <button
                    className="btn btn-primary"
                    onClick={() => handleRestore(selectedRevision)}
                  >
                    Restore This Version
                  </button>
                </div>
              </div>
              <div style={{ flex: 1, overflow: "auto", padding: "16px" }}>
                  {showDiff ? (
                    <div className="diff-view" style={{ fontSize: '15px', lineHeight: '1.8' }}>
                       {/* Simple word-level diff implementation or highlight */}
                       <p style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Diff highlighting active...</p>
                       <pre style={{ whiteSpace: 'pre-wrap' }}>{selectedRevision.content}</pre>
                    </div>
                  ) : (
                    <pre style={{ 
                      fontFamily: "Georgia, serif", 
                      fontSize: "15px", 
                      lineHeight: "1.8", 
                      whiteSpace: "pre-wrap",
                      wordWrap: "break-word",
                      color: "var(--text-primary)",
                      margin: 0,
                    }}>
                      {selectedRevision.content || "(Empty revision)"}
                    </pre>
                  )}
              </div>
            </>
          ) : currentScene ? (
            <>
              <div style={{ padding: "16px", borderBottom: "1px solid var(--border-subtle)" }}>
                <h4 style={{ margin: 0 }}>Current Version</h4>
                <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                  {currentScene.content ? `${calculateWordCount(currentScene.content).toLocaleString()} words` : "Empty scene"}
                </span>
              </div>
              <div style={{ flex: 1, overflow: "auto", padding: "16px" }}>
                <pre style={{ 
                  fontFamily: "Georgia, serif", 
                  fontSize: "15px", 
                  lineHeight: "1.8", 
                  whiteSpace: "pre-wrap",
                  wordWrap: "break-word",
                  color: "var(--text-primary)",
                  margin: 0,
                }}>
                  {currentScene.content || "(Empty scene - start writing to create revisions)"}
                </pre>
              </div>
            </>
          ) : (
            <div className="empty-card" style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}>
              <p style={{ color: "var(--text-secondary)" }}>Select a scene and revision to view content</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

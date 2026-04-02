import { useState, useMemo } from "react";
import { useStore } from "../store";
import { analyzeText, getStoryBeats, analyzeWriting, getWritingStats, TextAnalysis, WritingFeedback } from "../services/localAI";

export function AnalyzeView() {
  const { getProject, getCurrentScene } = useStore();
  const project = getProject();
  const currentScene = getCurrentScene();
  
  const [selectedSceneId, setSelectedSceneId] = useState<string | null>(currentScene?.id || null);
  const [activeTab, setActiveTab] = useState<"stats" | "scene" | "beats" | "feedback">("stats");

  const selectedScene = useMemo(() => {
    if (!selectedSceneId) return null;
    return project?.scenes.find(s => s.id === selectedSceneId) || null;
  }, [selectedSceneId, project]);

  const sceneAnalysis: TextAnalysis | null = useMemo(() => {
    if (!selectedScene?.content) return null;
    return analyzeText(selectedScene.content, selectedScene);
  }, [selectedScene]);

  const writingFeedback: WritingFeedback | null = useMemo(() => {
    if (!selectedScene?.content) return null;
    return analyzeWriting(selectedScene.content);
  }, [selectedScene]);

  const storyBeats = useMemo(() => {
    if (!project) return null;
    return getStoryBeats(project);
  }, [project]);

  const writingStats = useMemo(() => {
    if (!project) return null;
    return getWritingStats(project);
  }, [project]);

  if (!project) {
    return (
      <div className="view analyze-view">
        <div className="empty-state">
          <h2>No Project</h2>
          <p>Create a project to analyze your writing</p>
        </div>
      </div>
    );
  }

  return (
    <div className="view analyze-view">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <h2>Writing Analysis</h2>
      </div>

      <div style={{ display: "flex", gap: "8px", marginBottom: "24px", borderBottom: "1px solid var(--border-subtle)", paddingBottom: "8px" }}>
        {(["stats", "scene", "beats", "feedback"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              background: activeTab === tab ? "var(--accent-primary)" : "transparent",
              color: activeTab === tab ? "white" : "var(--text-secondary)",
              border: "none",
              padding: "8px 16px",
              borderRadius: "var(--radius-md)",
              cursor: "pointer",
              textTransform: "capitalize",
            }}
          >
            {tab === "stats" ? "Project Stats" : tab === "scene" ? "Scene Analysis" : tab === "beats" ? "Story Beats" : "Writing Feedback"}
          </button>
        ))}
      </div>

      {activeTab === "stats" && writingStats && (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px", marginBottom: "24px" }}>
            <div style={{ background: "var(--bg-secondary)", padding: "20px", borderRadius: "var(--radius-md)", textAlign: "center" }}>
              <div style={{ fontSize: "32px", fontWeight: "700", color: "var(--accent-primary)" }}>{writingStats.totalWords.toLocaleString()}</div>
              <div style={{ color: "var(--text-secondary)", fontSize: "14px" }}>Total Words</div>
            </div>
            <div style={{ background: "var(--bg-secondary)", padding: "20px", borderRadius: "var(--radius-md)", textAlign: "center" }}>
              <div style={{ fontSize: "32px", fontWeight: "700", color: "var(--accent-primary)" }}>{writingStats.totalScenes}</div>
              <div style={{ color: "var(--text-secondary)", fontSize: "14px" }}>Scenes</div>
            </div>
            <div style={{ background: "var(--bg-secondary)", padding: "20px", borderRadius: "var(--radius-md)", textAlign: "center" }}>
              <div style={{ fontSize: "32px", fontWeight: "700", color: "var(--accent-primary)" }}>{writingStats.progress}%</div>
              <div style={{ color: "var(--text-secondary)", fontSize: "14px" }}>Complete</div>
            </div>
            <div style={{ background: "var(--bg-secondary)", padding: "20px", borderRadius: "var(--radius-md)", textAlign: "center" }}>
              <div style={{ fontSize: "32px", fontWeight: "700", color: "var(--accent-primary)" }}>{writingStats.estimatedChapters}</div>
              <div style={{ color: "var(--text-secondary)", fontSize: "14px" }}>Est. Chapters</div>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
            <div style={{ background: "var(--bg-secondary)", padding: "20px", borderRadius: "var(--radius-md)" }}>
              <h4 style={{ marginBottom: "16px" }}>Scene Status</h4>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {Object.entries(writingStats.statusBreakdown).map(([status, count]) => (
                  <div key={status} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ textTransform: "capitalize", color: "var(--text-secondary)" }}>{status}</span>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <div style={{ width: "100px", height: "8px", background: "var(--bg-tertiary)", borderRadius: "4px", overflow: "hidden" }}>
                        <div style={{ width: `${(count / writingStats.totalScenes) * 100}%`, height: "100%", background: status === "complete" ? "#22c55e" : status === "draft" ? "#f97316" : "#8b5cf6" }} />
                      </div>
                      <span style={{ fontWeight: "600" }}>{count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ background: "var(--bg-secondary)", padding: "20px", borderRadius: "var(--radius-md)" }}>
              <h4 style={{ marginBottom: "16px" }}>Chapter Breakdown</h4>
              <div style={{ maxHeight: "200px", overflowY: "auto" }}>
                {writingStats.chapterStats.map((ch, idx) => (
                  <div key={idx} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid var(--border-subtle)" }}>
                    <span style={{ color: "var(--text-primary)" }}>{ch.title}</span>
                    <span style={{ color: "var(--text-secondary)" }}>{ch.wordCount.toLocaleString()} words · {ch.sceneCount} scenes</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "scene" && (
        <div>
          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", marginBottom: "8px", color: "var(--text-secondary)" }}>Select Scene to Analyze</label>
            <select
              value={selectedSceneId || ""}
              onChange={(e) => setSelectedSceneId(e.target.value)}
              style={{ width: "100%", maxWidth: "400px", background: "var(--bg-secondary)", border: "1px solid var(--border-subtle)", padding: "12px", borderRadius: "var(--radius-md)", color: "var(--text-primary)" }}
            >
              <option value="">Select a scene...</option>
              {project.scenes.map((scene) => (
                <option key={scene.id} value={scene.id}>{scene.title}</option>
              ))}
            </select>
          </div>

          {sceneAnalysis && selectedScene && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px", marginBottom: "24px" }}>
              <div style={{ background: "var(--bg-secondary)", padding: "16px", borderRadius: "var(--radius-md)", textAlign: "center" }}>
                <div style={{ fontSize: "24px", fontWeight: "700", color: "var(--accent-primary)" }}>{sceneAnalysis.wordCount}</div>
                <div style={{ color: "var(--text-secondary)", fontSize: "12px" }}>Words</div>
              </div>
              <div style={{ background: "var(--bg-secondary)", padding: "16px", borderRadius: "var(--radius-md)", textAlign: "center" }}>
                <div style={{ fontSize: "24px", fontWeight: "700", color: "var(--accent-primary)" }}>{sceneAnalysis.sentenceCount}</div>
                <div style={{ color: "var(--text-secondary)", fontSize: "12px" }}>Sentences</div>
              </div>
              <div style={{ background: "var(--bg-secondary)", padding: "16px", borderRadius: "var(--radius-md)", textAlign: "center" }}>
                <div style={{ fontSize: "24px", fontWeight: "700", color: "var(--accent-primary)" }}>{sceneAnalysis.readingTime}</div>
                <div style={{ color: "var(--text-secondary)", fontSize: "12px" }}>Min Read</div>
              </div>
              <div style={{ background: "var(--bg-secondary)", padding: "16px", borderRadius: "var(--radius-md)", textAlign: "center" }}>
                <div style={{ fontSize: "24px", fontWeight: "700", color: sceneAnalysis.readability === "easy" ? "#22c55e" : sceneAnalysis.readability === "medium" ? "#f97316" : "#f43f5e", textTransform: "capitalize" }}>{sceneAnalysis.readability}</div>
                <div style={{ color: "var(--text-secondary)", fontSize: "12px" }}>Readability</div>
              </div>
            </div>
          )}

          {sceneAnalysis && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
              <div style={{ background: "var(--bg-secondary)", padding: "20px", borderRadius: "var(--radius-md)" }}>
                <h4 style={{ marginBottom: "16px" }}>Content Breakdown</h4>
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "var(--text-secondary)" }}>Dialogue</span>
                    <span style={{ fontWeight: "600" }}>{sceneAnalysis.dialogueWords} words ({Math.round(sceneAnalysis.dialogueWords / sceneAnalysis.wordCount * 100)}%)</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "var(--text-secondary)" }}>Description</span>
                    <span style={{ fontWeight: "600" }}>{sceneAnalysis.descriptionWords} words ({Math.round(sceneAnalysis.descriptionWords / sceneAnalysis.wordCount * 100)}%)</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "var(--text-secondary)" }}>Action</span>
                    <span style={{ fontWeight: "600" }}>{sceneAnalysis.actionWords} words</span>
                  </div>
                </div>
              </div>

              <div style={{ background: "var(--bg-secondary)", padding: "20px", borderRadius: "var(--radius-md)" }}>
                <h4 style={{ marginBottom: "16px" }}>Style Metrics</h4>
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "var(--text-secondary)" }}>Avg Words/Sentence</span>
                    <span style={{ fontWeight: "600" }}>{sceneAnalysis.avgWordsPerSentence}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "var(--text-secondary)" }}>Passive Voice</span>
                    <span style={{ fontWeight: "600", color: sceneAnalysis.passiveVoice > 5 ? "#f43f5e" : "inherit" }}>{sceneAnalysis.passiveVoice} instances</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "var(--text-secondary)" }}>Adverbs</span>
                    <span style={{ fontWeight: "600", color: sceneAnalysis.adverbs > 10 ? "#f97316" : "inherit" }}>{sceneAnalysis.adverbs}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "var(--text-secondary)" }}>Sentiment</span>
                    <span style={{ fontWeight: "600", textTransform: "capitalize", color: sceneAnalysis.sentimentScore > 0 ? "#22c55e" : sceneAnalysis.sentimentScore < 0 ? "#f43f5e" : "inherit" }}>{sceneAnalysis.sentimentScore > 0 ? "Positive" : sceneAnalysis.sentimentScore < 0 ? "Negative" : "Neutral"}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "var(--text-secondary)" }}>Tense</span>
                    <span style={{ fontWeight: "600", textTransform: "capitalize" }}>{sceneAnalysis.tense}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {!sceneAnalysis && selectedScene && (
            <div className="empty-card" style={{ textAlign: "center", padding: "40px" }}>
              <p style={{ color: "var(--text-secondary)" }}>This scene is empty. Write some content to see analysis.</p>
            </div>
          )}
        </div>
      )}

      {activeTab === "beats" && storyBeats && (
        <div>
          <div style={{ marginBottom: "24px" }}>
            <h4 style={{ marginBottom: "16px" }}>Three-Act Structure</h4>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {storyBeats.acts.map((act, idx) => (
                <div key={idx} style={{ background: "var(--bg-secondary)", padding: "16px", borderRadius: "var(--radius-md)" }}>
                  <div style={{ fontWeight: "600", marginBottom: "4px" }}>{act.name}</div>
                  <div style={{ color: "var(--text-secondary)", fontSize: "14px" }}>{act.description}</div>
                  {act.scenes.length > 0 && (
                    <div style={{ marginTop: "8px", fontSize: "12px", color: "var(--text-muted)" }}>
                      Scenes: {act.scenes.slice(0, 3).join(", ")}{act.scenes.length > 3 ? ` +${act.scenes.length - 3} more` : ""}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div>
            <h4 style={{ marginBottom: "16px" }}>Hero's Journey Beats</h4>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px" }}>
              {storyBeats.beats.map((beat, idx) => (
                <div key={idx} style={{ background: "var(--bg-secondary)", padding: "12px", borderRadius: "var(--radius-md)", fontSize: "13px" }}>
                  <div style={{ fontWeight: "600", marginBottom: "4px" }}>{beat.name}</div>
                  <div style={{ color: "var(--text-secondary)" }}>{beat.description}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === "feedback" && (
        <div>
          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", marginBottom: "8px", color: "var(--text-secondary)" }}>Select Scene for Feedback</label>
            <select
              value={selectedSceneId || ""}
              onChange={(e) => setSelectedSceneId(e.target.value)}
              style={{ width: "100%", maxWidth: "400px", background: "var(--bg-secondary)", border: "1px solid var(--border-subtle)", padding: "12px", borderRadius: "var(--radius-md)", color: "var(--text-primary)" }}
            >
              <option value="">Select a scene...</option>
              {project.scenes.map((scene) => (
                <option key={scene.id} value={scene.id}>{scene.title}</option>
              ))}
            </select>
          </div>

          {writingFeedback && (
            <>
              {writingFeedback.issues.length > 0 && (
                <div style={{ marginBottom: "24px" }}>
                  <h4 style={{ marginBottom: "16px" }}>Issues & Suggestions</h4>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {writingFeedback.issues.map((issue, idx) => (
                      <div
                        key={idx}
                        style={{
                          background: issue.type === "error" ? "rgba(244,63,94,0.1)" : issue.type === "warning" ? "rgba(249,115,22,0.1)" : "rgba(139,92,246,0.1)",
                          borderLeft: `3px solid ${issue.type === "error" ? "#f43f5e" : issue.type === "warning" ? "#f97316" : "#8b5cf6"}`,
                          padding: "12px",
                          borderRadius: "var(--radius-md)",
                        }}
                      >
                        <span style={{ textTransform: "capitalize", fontWeight: "600", marginRight: "8px" }}>{issue.type}</span>
                        <span style={{ color: "var(--text-secondary)" }}>{issue.message}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {writingFeedback.strengths.length > 0 && (
                <div style={{ marginBottom: "24px" }}>
                  <h4 style={{ marginBottom: "16px" }}>Strengths</h4>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {writingFeedback.strengths.map((strength, idx) => (
                      <div
                        key={idx}
                        style={{
                          background: "rgba(34,197,94,0.1)",
                          borderLeft: "3px solid #22c55e",
                          padding: "12px",
                          borderRadius: "var(--radius-md)",
                          color: "var(--text-secondary)",
                        }}
                      >
                        {strength}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {writingFeedback.suggestions.length > 0 && (
                <div>
                  <h4 style={{ marginBottom: "16px" }}>Tips</h4>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {writingFeedback.suggestions.map((suggestion, idx) => (
                      <div
                        key={idx}
                        style={{
                          background: "var(--bg-secondary)",
                          padding: "12px",
                          borderRadius: "var(--radius-md)",
                          color: "var(--text-secondary)",
                        }}
                      >
                        {suggestion}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {!writingFeedback && selectedScene && (
            <div className="empty-card" style={{ textAlign: "center", padding: "40px" }}>
              <p style={{ color: "var(--text-secondary)" }}>This scene is empty. Write some content to get feedback.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

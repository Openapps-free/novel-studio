import { useState } from "react";
import { useStore } from "../store";
import { exportProject, downloadFile, ExportFormat } from "../services/export";
import { downloadWorkspaceBackup, importWorkspaceFromJSON } from "../services/storage";
import { LOCAL_MODELS, CLOUD_MODELS } from "../services/ai";

export function SettingsView() {
  const { 
    settings, 
    setTheme, 
    updateSettings,
    getProject,
    writingSession,
    resetSession,
    workspace,
    setWorkspaceDirect,
  } = useStore();
  
  const project = getProject();
  const [exporting, setExporting] = useState<ExportFormat | null>(null);

  const handleExport = async (format: ExportFormat) => {
    if (!project) return;
    setExporting(format);
    try {
      const result = await exportProject(project, format);
      downloadFile(result);
    } catch (error) {
      console.error("Export failed:", error);
      alert(`Export failed: ${error}`);
    } finally {
      setExporting(null);
    }
  };

  const sessionMinutes = Math.floor((Date.now() - writingSession.startTime) / 60000);

  return (
    <div className="view settings-view">
      <h2>Settings</h2>
      
      <div className="settings-section">
        <h3>Appearance</h3>
        <div className="setting-item">
          <label>Theme</label>
          <div className="theme-buttons">
            <button 
              className={`theme-btn ${settings.theme === "dark" ? "active" : ""}`} 
              onClick={() => setTheme("dark")}
            >
              🌙 Dark
            </button>
            <button 
              className={`theme-btn ${settings.theme === "light" ? "active" : ""}`} 
              onClick={() => setTheme("light")}
            >
              ☀️ Light
            </button>
            <button 
              className={`theme-btn ${settings.theme === "sepia" ? "active" : ""}`} 
              onClick={() => setTheme("sepia")}
            >
              📜 Sepia
            </button>
            <button 
              className={`theme-btn ${settings.theme === "midnight" ? "active" : ""}`} 
              onClick={() => setTheme("midnight")}
            >
              🌑 Midnight
            </button>
            <button 
              className={`theme-btn ${settings.theme === "zen" ? "active" : ""}`} 
              onClick={() => setTheme("zen")}
            >
              🧘 Zen
            </button>
            <button 
              className={`theme-btn ${settings.theme === "royal" ? "active" : ""}`} 
              onClick={() => setTheme("royal")}
            >
              👑 Royal
            </button>
            <button 
              className={`theme-btn ${settings.theme === "oled" ? "active" : ""}`} 
              onClick={() => setTheme("oled")}
            >
              🖤 OLED
            </button>
          </div>
        </div>
        <div className="setting-item">
          <label>Font Size</label>
          <input 
            type="range" 
            min="14" 
            max="24" 
            value={settings.fontSize} 
            onChange={(e) => updateSettings({ fontSize: parseInt(e.target.value) })} 
          />
          <span>{settings.fontSize}px</span>
        </div>
        <div className="setting-item">
          <label>Font Family</label>
          <select value={settings.fontFamily} onChange={(e) => updateSettings({ fontFamily: e.target.value })}>
            <option value="Georgia">Georgia</option>
            <option value="Times New Roman">Times New Roman</option>
            <option value="Arial">Arial</option>
            <option value="Verdana">Verdana</option>
            <option value="Courier New">Courier New</option>
          </select>
        </div>
      </div>

      <div className="settings-section">
        <h3>Writing Goals</h3>
        <div className="setting-item">
          <label>Daily Goal</label>
          <input 
            type="number" 
            value={settings.dailyGoal} 
            onChange={(e) => updateSettings({ dailyGoal: parseInt(e.target.value) })} 
          />
          <span>words</span>
        </div>
        <div className="setting-item">
          <label>Session Goal</label>
          <input 
            type="number" 
            value={settings.sessionGoal} 
            onChange={(e) => updateSettings({ sessionGoal: parseInt(e.target.value) })} 
          />
          <span>words</span>
        </div>
      </div>

      <div className="settings-section">
        <h3>AI Configuration</h3>
        
        <div className="setting-item">
          <label>AI Provider</label>
          <select 
            value={settings.apiProvider} 
            onChange={(e) => updateSettings({ apiProvider: e.target.value as any })}
          >
            <option value="openai">OpenAI (GPT-4)</option>
            <option value="anthropic">Anthropic (Claude)</option>
            <option value="ollama">Ollama (Local)</option>
            <option value="lmstudio">LM Studio (Local)</option>
          </select>
        </div>

        {(settings.apiProvider === "openai" || settings.apiProvider === "anthropic") && (
          <div className="setting-item">
            <label>Cloud Model</label>
            <select 
              value={settings.cloudModel}
              onChange={(e) => updateSettings({ cloudModel: e.target.value })}
            >
              {settings.apiProvider === "openai" && CLOUD_MODELS.filter(m => m.provider === "openai").map(m => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
              {settings.apiProvider === "anthropic" && CLOUD_MODELS.filter(m => m.provider === "anthropic").map(m => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </div>
        )}

        {(settings.apiProvider === "ollama" || settings.apiProvider === "lmstudio") && (
          <div className="setting-item">
            <label>Local Model</label>
            <select 
              value={settings.localModel}
              onChange={(e) => updateSettings({ localModel: e.target.value })}
            >
              {LOCAL_MODELS.filter(m => m.provider === settings.apiProvider).map(m => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
            <small style={{ gridColumn: "1 / -1", marginTop: "-12px" }}>
              {settings.apiProvider === "ollama" 
                ? "Make sure Ollama is running: ollama serve" 
                : "Make sure LM Studio server is enabled (Server tab)"}
            </small>
          </div>
        )}

        {(settings.apiProvider === "openai" || settings.apiProvider === "anthropic") && (
          <div className="setting-item">
            <label>API Key</label>
            <input 
              type="password" 
              value={settings.apiKey}
              onChange={(e) => updateSettings({ apiKey: e.target.value })}
              placeholder={settings.apiProvider === "openai" ? "sk-..." : "sk-ant-..."}
            />
            <small>{settings.apiProvider === "openai" ? "Get key from openai.com/api-key" : "Get key from anthropic.com"}</small>
          </div>
        )}

        {(settings.apiProvider === "ollama" || settings.apiProvider === "lmstudio") && (
          <div className="ai-status-card">
            <div className="ai-status-header">
              <span className="ai-status-icon">🖥️</span>
              <span className="ai-status-title">Local AI Ready</span>
            </div>
            <p className="ai-status-desc">
              {settings.apiProvider === "ollama" 
                ? "Ollama is running locally. No API key needed - your data stays on your machine."
                : "LM Studio is running locally. Your data stays on your machine."}
            </p>
          </div>
        )}
      </div>

      <div className="settings-section">
        <h3>Export Your Work</h3>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '16px', fontSize: '14px' }}>
          Choose a format to export your manuscript
        </p>
        <div className="export-options">
          <button 
            className="export-btn" 
            onClick={() => handleExport("pdf")}
            disabled={!project || exporting !== null}
          >
            <span className="export-icon">📄</span>
            <span className="export-label">PDF</span>
            <span className="export-desc">Print-ready document</span>
          </button>
          <button 
            className="export-btn" 
            onClick={() => handleExport("docx")}
            disabled={!project || exporting !== null}
          >
            <span className="export-icon">📝</span>
            <span className="export-label">DOCX</span>
            <span className="export-desc">Microsoft Word</span>
          </button>
          <button 
            className="export-btn" 
            onClick={() => handleExport("txt")}
            disabled={!project || exporting !== null}
          >
            <span className="export-icon">📃</span>
            <span className="export-label">TXT</span>
            <span className="export-desc">Plain text</span>
          </button>
          <button 
            className="export-btn" 
            onClick={() => handleExport("html")}
            disabled={!project || exporting !== null}
          >
            <span className="export-icon">🌐</span>
            <span className="export-label">HTML</span>
            <span className="export-desc">Web page</span>
          </button>
          <button 
            className="export-btn" 
            onClick={() => handleExport("epub")}
            disabled={!project || exporting !== null}
          >
            <span className="export-icon">📚</span>
            <span className="export-label">EPUB</span>
            <span className="export-desc">eBook format</span>
          </button>
          <button 
            className="export-btn" 
            onClick={() => handleExport("json")}
            disabled={!project || exporting !== null}
          >
            <span className="export-icon">💾</span>
            <span className="export-label">JSON</span>
            <span className="export-desc">Full backup</span>
          </button>
        </div>
      </div>

      <div className="settings-section">
        <h3>Backup & Restore</h3>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '16px', fontSize: '14px' }}>
          Create a backup of all your projects and data
        </p>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <button className="btn btn-primary" onClick={() => downloadWorkspaceBackup(workspace)}>
            💾 Download Backup
          </button>
          <label className="btn btn-secondary" style={{ cursor: 'pointer' }}>
            📂 Restore Backup
            <input 
              type="file" 
              accept=".json" 
              style={{ display: 'none' }}
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                
                if (!confirm("This will replace ALL current data. Are you sure?")) return;
                
                try {
                  const text = await file.text();
                  const imported = importWorkspaceFromJSON(text);
                  setWorkspaceDirect(imported);
                  alert("Backup restored successfully!");
                } catch (error) {
                  console.error("Restore failed:", error);
                  alert("Failed to restore backup. Invalid file format.");
                }
              }}
            />
          </label>
        </div>
        <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '12px' }}>
          ⚠️ Restoring a backup will replace all current projects and data.
        </p>
      </div>

      <div className="settings-section">
        <h3>Session Stats</h3>
        <div className="session-stats">
          <div className="session-stat">
            <span className="session-value">{writingSession.wordsWritten}</span>
            <span className="session-label">words this session</span>
          </div>
          <div className="session-stat">
            <span className="session-value">{sessionMinutes}</span>
            <span className="session-label">minutes</span>
          </div>
          <button className="reset-btn" onClick={resetSession}>
            New Session
          </button>
        </div>
      </div>

      <div className="settings-section about">
        <h3>About</h3>
        <p className="about-text">Novel Studio v0.2.0</p>
        <p className="about-text">Professional Writing Environment</p>
      </div>
    </div>
  );
}

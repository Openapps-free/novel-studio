import { useStore } from "../store";
import { exportToTXT, exportToJSON } from "../services/storage";
import { ProjectWithRelations } from "../types";

function generateHTML(project: ProjectWithRelations): string {
  let html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${project.title}</title>
  <style>
    body { font-family: Georgia, serif; max-width: 800px; margin: 0 auto; padding: 40px; line-height: 1.8; }
    h1 { text-align: center; margin-bottom: 40px; }
    h2 { margin-top: 40px; page-break-before: always; }
    h3 { margin-top: 30px; }
    p { text-indent: 2em; margin-bottom: 1em; }
    .metadata { text-align: center; color: #666; margin-bottom: 40px; }
  </style>
</head>
<body>
  <h1>${project.title}</h1>
  <div class="metadata">
    <p>Status: ${project.status}</p>
    <p>Target: ${project.targetWordCount} words</p>
  </div>`;

  if (project.synopsis) {
    html += `\n  <h3>Synopsis</h3>\n  <p>${project.synopsis}</p>`;
  }

  for (const chapter of project.chapters) {
    html += `\n  <h2>${chapter.title}</h2>`;
    const chapterScenes = project.scenes.filter(s => s.chapterId === chapter.id);
    for (const scene of chapterScenes) {
      html += `\n  <h3>${scene.title}</h3>`;
      if (scene.content) {
        html += `\n  <p>${scene.content.replace(/\n\n/g, '</p><p>')}</p>`;
      }
    }
  }

  html += `\n</body>\n</html>`;
  return html;
}

export function SettingsView() {
  const { 
    settings, 
    setTheme, 
    updateSettings,
    getProject,
    writingSession,
    resetSession,
  } = useStore();
  
  const project = getProject();
  
  const handleExportTXT = () => {
    if (!project) return;
    const content = exportToTXT(project);
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${project.title}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportJSON = () => {
    if (!project) return;
    const content = exportToJSON(project);
    const blob = new Blob([content], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${project.title}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportHTML = () => {
    if (!project) return;
    const content = generateHTML(project);
    const blob = new Blob([content], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${project.title}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportPDF = () => {
    if (!project) return;
    const html = generateHTML(project);
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.print();
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
          <label>API Provider</label>
          <select 
            value={settings.apiProvider} 
            onChange={(e) => updateSettings({ apiProvider: e.target.value as "openai" | "anthropic" })}
          >
            <option value="openai">OpenAI</option>
            <option value="anthropic">Anthropic</option>
          </select>
        </div>
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
      </div>

      <div className="settings-section">
        <h3>Export Your Work</h3>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '16px', fontSize: '14px' }}>
          Choose a format to export your manuscript
        </p>
        <div className="export-buttons" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
          <button className="btn btn-secondary" onClick={handleExportTXT}>
            📄 TXT (Plain Text)
          </button>
          <button className="btn btn-secondary" onClick={handleExportHTML}>
            🌐 HTML (Web Page)
          </button>
          <button className="btn btn-secondary" onClick={handleExportPDF}>
            📑 PDF (Print via Browser)
          </button>
          <button className="btn btn-secondary" onClick={handleExportJSON}>
            💾 JSON (Backup)
          </button>
        </div>
        <div style={{ marginTop: '16px', padding: '12px', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)' }}>
          <span style={{ fontSize: '13px', color: 'var(--text-tertiary)' }}>
            💡 Tip: Use HTML export and open in Microsoft Word to save as DOCX
          </span>
        </div>
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

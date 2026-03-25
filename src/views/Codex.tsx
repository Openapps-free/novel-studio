import { useState, useMemo } from "react";
import { useStore } from "../store";
import { CodexType } from "../types";

export function CodexView() {
  const { 
    getProject,
    selectedCodexId,
    updateCodexEntry,
    addCodexEntry,
    deleteCodexEntry,
    selectCodex,
  } = useStore();
  
  const project = getProject();
  const selectedCodex = project?.codexEntries.find(e => e.id === selectedCodexId);
  
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<CodexType | "all">("all");

  const filteredEntries = useMemo(() => {
    if (!project) return [];
    return project.codexEntries.filter((entry) => {
      const matchesFilter = filter === "all" || entry.type === filter;
      const matchesSearch = !search || 
        entry.title.toLowerCase().includes(search.toLowerCase()) ||
        entry.summary.toLowerCase().includes(search.toLowerCase());
      return matchesFilter && matchesSearch;
    });
  }, [project, filter, search]);

  if (!project) {
    return (
      <div className="view codex-view">
        <div className="empty-state">
          <h2>No Project</h2>
          <p>Create a project to manage your world-building</p>
        </div>
      </div>
    );
  }

  const typeIcons: Record<CodexType, string> = {
    character: "👤",
    location: "📍",
    item: "💎",
    lore: "📜",
    event: "🎭",
  };

  return (
    <div className="view codex-view">
      <div className="codex-header">
        <h2>World Codex</h2>
        <div className="codex-actions">
          <input
            className="search-input"
            placeholder="Search codex..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button className="add-entry-btn" onClick={() => addCodexEntry("character", "New Character")}>+ Character</button>
          <button className="add-entry-btn" onClick={() => addCodexEntry("location", "New Location")}>+ Location</button>
          <button className="add-entry-btn" onClick={() => addCodexEntry("lore", "New Lore")}>+ Lore</button>
          <button className="add-entry-btn" onClick={() => addCodexEntry("item", "New Item")}>+ Item</button>
        </div>
      </div>

      <div className="codex-filters">
        {(["all", "character", "location", "item", "lore", "event"] as const).map(f => (
          <button 
            key={f} 
            className={`filter-btn ${filter === f ? "active" : ""}`}
            onClick={() => setFilter(f)}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
            <span className="filter-count">
              {f === "all" 
                ? project.codexEntries.length 
                : project.codexEntries.filter((e) => e.type === f).length}
            </span>
          </button>
        ))}
      </div>

      <div className="codex-grid">
        <div className="codex-list">
          {filteredEntries.map((entry) => (
            <div 
              key={entry.id} 
              className={`codex-card ${entry.id === selectedCodexId ? "active" : ""}`}
              onClick={() => selectCodex(entry.id)}
            >
              <div className="codex-card-icon">
                {typeIcons[entry.type]}
              </div>
              <div className="codex-card-info">
                <span className="codex-card-title">{entry.title}</span>
                <span className="codex-card-summary">{entry.summary}</span>
              </div>
              <span className={`codex-card-type type-${entry.type}`}>{entry.type}</span>
            </div>
          ))}
          {filteredEntries.length === 0 && (
            <div className="empty-card">
              <p>No entries found</p>
            </div>
          )}
        </div>

        {selectedCodex && (
          <div className="codex-detail">
            <div className="codex-detail-header">
              <input
                className="codex-detail-title"
                value={selectedCodex.title}
                onChange={(e) => updateCodexEntry(selectedCodex.id, { title: e.target.value })}
              />
              <button className="delete-btn" onClick={() => {
                if (confirm("Delete this entry?")) {
                  deleteCodexEntry(selectedCodex.id);
                }
              }}>🗑️</button>
            </div>
            <div className="codex-detail-section">
              <label>Summary</label>
              <textarea
                value={selectedCodex.summary}
                onChange={(e) => updateCodexEntry(selectedCodex.id, { summary: e.target.value })}
              />
            </div>
            <div className="codex-detail-section">
              <label>Details</label>
              <textarea
                rows={12}
                value={selectedCodex.details}
                onChange={(e) => updateCodexEntry(selectedCodex.id, { details: e.target.value })}
              />
            </div>
            <div className="codex-detail-section">
              <label>Tags</label>
              <div className="tags-input">
                {(selectedCodex.tags || []).map((tag, i) => (
                  <span key={i} className="tag">
                    {tag}
                    <button onClick={() => {
                      const newTags = selectedCodex.tags.filter((_, idx) => idx !== i);
                      updateCodexEntry(selectedCodex.id, { tags: newTags });
                    }}>×</button>
                  </span>
                ))}
                <input
                  placeholder="Add tag..."
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      const val = (e.target as HTMLInputElement).value.trim();
                      if (val && !selectedCodex.tags.includes(val)) {
                        updateCodexEntry(selectedCodex.id, { tags: [...(selectedCodex.tags || []), val] });
                        (e.target as HTMLInputElement).value = "";
                      }
                    }
                  }}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

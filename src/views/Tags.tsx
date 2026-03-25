import { useState } from "react";
import { useStore } from "../store";

const TAG_COLORS = [
  "#8b5cf6", "#ec4899", "#f43f5e", "#f97316", "#eab308",
  "#22c55e", "#14b8a6", "#06b6d4", "#3b82f6", "#6366f1",
];

export function TagsView() {
  const { getProject, getTags, addTag, updateTag, deleteTag } = useStore();
  const project = getProject();
  const tags = getTags();
  
  const [showAddTag, setShowAddTag] = useState(false);
  const [newTag, setNewTag] = useState({ name: "", color: "#8b5cf6", description: "" });
  const [editingTag, setEditingTag] = useState<string | null>(null);

  const handleAddTag = () => {
    if (!project || !newTag.name.trim()) return;
    addTag(newTag.name.trim(), newTag.color, newTag.description);
    setShowAddTag(false);
    setNewTag({ name: "", color: "#8b5cf6", description: "" });
  };

  if (!project) {
    return (
      <div className="view tags-view">
        <div className="empty-state">
          <h2>No Project</h2>
          <p>Create a project to manage tags</p>
        </div>
      </div>
    );
  }

  return (
    <div className="view tags-view">
      <div className="tags-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <h2>Tags</h2>
        <button className="btn btn-primary" onClick={() => setShowAddTag(true)}>
          + New Tag
        </button>
      </div>

      {showAddTag && (
        <div style={{ background: "var(--bg-secondary)", padding: "20px", borderRadius: "var(--radius-lg)", marginBottom: "24px", border: "1px solid var(--border-subtle)" }}>
          <h4 style={{ marginBottom: "16px" }}>New Tag</h4>
          <input
            placeholder="Tag name..."
            value={newTag.name}
            onChange={(e) => setNewTag({ ...newTag, name: e.target.value })}
            style={{ width: "100%", background: "var(--bg-primary)", border: "1px solid var(--border-subtle)", padding: "12px", borderRadius: "var(--radius-md)", color: "var(--text-primary)", marginBottom: "12px" }}
          />
          <div style={{ marginBottom: "12px" }}>
            <label style={{ display: "block", marginBottom: "8px", color: "var(--text-secondary)", fontSize: "14px" }}>Color</label>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              {TAG_COLORS.map((color) => (
                <button
                  key={color}
                  onClick={() => setNewTag({ ...newTag, color })}
                  style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "50%",
                    background: color,
                    border: newTag.color === color ? "3px solid var(--text-primary)" : "2px solid transparent",
                    cursor: "pointer",
                  }}
                />
              ))}
            </div>
          </div>
          <input
            placeholder="Description (optional)..."
            value={newTag.description}
            onChange={(e) => setNewTag({ ...newTag, description: e.target.value })}
            style={{ width: "100%", background: "var(--bg-primary)", border: "1px solid var(--border-subtle)", padding: "12px", borderRadius: "var(--radius-md)", color: "var(--text-primary)", marginBottom: "16px" }}
          />
          <div style={{ display: "flex", gap: "12px" }}>
            <button className="btn btn-primary" onClick={handleAddTag}>Save Tag</button>
            <button className="btn btn-secondary" onClick={() => setShowAddTag(false)}>Cancel</button>
          </div>
        </div>
      )}

      {tags.length === 0 ? (
        <div className="empty-card" style={{ textAlign: "center", padding: "40px" }}>
          <p style={{ color: "var(--text-secondary)" }}>No tags yet. Create tags to organize your project.</p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "16px" }}>
          {tags.map((tag) => (
            <div
              key={tag.id}
              style={{
                background: "var(--bg-secondary)",
                padding: "16px",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--border-subtle)",
              }}
            >
              {editingTag === tag.id ? (
                <div>
                  <input
                    value={tag.name}
                    onChange={(e) => updateTag(tag.id, { name: e.target.value })}
                    style={{ width: "100%", background: "var(--bg-primary)", border: "1px solid var(--border-subtle)", padding: "8px", borderRadius: "4px", color: "var(--text-primary)", marginBottom: "8px" }}
                  />
                  <div style={{ display: "flex", gap: "4px", flexWrap: "wrap", marginBottom: "8px" }}>
                    {TAG_COLORS.map((color) => (
                      <button
                        key={color}
                        onClick={() => updateTag(tag.id, { color })}
                        style={{
                          width: "24px",
                          height: "24px",
                          borderRadius: "50%",
                          background: color,
                          border: tag.color === color ? "2px solid var(--text-primary)" : "2px solid transparent",
                          cursor: "pointer",
                        }}
                      />
                    ))}
                  </div>
                  <input
                    value={tag.description}
                    onChange={(e) => updateTag(tag.id, { description: e.target.value })}
                    placeholder="Description..."
                    style={{ width: "100%", background: "var(--bg-primary)", border: "1px solid var(--border-subtle)", padding: "8px", borderRadius: "4px", color: "var(--text-primary)", marginBottom: "8px" }}
                  />
                  <button className="btn btn-secondary" onClick={() => setEditingTag(null)} style={{ marginRight: "8px" }}>Done</button>
                </div>
              ) : (
                <>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
                    <span style={{ width: "16px", height: "16px", borderRadius: "50%", background: tag.color }} />
                    <strong style={{ fontSize: "16px", color: "var(--text-primary)" }}>{tag.name}</strong>
                    <div style={{ marginLeft: "auto", display: "flex", gap: "4px" }}>
                      <button
                        onClick={() => setEditingTag(tag.id)}
                        style={{ background: "transparent", border: "none", cursor: "pointer", fontSize: "14px" }}
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => {
                          if (confirm("Delete this tag?")) {
                            deleteTag(tag.id);
                          }
                        }}
                        style={{ background: "transparent", border: "none", cursor: "pointer", fontSize: "14px" }}
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                  {tag.description && (
                    <p style={{ fontSize: "13px", color: "var(--text-secondary)", margin: 0 }}>{tag.description}</p>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

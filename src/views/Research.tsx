import { useState, useMemo } from "react";
import { useStore } from "../store";
import { ResearchNote } from "../types";

export function ResearchView() {
  const { 
    getProject,
    workspace,
    addResearchNote,
    updateResearchNote,
    deleteResearchNote,
  } = useStore();
  
  const project = getProject();
  const notes = workspace.researchNotes.filter(n => n.projectId === project?.id) || [];
  
  const [selectedNote, setSelectedNote] = useState<ResearchNote | null>(null);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [showAddNote, setShowAddNote] = useState(false);
  const [newNote, setNewNote] = useState({ title: "", category: "general", content: "" });

  const categories = ["general", "research", "plot", "dialogue", "setting", "notes", "ideas"];

  const filteredNotes = useMemo(() => {
    return notes.filter(note => {
      const matchesFilter = categoryFilter === "all" || note.category === categoryFilter;
      const matchesSearch = !search || 
        note.title.toLowerCase().includes(search.toLowerCase()) ||
        note.content.toLowerCase().includes(search.toLowerCase());
      return matchesFilter && matchesSearch;
    });
  }, [notes, categoryFilter, search]);

  const handleAddNote = () => {
    if (!project || !newNote.title) return;
    const noteId = addResearchNote(newNote.title, newNote.category);
    if (newNote.content) {
      updateResearchNote(noteId, { content: newNote.content });
    }
    setShowAddNote(false);
    setNewNote({ title: "", category: "general", content: "" });
    // Construct the note object with the data we have
    const note: ResearchNote = {
      id: noteId,
      projectId: project.id,
      title: newNote.title,
      content: newNote.content,
      category: newNote.category,
      tags: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setSelectedNote(note);
  };

  if (!project) {
    return (
      <div className="view research-view">
        <div className="empty-state">
          <h2>No Project</h2>
          <p>Create a project to manage research and notes</p>
        </div>
      </div>
    );
  }

  return (
    <div className="view research-view">
      <div className="research-header">
        <h2>Research & Notes</h2>
        <button className="btn btn-primary" onClick={() => setShowAddNote(true)}>
          + New Note
        </button>
      </div>

      {showAddNote && (
        <div className="add-note-panel" style={{
          background: 'var(--bg-secondary)',
          padding: '20px',
          borderRadius: 'var(--radius-lg)',
          marginBottom: '24px',
          border: '1px solid var(--border-subtle)'
        }}>
          <h4 style={{ marginBottom: '16px' }}>New Note</h4>
          <input
            placeholder="Note title..."
            value={newNote.title}
            onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
            style={{ width: '100%', background: 'var(--bg-primary)', border: '1px solid var(--border-subtle)', padding: '12px', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', marginBottom: '12px' }}
          />
          <select
            value={newNote.category}
            onChange={(e) => setNewNote({ ...newNote, category: e.target.value })}
            style={{ width: '100%', background: 'var(--bg-primary)', border: '1px solid var(--border-subtle)', padding: '12px', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', marginBottom: '12px' }}
          >
            {categories.map(c => (
              <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
            ))}
          </select>
          <textarea
            placeholder="Note content..."
            value={newNote.content}
            onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
            rows={4}
            style={{ width: '100%', background: 'var(--bg-primary)', border: '1px solid var(--border-subtle)', padding: '12px', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', marginBottom: '12px' }}
          />
          <div style={{ display: 'flex', gap: '12px' }}>
            <button className="btn btn-primary" onClick={handleAddNote}>Save Note</button>
            <button className="btn btn-secondary" onClick={() => setShowAddNote(false)}>Cancel</button>
          </div>
        </div>
      )}

      <div className="research-filters" style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
        <input
          className="search-input"
          placeholder="Search notes..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ flex: 1 }}
        />
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', padding: '12px', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)' }}
        >
          <option value="all">All Categories</option>
          {categories.map(c => (
            <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
          ))}
        </select>
      </div>

      <div className="research-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px' }}>
        <div className="notes-list">
          {filteredNotes.length === 0 ? (
            <div className="empty-card">
              <p>No notes found</p>
            </div>
          ) : (
            filteredNotes.map(note => (
              <div
                key={note.id}
                className={`note-card ${selectedNote?.id === note.id ? "active" : ""}`}
                onClick={() => setSelectedNote(note)}
                style={{
                  background: selectedNote?.id === note.id ? 'var(--accent-subtle)' : 'var(--bg-secondary)',
                  padding: '16px',
                  borderRadius: 'var(--radius-md)',
                  marginBottom: '8px',
                  cursor: 'pointer',
                  border: `1px solid ${selectedNote?.id === note.id ? 'var(--accent-primary)' : 'var(--border-subtle)'}`
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <strong style={{ fontSize: '14px' }}>{note.title}</strong>
                  <span style={{ fontSize: '10px', padding: '2px 8px', background: 'var(--bg-tertiary)', borderRadius: '4px', color: 'var(--text-tertiary)' }}>
                    {note.category}
                  </span>
                </div>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {note.content.slice(0, 60)}...
                </p>
              </div>
            ))
          )}
        </div>

        <div className="note-detail">
          {selectedNote ? (
            <div style={{ background: 'var(--bg-secondary)', padding: '24px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <input
                  value={selectedNote.title}
                  onChange={(e) => updateResearchNote(selectedNote.id, { title: e.target.value })}
                  style={{ fontSize: '20px', fontWeight: '600', background: 'transparent', border: 'none', color: 'var(--text-primary)', flex: 1 }}
                />
                <button 
                  className="delete-btn"
                  onClick={() => {
                    if (confirm("Delete this note?")) {
                      deleteResearchNote(selectedNote.id);
                      setSelectedNote(null);
                    }
                  }}
                >🗑️</button>
              </div>
              <select
                value={selectedNote.category}
                onChange={(e) => updateResearchNote(selectedNote.id, { category: e.target.value })}
                style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-subtle)', padding: '8px 12px', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', marginBottom: '16px' }}
              >
                {categories.map(c => (
                  <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                ))}
              </select>
              <textarea
                value={selectedNote.content}
                onChange={(e) => updateResearchNote(selectedNote.id, { content: e.target.value })}
                rows={20}
                style={{ width: '100%', background: 'var(--bg-primary)', border: '1px solid var(--border-subtle)', padding: '16px', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', fontSize: '15px', lineHeight: '1.7' }}
              />
            </div>
          ) : (
            <div className="empty-card">
              <p>Select a note to view or edit</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

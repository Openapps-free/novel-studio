import { useState, useMemo } from "react";
import { useStore } from "../store";

export function TimelineView() {
  const { 
    getProject,
    getTimelineEvents,
    addTimelineEvent,
    updateTimelineEvent,
    deleteTimelineEvent,
  } = useStore();
  
  const project = getProject();
  const events = getTimelineEvents();
  
  const [showAdd, setShowAdd] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDate, setNewDate] = useState("");

  const sortedEvents = useMemo(() => {
    return [...events].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [events]);

  const handleAdd = () => {
    if (newTitle && newDate) {
      addTimelineEvent(newTitle, newDate);
      setNewTitle("");
      setNewDate("");
      setShowAdd(false);
    }
  };

  if (!project) {
    return (
      <div className="view timeline-view">
        <div className="empty-state">
          <h2>No Project</h2>
          <p>Create a project to manage your timeline</p>
        </div>
      </div>
    );
  }

  return (
    <div className="view timeline-view">
      <div className="timeline-header">
        <h2>Story Timeline</h2>
        <button className="btn btn-primary" onClick={() => setShowAdd(!showAdd)}>
          + Add Event
        </button>
      </div>

      {showAdd && (
        <div className="add-event-form" style={{ background: 'var(--bg-secondary)', padding: '20px', borderRadius: 'var(--radius-lg)', marginBottom: '24px', border: '1px solid var(--border-subtle)' }}>
          <input
            placeholder="Event title"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-subtle)', padding: '12px', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', width: '100%', marginBottom: '12px' }}
          />
          <input
            type="date"
            value={newDate}
            onChange={(e) => setNewDate(e.target.value)}
            style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-subtle)', padding: '12px', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', marginBottom: '12px' }}
          />
          <div style={{ display: 'flex', gap: '12px' }}>
            <button className="btn btn-primary" onClick={handleAdd}>Add Event</button>
            <button className="btn btn-secondary" onClick={() => setShowAdd(false)}>Cancel</button>
          </div>
        </div>
      )}

      <div className="timeline-list">
        {sortedEvents.length === 0 ? (
          <div className="empty-state">
            <h3>No Timeline Events</h3>
            <p>Add events to track your story's chronology</p>
          </div>
        ) : (
          sortedEvents.map((event) => (
            <div key={event.id} className="timeline-event-card" style={{ 
              background: 'var(--bg-secondary)', 
              padding: '20px', 
              borderRadius: 'var(--radius-lg)', 
              marginBottom: '16px',
              border: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '20px'
            }}>
              <div className="timeline-event-date" style={{ 
                background: 'var(--accent-subtle)', 
                padding: '12px 16px', 
                borderRadius: 'var(--radius-md)',
                minWidth: '120px',
                textAlign: 'center'
              }}>
                <div style={{ fontWeight: '600', color: 'var(--accent-primary)' }}>
                  {new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </div>
              </div>
              <div className="timeline-event-content" style={{ flex: 1 }}>
                <input
                  value={event.title}
                  onChange={(e) => updateTimelineEvent(event.id, { title: e.target.value })}
                  style={{ 
                    background: 'transparent', 
                    border: 'none', 
                    fontSize: '18px', 
                    fontWeight: '600', 
                    color: 'var(--text-primary)',
                    width: '100%',
                    marginBottom: '8px'
                  }}
                />
                <textarea
                  value={event.description}
                  onChange={(e) => updateTimelineEvent(event.id, { description: e.target.value })}
                  placeholder="Event description..."
                  style={{ 
                    background: 'var(--bg-primary)', 
                    border: '1px solid var(--border-subtle)', 
                    padding: '12px', 
                    borderRadius: 'var(--radius-md)', 
                    color: 'var(--text-primary)',
                    width: '100%',
                    minHeight: '80px',
                    resize: 'vertical'
                  }}
                />
              </div>
              <button 
                className="delete-btn"
                onClick={() => {
                  if (confirm("Delete this event?")) {
                    deleteTimelineEvent(event.id);
                  }
                }}
              >
                🗑️
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

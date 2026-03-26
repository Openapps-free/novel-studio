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
  const [editingId, setEditingId] = useState<string | null>(null);
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

  const groupedByYear = useMemo(() => {
    const groups: Record<string, typeof events> = {};
    for (const event of sortedEvents) {
      const year = new Date(event.date).getFullYear().toString();
      if (!groups[year]) groups[year] = [];
      groups[year].push(event);
    }
    return groups;
  }, [sortedEvents]);

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
        <div>
          <h2>Story Timeline</h2>
          <p style={{ color: 'var(--text-secondary)', marginTop: '8px' }}>
            Track the chronology of your story events
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAdd(!showAdd)}>
          + Add Event
        </button>
      </div>

      {showAdd && (
        <div className="timeline-add-form">
          <input
            className="timeline-input"
            placeholder="Event title"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
          />
          <input
            type="date"
            className="timeline-input"
            value={newDate}
            onChange={(e) => setNewDate(e.target.value)}
          />
          <div className="timeline-form-actions">
            <button className="btn btn-primary" onClick={handleAdd}>Add Event</button>
            <button className="btn btn-secondary" onClick={() => setShowAdd(false)}>Cancel</button>
          </div>
        </div>
      )}

      {sortedEvents.length === 0 ? (
        <div className="timeline-empty">
          <div className="timeline-empty-icon">📅</div>
          <h3>No Timeline Events</h3>
          <p>Add events to track your story's chronology</p>
          <button className="btn btn-primary" onClick={() => setShowAdd(true)}>
            + Add First Event
          </button>
        </div>
      ) : (
        <div className="timeline-container">
          {Object.entries(groupedByYear).map(([year, yearEvents]) => (
            <div key={year} className="timeline-year">
              <div className="timeline-year-header">
                <span className="timeline-year-badge">{year}</span>
                <span className="timeline-year-count">{yearEvents.length} events</span>
              </div>
              
              <div className="timeline-line">
                {yearEvents.map((event, index) => (
                  <div 
                    key={event.id} 
                    className={`timeline-event ${editingId === event.id ? 'editing' : ''}`}
                    onClick={() => setEditingId(editingId === event.id ? null : event.id)}
                  >
                    <div className="timeline-dot-container">
                      <div className="timeline-dot" />
                      {index < yearEvents.length - 1 && <div className="timeline-dot-line" />}
                    </div>
                    
                    <div className="timeline-event-card">
                      <div className="timeline-event-date">
                        {new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </div>
                      
                      <div className="timeline-event-content">
                        {editingId === event.id ? (
                          <div className="timeline-edit-form">
                            <input
                              className="timeline-input"
                              value={event.title}
                              onChange={(e) => updateTimelineEvent(event.id, { title: e.target.value })}
                              onClick={(e) => e.stopPropagation()}
                            />
                            <textarea
                              className="timeline-textarea"
                              value={event.description}
                              onChange={(e) => updateTimelineEvent(event.id, { description: e.target.value })}
                              placeholder="Event description..."
                              onClick={(e) => e.stopPropagation()}
                            />
                            <button 
                              className="timeline-delete-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (confirm("Delete this event?")) {
                                  deleteTimelineEvent(event.id);
                                }
                              }}
                            >
                              🗑️ Delete
                            </button>
                          </div>
                        ) : (
                          <>
                            <h4 className="timeline-event-title">{event.title}</h4>
                            {event.description && (
                              <p className="timeline-event-desc">{event.description}</p>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

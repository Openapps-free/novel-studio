import { useState } from "react";
import { useStore } from "../store";
import { GENRE_TEMPLATES, getCategories } from "../services/templates";

export function TemplatesView() {
  const { getProject, addChapter, addScene, setCurrentView } = useStore();
  const project = getProject();
  
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [applying, setApplying] = useState(false);
  
  const categories = getCategories();

  const filteredTemplates = selectedCategory 
    ? GENRE_TEMPLATES.filter(t => t.category === selectedCategory)
    : GENRE_TEMPLATES;

  const applyTemplate = async () => {
    if (!project || !selectedTemplate) return;
    
    const template = GENRE_TEMPLATES.find(t => t.id === selectedTemplate);
    if (!template) return;
    
    setApplying(true);
    
    try {
      for (const beat of template.beats) {
        const chapterId = addChapter(beat.name);
        addScene(chapterId, beat.description);
      }
      
      alert(`Created ${template.beats.length} chapters from "${template.name}" template!`);
      setCurrentView("write");
    } catch (error) {
      console.error("Failed to apply template:", error);
      alert("Failed to apply template");
    } finally {
      setApplying(false);
    }
  };

  if (!project) {
    return (
      <div className="view templates-view">
        <div className="empty-state">
          <h2>No Project Selected</h2>
          <p>Create or select a project to apply templates</p>
        </div>
      </div>
    );
  }

  return (
    <div className="view templates-view">
      <div className="templates-header">
        <div>
          <h2>Story Templates</h2>
          <p style={{ color: 'var(--text-secondary)', marginTop: '8px' }}>
            Jump-start your story with proven structures
          </p>
        </div>
      </div>

      <div className="templates-content">
        <div className="templates-sidebar">
          <h3>Categories</h3>
          <div className="category-list">
            <button 
              className={`category-btn ${!selectedCategory ? 'active' : ''}`}
              onClick={() => setSelectedCategory(null)}
            >
              All Templates
            </button>
            {categories.map(cat => (
              <button 
                key={cat}
                className={`category-btn ${selectedCategory === cat ? 'active' : ''}`}
                onClick={() => setSelectedCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="templates-main">
          <div className="templates-grid">
            {filteredTemplates.map(template => (
              <div 
                key={template.id}
                className={`template-card ${selectedTemplate === template.id ? 'selected' : ''}`}
                onClick={() => setSelectedTemplate(template.id)}
              >
                <div className="template-header">
                  <span className="template-category">{template.category}</span>
                  <h3>{template.name}</h3>
                </div>
                <p className="template-desc">{template.description}</p>
                <div className="template-beats">
                  <span>{template.beats.length} story beats</span>
                </div>
              </div>
            ))}
          </div>

          {selectedTemplate && (
            <div className="template-detail">
              <h3>{GENRE_TEMPLATES.find(t => t.id === selectedTemplate)?.name}</h3>
              <p className="template-full-desc">
                {GENRE_TEMPLATES.find(t => t.id === selectedTemplate)?.description}
              </p>
              
              <h4>Story Beats</h4>
              <div className="beats-list">
                {GENRE_TEMPLATES.find(t => t.id === selectedTemplate)?.beats.map((beat, idx) => (
                  <div key={idx} className="beat-item">
                    <span className="beat-num">{idx + 1}</span>
                    <div className="beat-content">
                      <span className="beat-name">{beat.name}</span>
                      <span className="beat-desc">{beat.description}</span>
                    </div>
                  </div>
                ))}
              </div>

              <button 
                className="btn btn-primary apply-template-btn"
                onClick={applyTemplate}
                disabled={applying || !project}
              >
                {applying ? "Applying..." : "Apply Template to Project"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

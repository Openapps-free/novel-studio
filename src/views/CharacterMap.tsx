import { useState, useRef, useEffect } from "react";
import { useStore } from "../store";
import { CharacterRelation } from "../types";

interface CharacterNode {
  id: string;
  name: string;
  x: number;
  y: number;
}

const RELATION_TYPES = [
  { value: "family", label: "Family", color: "#22c55e" },
  { value: "friend", label: "Friend", color: "#3b82f6" },
  { value: "enemy", label: "Enemy", color: "#ef4444" },
  { value: "romantic", label: "Romantic", color: "#ec4899" },
  { value: "mentor", label: "Mentor", color: "#f59e0b" },
  { value: "rival", label: "Rival", color: "#8b5cf6" },
  { value: "ally", label: "Ally", color: "#06b6d4" },
  { value: "business", label: "Business", color: "#64748b" },
];

export function CharacterMapView() {
  const { 
    getProject,
    getCharacterRelations,
    addCharacterRelation,
    deleteCharacterRelation,
  } = useStore();
  
  const project = getProject();
  const relations = getCharacterRelations();
  const characters = project?.codexEntries.filter(e => e.type === "character") || [];
  
  const svgRef = useRef<SVGSVGElement>(null);
  const [svgSize, setSvgSize] = useState({ width: 800, height: 600 });
  const [nodes, setNodes] = useState<CharacterNode[]>([]);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [selectedRelation, setSelectedRelation] = useState<CharacterRelation | null>(null);
  const [dragging, setDragging] = useState<string | null>(null);
  const [showAddRelation, setShowAddRelation] = useState(false);
  const [newRelation, setNewRelation] = useState({ fromId: "", toId: "", relationType: "friend" });

  useEffect(() => {
    const updateSize = () => {
      if (svgRef.current) {
        const rect = svgRef.current.getBoundingClientRect();
        setSvgSize({ width: rect.width, height: 600 });
      }
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  useEffect(() => {
    if (characters.length > 0 && nodes.length === 0) {
      const centerX = svgSize.width / 2;
      const centerY = svgSize.height / 2;
      const radius = Math.min(svgSize.width, svgSize.height) * 0.3;
      
      const newNodes = characters.map((char, i) => {
        const angle = (2 * Math.PI * i) / characters.length - Math.PI / 2;
        return {
          id: char.id,
          name: char.title,
          x: centerX + radius * Math.cos(angle),
          y: centerY + radius * Math.sin(angle),
        };
      });
      setNodes(newNodes);
    }
  }, [characters, svgSize]);

  const handleMouseDown = (_e: React.MouseEvent, nodeId: string) => {
    const node = nodes.find(n => n.id === nodeId);
    if (node) {
      setDragging(nodeId);
      setSelectedNode(nodeId);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (dragging && svgRef.current) {
      const svg = svgRef.current;
      const rect = svg.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      setNodes(prev => prev.map(n => 
        n.id === dragging ? { ...n, x: x, y: y } : n
      ));
    }
  };

  const handleMouseUp = () => {
    setDragging(null);
  };

  const handleAddRelation = () => {
    if (newRelation.fromId && newRelation.toId && newRelation.fromId !== newRelation.toId) {
      addCharacterRelation(newRelation.fromId, newRelation.toId, newRelation.relationType);
      setShowAddRelation(false);
      setNewRelation({ fromId: "", toId: "", relationType: "friend" });
    }
  };

  const getRelationColor = (type: string) => {
    return RELATION_TYPES.find(r => r.value === type)?.color || "#64748b";
  };

  if (!project) {
    return (
      <div className="view character-map-view">
        <div className="empty-state">
          <h2>No Project</h2>
          <p>Create a project to manage character relationships</p>
        </div>
      </div>
    );
  }

  if (characters.length === 0) {
    return (
      <div className="view character-map-view">
        <div className="empty-state">
          <h2>No Characters</h2>
          <p>Add characters in the Codex first to visualize their relationships</p>
        </div>
      </div>
    );
  }

  return (
    <div className="view character-map-view">
      <div className="character-map-header">
        <h2>Character Relationships</h2>
        <div className="character-map-actions">
          <button className="btn btn-primary" onClick={() => setShowAddRelation(true)}>
            + Add Relationship
          </button>
        </div>
      </div>

      {showAddRelation && (
        <div className="add-relation-panel" style={{
          background: 'var(--bg-secondary)',
          padding: '20px',
          borderRadius: 'var(--radius-lg)',
          marginBottom: '24px',
          border: '1px solid var(--border-subtle)'
        }}>
          <h4 style={{ marginBottom: '16px' }}>New Relationship</h4>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
            <select 
              value={newRelation.fromId}
              onChange={(e) => setNewRelation({ ...newRelation, fromId: e.target.value })}
              style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-subtle)', padding: '10px 14px', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)' }}
            >
              <option value="">Select character...</option>
              {characters.map(c => (
                <option key={c.id} value={c.id}>{c.title}</option>
              ))}
            </select>
            <span style={{ color: 'var(--text-secondary)' }}>→</span>
            <select 
              value={newRelation.relationType}
              onChange={(e) => setNewRelation({ ...newRelation, relationType: e.target.value })}
              style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-subtle)', padding: '10px 14px', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)' }}
            >
              {RELATION_TYPES.map(r => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
            <span style={{ color: 'var(--text-secondary)' }}>→</span>
            <select 
              value={newRelation.toId}
              onChange={(e) => setNewRelation({ ...newRelation, toId: e.target.value })}
              style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-subtle)', padding: '10px 14px', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)' }}
            >
              <option value="">Select character...</option>
              {characters.filter(c => c.id !== newRelation.fromId).map(c => (
                <option key={c.id} value={c.id}>{c.title}</option>
              ))}
            </select>
            <button className="btn btn-primary" onClick={handleAddRelation}>Add</button>
            <button className="btn btn-secondary" onClick={() => setShowAddRelation(false)}>Cancel</button>
          </div>
        </div>
      )}

      <div className="character-map-container" style={{
        background: 'var(--bg-secondary)',
        borderRadius: 'var(--radius-xl)',
        border: '1px solid var(--border-subtle)',
        overflow: 'hidden',
        position: 'relative'
      }}>
        <svg 
          ref={svgRef}
          width="100%" 
          height="600" 
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          style={{ display: 'block' }}
        >
          {/* Relationship lines */}
          {relations.map(rel => {
            const fromNode = nodes.find(n => n.id === rel.fromId);
            const toNode = nodes.find(n => n.id === rel.toId);
            if (!fromNode || !toNode) return null;
            
            const isSelected = selectedRelation?.id === rel.id;
            return (
              <g key={rel.id} onClick={() => setSelectedRelation(rel)} style={{ cursor: 'pointer' }}>
                <line
                  x1={fromNode.x}
                  y1={fromNode.y}
                  x2={toNode.x}
                  y2={toNode.y}
                  stroke={getRelationColor(rel.relationType)}
                  strokeWidth={isSelected ? 4 : 2}
                  strokeOpacity={isSelected ? 1 : 0.6}
                />
                {/* Arrow head */}
                <circle
                  cx={(fromNode.x + toNode.x) / 2}
                  cy={(fromNode.y + toNode.y) / 2}
                  r={6}
                  fill={getRelationColor(rel.relationType)}
                />
              </g>
            );
          })}

          {/* Character nodes */}
          {nodes.map(node => {
            const isSelected = selectedNode === node.id;
            return (
              <g 
                key={node.id} 
                transform={`translate(${node.x}, ${node.y})`}
                onMouseDown={(e) => handleMouseDown(e, node.id)}
                style={{ cursor: 'grab' }}
              >
                <circle
                  r={isSelected ? 40 : 35}
                  fill="var(--bg-tertiary)"
                  stroke={isSelected ? "var(--accent-primary)" : "var(--border-strong)"}
                  strokeWidth={isSelected ? 3 : 2}
                />
                <text
                  textAnchor="middle"
                  dy=".3em"
                  fill="var(--text-primary)"
                  fontSize="14"
                  fontWeight="600"
                >
                  {node.name.length > 10 ? node.name.slice(0, 10) + "..." : node.name}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Legend */}
        <div style={{
          position: 'absolute',
          bottom: '16px',
          left: '16px',
          background: 'var(--bg-primary)',
          padding: '12px 16px',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-subtle)'
        }}>
          <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginBottom: '8px' }}>RELATIONSHIPS</div>
          {RELATION_TYPES.map(r => (
            <div key={r.value} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', fontSize: '13px' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: r.color }} />
              <span style={{ color: 'var(--text-secondary)' }}>{r.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Selected relation details */}
      {selectedRelation && (
        <div className="relation-details" style={{
          marginTop: '24px',
          background: 'var(--bg-secondary)',
          padding: '20px',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-subtle)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <strong style={{ fontSize: '16px' }}>
                {characters.find(c => c.id === selectedRelation.fromId)?.title}
              </strong>
              <span style={{ margin: '0 12px', color: 'var(--text-tertiary)' }}>→</span>
              <strong style={{ fontSize: '16px', color: getRelationColor(selectedRelation.relationType) }}>
                {RELATION_TYPES.find(r => r.value === selectedRelation.relationType)?.label}
              </strong>
              <span style={{ margin: '0 12px', color: 'var(--text-tertiary)' }}>→</span>
              <strong style={{ fontSize: '16px' }}>
                {characters.find(c => c.id === selectedRelation.toId)?.title}
              </strong>
            </div>
            <button 
              className="btn btn-danger"
              onClick={() => {
                deleteCharacterRelation(selectedRelation.id);
                setSelectedRelation(null);
              }}
            >
              Delete
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

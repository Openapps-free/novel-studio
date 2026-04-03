import { useState, useEffect, useRef } from "react";
import { useStore } from "../store";
import { SearchResult, SearchResultType } from "../types";

const typeIcons: Record<SearchResultType, string> = {
  scene: "📄",
  chapter: "📖",
  codex: "🔗",
  researchNote: "📚",
  tag: "🏷️",
};

const typeLabels: Record<SearchResultType, string> = {
  scene: "Scene",
  chapter: "Chapter",
  codex: "Codex Entry",
  researchNote: "Research Note",
  tag: "Tag",
};

export function SearchBar() {
  const { searchContent, selectScene, selectChapter, setCurrentView } = useStore();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    const searchResults = searchContent(query);
    setResults(searchResults);
    setIsOpen(searchResults.length > 0);
    setSelectedIndex(0);
  }, [query, searchContent]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "/" && !isOpen && inputRef.current) {
        e.preventDefault();
        inputRef.current.focus();
      }
      if (e.key === "Escape") {
        setIsOpen(false);
        inputRef.current?.blur();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((i) => Math.min(i + 1, results.length - 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((i) => Math.max(i - 1, 0));
        break;
      case "Enter":
        e.preventDefault();
        if (results[selectedIndex]) {
          handleSelect(results[selectedIndex]);
        }
        break;
    }
  };

  const handleSelect = (result: SearchResult) => {
    setIsOpen(false);
    setQuery("");

    switch (result.type) {
      case "scene":
        selectScene(result.item.id);
        setCurrentView("write");
        break;
      case "chapter":
        selectChapter(result.item.id);
        setCurrentView("plan");
        break;
      case "codex":
        setCurrentView("codex");
        break;
      case "researchNote":
        setCurrentView("research");
        break;
      case "tag":
        setCurrentView("tags");
        break;
    }
  };

  return (
    <div ref={containerRef} className="search-bar-container">
      <div className="search-bar">
        <span className="search-icon">🔍</span>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.trim().length >= 2 && setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search (press / to focus)"
          className="search-input"
        />
        {query && (
          <button className="search-clear" onClick={() => { setQuery(""); setIsOpen(false); }}>
            ×
          </button>
        )}
      </div>

      {isOpen && (
        <div className="search-results">
          {results.map((result, index) => (
            <div
              key={`${result.type}-${result.item.id}`}
              className={`search-result-item ${index === selectedIndex ? "selected" : ""}`}
              onClick={() => handleSelect(result)}
              onMouseEnter={() => setSelectedIndex(index)}
            >
              <span className="result-icon">{typeIcons[result.type]}</span>
              <div className="result-content">
                <span className="result-title">
                  {"title" in result.item ? result.item.title : "name" in result.item ? result.item.name : "Unknown"}
                </span>
                <span className="result-type">{typeLabels[result.type]}</span>
              </div>
            </div>
          ))}
          {results.length === 0 && query.trim().length >= 2 && (
            <div className="search-empty">No results found</div>
          )}
        </div>
      )}
    </div>
  );
}

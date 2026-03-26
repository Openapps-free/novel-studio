// Core Types for Novel Studio

// Project Status
export type ProjectStatus = "drafting" | "planning" | "brainstorming" | "complete";

// Scene Status
export type SceneStatus = "outline" | "draft" | "revising" | "complete";

// Codex Types
export type CodexType = "character" | "location" | "item" | "lore" | "event";

// Theme
export type Theme = "dark" | "light" | "sepia";

// API Provider
export type AIProvider = "openai" | "anthropic" | "ollama" | "lmstudio";

// Scene Entity
export interface Scene {
  id: string;
  projectId: string;
  chapterId: string;
  title: string;
  summary: string;
  content: string;
  status: SceneStatus;
  goal: string;
  conflict: string;
  outcome: string;
  pov: string;
  location: string;
  timeOfDay: string;
  color: string;
  tags: string[];
  order: number;
  createdAt: string;
  updatedAt: string;
}

// Chapter Entity
export interface Chapter {
  id: string;
  projectId: string;
  title: string;
  notes: string;
  order: number;
  folderId: string | null;
  synopsis: string;
  createdAt: string;
  updatedAt: string;
}

// Folder Entity (for organizing chapters)
export interface Folder {
  id: string;
  projectId: string;
  title: string;
  parentId: string | null;
  order: number;
  createdAt: string;
}

// Codex Entry Entity with Deep Fields
export interface CodexEntry {
  id: string;
  projectId: string;
  type: CodexType;
  title: string;
  summary: string;
  details: string;
  tags: string[];
  relations: string[];
  imageUrl?: string;
  aliases?: string[];
  customFields?: Record<string, string>;
  
  // Character-specific fields
  role?: string;
  age?: string;
  gender?: string;
  appearance?: string;
  personality?: string;
  backstory?: string;
  motivation?: string;
  goal?: string;
  fear?: string;
  strength?: string;
  weakness?: string;
  arc?: string;
  voice?: string;
  habits?: string;
  relationships?: string;
  
  // Location-specific fields
  locationType?: string;
  climate?: string;
  culture?: string;
  history?: string;
  population?: string;
  
  // Item-specific fields
  origin?: string;
  powers?: string;
  historyItem?: string;
  
  createdAt: string;
  updatedAt: string;
}

// Research Note
export interface ResearchNote {
  id: string;
  projectId: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

// Character Relationship
export interface CharacterRelation {
  id: string;
  projectId: string;
  fromId: string;
  toId: string;
  relationType: string;
  description: string;
  strength: number;
}

// Timeline Event
export interface TimelineEvent {
  id: string;
  projectId: string;
  title: string;
  description: string;
  date: string;
  order: number;
  tags: string[];
  relatedCharacters: string[];
  relatedLocations: string[];
  createdAt: string;
}

// Revision/Version History
export interface Revision {
  id: string;
  sceneId: string;
  content: string;
  wordCount: number;
  createdAt: string;
  note?: string;
}

// Project Entity
export interface Project {
  id: string;
  title: string;
  type: string;
  status: ProjectStatus;
  synopsis: string;
  targetWordCount: number;
  tags: string[];
  storyThreads: string[];
  genre: string;
  tone: string;
  POV: string;
  createdAt: string;
  updatedAt: string;
}

// Project with all related data
export interface ProjectWithRelations extends Project {
  chapters: Chapter[];
  scenes: Scene[];
  codexEntries: CodexEntry[];
}

// App Settings
export interface AppSettings {
  theme: Theme;
  typewriterMode: boolean;
  typewriterScroll: boolean;
  focusMode: boolean;
  autoSaveInterval: number;
  dailyGoal: number;
  sessionGoal: number;
  apiKey: string;
  apiProvider: AIProvider;
  localModel: string;
  fontSize: number;
  fontFamily: string;
  lineHeight: number;
  spellCheck: boolean;
  showWordCount: boolean;
  showCharacterCount: boolean;
  nanoWriMoMode: boolean;
  nanoWriMoTarget: number;
  dailyWords: number;
  lastWritingDate: string;
}

// Writing Session
export interface WritingSession {
  startTime: number;
  wordsWritten: number;
  sceneId: string | null;
}

// AI Request Types
export type AIRequestType = 
  | "continue"
  | "expand"
  | "summarize"
  | "rewrite"
  | "dialogue"
  | "description"
  | "action"
  | "emotion"
  | "analyze"
  | "brainstorm"
  | "outline"
  | "worldbuild"
  | "character_bio"
  | "plot_twist"
  | "scene_setup"
  | "chapter_summary"
  | "title_suggestion"
  | "blurb"
  | "backstory"
  | "character_voice"
  | "conflict_ideas"
  | "ending_suggestion";

export interface AIModelConfig {
  id: string;
  name: string;
  provider: AIProvider;
  maxTokens: number;
  description: string;
  recommendedFor: string[];
}

export interface AIRequest {
  type: AIRequestType;
  prompt: string;
  context?: {
    sceneContent?: string;
    characterBio?: string;
    plotSummary?: string;
    selectedText?: string;
    chapterContext?: string;
    characterNames?: string[];
  };
}

export interface AIResponse {
  text: string;
  tokens: number;
  model: string;
}

// Workspace (root data structure)
export interface Workspace {
  projects: Project[];
  chapters: Chapter[];
  scenes: Scene[];
  codexEntries: CodexEntry[];
  revisions: Revision[];
  folders: Folder[];
  characterRelations: CharacterRelation[];
  timelineEvents: TimelineEvent[];
  researchNotes: ResearchNote[];
  tags: Tag[];
}

// Tag
export interface Tag {
  id: string;
  projectId: string;
  name: string;
  color: string;
  description: string;
}

// Writing Template
export interface WritingTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  beats: {
    name: string;
    description: string;
    prompt: string;
  }[];
}

// Export Options
export interface ExportOptions {
  format: "epub" | "pdf" | "docx" | "json" | "txt" | "html";
  includeFrontmatter: boolean;
  includeMetadata: boolean;
  includeCodex: boolean;
  includeTimeline: boolean;
  includeImages: boolean;
  chapterSeparator: "\n\n" | "\n---";
}

// Navigation
export type ViewType = "overview" | "write" | "plan" | "codex" | "timeline" | "characters" | "tags" | "research" | "analyze" | "revisions" | "chat" | "settings" | "templates";

// Stats
export interface ProjectStats {
  wordCount: number;
  sceneCount: number;
  chapterCount: number;
  draftedScenes: number;
  completedScenes: number;
  targetWords: number;
  completion: number;
  characters: number;
  locations: number;
  timelineEvents: number;
}

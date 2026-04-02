import { create } from "zustand";
import {
  Workspace,
  Project,
  Chapter,
  Scene,
  CodexEntry,
  AppSettings,
  WritingSession,
  Theme,
  ProjectWithRelations,
  ProjectStats,
  CharacterRelation,
  TimelineEvent,
  ViewType,
  CodexType,
  ResearchNote,
  Tag,
} from "../types";
import {
  loadWorkspace,
  saveWorkspace,
  loadSettings,
  saveSettings,
  createProject,
  createChapter,
  createScene,
  createCodexEntry,
  createRevision,
  createCharacterRelation,
  createTimelineEvent,
  createResearchNote,
  createTag,
  getProjectWithRelations,
  calculateWordCount,
} from "../services/storage";

let saveTimeout: ReturnType<typeof setTimeout> | null = null;

interface AppState {
  // Data
  workspace: Workspace;
  settings: AppSettings;
  writingSession: WritingSession;
  
  // UI State
  currentView: ViewType;
  selectedProjectId: string | null;
  selectedChapterId: string | null;
  selectedSceneId: string | null;
  selectedCodexId: string | null;
  
  // Loading states
  isLoading: boolean;
  isSaving: boolean;
  
  // Initialize
  initializeWorkspace: () => Promise<void>;
  setWorkspaceDirect: (workspace: Workspace) => void;
  save: () => Promise<void>;
  
  // Project actions
  addProject: (title: string, type?: string) => string;
  updateProject: (id: string, updates: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  selectProject: (id: string | null) => void;
  
  // Chapter actions
  addChapter: (title: string) => string;
  updateChapter: (id: string, updates: Partial<Chapter>) => void;
  deleteChapter: (id: string) => void;
  selectChapter: (id: string | null) => void;
  reorderChapters: (chapterIds: string[]) => void;
  
  // Scene actions
  addScene: (chapterId: string, title?: string) => string;
  updateScene: (id: string, updates: Partial<Scene>) => void;
  deleteScene: (id: string) => void;
  selectScene: (id: string | null) => void;
  reorderScenes: (chapterId: string, sceneIds: string[]) => void;
  
  // Codex actions
  addCodexEntry: (type: CodexType, title: string) => string;
  updateCodexEntry: (id: string, updates: Partial<CodexEntry>) => void;
  deleteCodexEntry: (id: string) => void;
  selectCodex: (id: string | null) => void;
  
  // Character Relations
  addCharacterRelation: (fromId: string, toId: string, relationType: string) => void;
  updateCharacterRelation: (id: string, updates: Partial<CharacterRelation>) => void;
  deleteCharacterRelation: (id: string) => void;
  
  // Timeline Events
  addTimelineEvent: (title: string, date: string) => string;
  updateTimelineEvent: (id: string, updates: Partial<TimelineEvent>) => void;
  deleteTimelineEvent: (id: string) => void;
  
  // Research Notes
  addResearchNote: (title: string, category?: string) => string;
  updateResearchNote: (id: string, updates: Partial<ResearchNote>) => void;
  deleteResearchNote: (id: string) => void;
  getResearchNotes: () => ResearchNote[];
  
  // Tags
  addTag: (name: string, color?: string, description?: string) => string;
  updateTag: (id: string, updates: Partial<Tag>) => void;
  deleteTag: (id: string) => void;
  getTags: () => Tag[];
  
  // Settings actions
  updateSettings: (updates: Partial<AppSettings>) => void;
  setTheme: (theme: Theme) => void;
  
  // Navigation
  setCurrentView: (view: ViewType) => void;
  
  // Session actions
  startWritingSession: (sceneId: string) => void;
  updateSessionWords: (words: number) => void;
  resetSession: () => void;
  updateDailyWords: (words: number) => void;
  toggleNanoWriMo: () => void;
  setNanoTarget: (target: number) => void;
  
  // Computed getters
  getProject: () => ProjectWithRelations | null;
  getCurrentChapter: () => Chapter | null;
  getCurrentScene: () => Scene | null;
  getProjectStats: () => ProjectStats | null;
  getCharacterRelations: () => CharacterRelation[];
  getTimelineEvents: () => TimelineEvent[];
}

const DEFAULT_SETTINGS: AppSettings = {
  theme: "dark",
  typewriterMode: false,
  typewriterScroll: true,
  focusMode: false,
  autoSaveInterval: 30000,
  dailyGoal: 1000,
  sessionGoal: 500,
  apiKey: "",
  apiProvider: "openai",
  localModel: "llama3.1",
  cloudModel: "gpt-4o-mini",
  fontSize: 18,
  fontFamily: "Georgia",
  lineHeight: 1.8,
  spellCheck: true,
  showWordCount: true,
  showCharacterCount: false,
  nanoWriMoMode: false,
  nanoWriMoTarget: 50000,
  dailyWords: 0,
  lastWritingDate: new Date().toISOString().split("T")[0] ?? "",
};

const DEFAULT_SESSION: WritingSession = {
  startTime: Date.now(),
  wordsWritten: 0,
  sceneId: null,
};

export const useStore = create<AppState>((set, get) => ({
  // Initial state
  workspace: {
    projects: [],
    chapters: [],
    scenes: [],
    codexEntries: [],
    revisions: [],
    folders: [],
    characterRelations: [],
    timelineEvents: [],
    researchNotes: [],
    tags: [],
  },
  settings: DEFAULT_SETTINGS,
  writingSession: DEFAULT_SESSION,
  
  currentView: "overview",
  selectedProjectId: null,
  selectedChapterId: null,
  selectedSceneId: null,
  selectedCodexId: null,
  
  isLoading: true,
  isSaving: false,

  // Initialize workspace from storage
  initializeWorkspace: async () => {
    try {
      const workspace = await loadWorkspace();
      const savedSettings = await loadSettings();
      const settings = savedSettings ? { ...DEFAULT_SETTINGS, ...savedSettings } : DEFAULT_SETTINGS;
      
      set({ 
        workspace: {
          ...workspace,
          researchNotes: workspace.researchNotes || [],
          tags: workspace.tags || [],
        }, 
        settings, 
        isLoading: false,
        selectedProjectId: workspace.projects[0]?.id || null,
      });
    } catch (error) {
      console.error("Failed to initialize workspace:", error);
      set({ isLoading: false });
    }
  },

  // Save workspace to storage (debounced)
  save: async () => {
    if (saveTimeout) clearTimeout(saveTimeout);
    saveTimeout = setTimeout(async () => {
      try {
        const state = get();
        await saveWorkspace(state.workspace);
        await saveSettings(state.settings);
      } catch (error) {
        console.error("Failed to save:", error);
      }
    }, 500);
  },

  // Set workspace directly (for restore)
  setWorkspaceDirect: async (workspace) => {
    const savedSettings = await loadSettings();
    const settings = savedSettings ? { ...DEFAULT_SETTINGS, ...savedSettings } : DEFAULT_SETTINGS;
    
    set({ 
      workspace: {
        ...workspace,
        researchNotes: workspace.researchNotes || [],
        tags: workspace.tags || [],
      }, 
      settings,
      selectedProjectId: workspace.projects[0]?.id || null,
      selectedChapterId: null,
      selectedSceneId: null,
    });
    get().save();
  },

  // Project actions
  addProject: (title, type = "Novel") => {
    const project = createProject(title, type);
    const chapter = createChapter(project.id, "Chapter 1", 0);
    const scene = createScene(chapter.id, "Opening Scene", 0, project.id);
    
    set((state) => ({
      workspace: {
        ...state.workspace,
        projects: [...state.workspace.projects, project],
        chapters: [...state.workspace.chapters, chapter],
        scenes: [...state.workspace.scenes, scene],
      },
      selectedProjectId: project.id,
      selectedChapterId: chapter.id,
      selectedSceneId: scene.id,
    }));
    
    get().save();
    return project.id;
  },

  updateProject: (id, updates) => {
    set((state) => ({
      workspace: {
        ...state.workspace,
        projects: state.workspace.projects.map((p) =>
          p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p
        ),
      },
    }));
    get().save();
  },

  deleteProject: (id) => {
    const remainingProjects = get().workspace.projects.filter((p) => p.id !== id);
    const newSelectedId = get().selectedProjectId === id 
      ? (remainingProjects[0]?.id || null)
      : get().selectedProjectId;
    
    let newChapterId = get().selectedChapterId;
    let newSceneId = get().selectedSceneId;
    
    if (get().selectedProjectId === id) {
      if (remainingProjects.length > 0) {
        const firstProject = remainingProjects[0];
        if (firstProject) {
          const firstProjectChapters = get().workspace.chapters.filter((c) => c.projectId === firstProject.id);
          newChapterId = firstProjectChapters[0]?.id || null;
          if (newChapterId) {
            const chapterScenes = get().workspace.scenes.filter((s) => s.chapterId === newChapterId);
            newSceneId = chapterScenes[0]?.id || null;
          }
        }
      } else {
        newChapterId = null;
        newSceneId = null;
      }
    }
    
    set((state) => ({
      workspace: {
        ...state.workspace,
        projects: state.workspace.projects.filter((p) => p.id !== id),
        chapters: state.workspace.chapters.filter((c) => c.projectId !== id),
        scenes: state.workspace.scenes.filter((s) => s.projectId !== id),
        codexEntries: state.workspace.codexEntries.filter((e) => e.projectId !== id),
        characterRelations: state.workspace.characterRelations.filter((r) => r.projectId !== id),
        timelineEvents: state.workspace.timelineEvents.filter((e) => e.projectId !== id),
        researchNotes: state.workspace.researchNotes.filter((n) => n.projectId !== id),
        tags: state.workspace.tags.filter((t) => t.projectId !== id),
        revisions: state.workspace.revisions.filter((r) => {
          const scene = state.workspace.scenes.find(s => s.id === r.sceneId);
          return !scene || scene.projectId !== id;
        }),
      },
      selectedProjectId: newSelectedId,
      selectedChapterId: newChapterId,
      selectedSceneId: newSceneId,
    }));
    get().save();
  },

  selectProject: (id) => {
    const projectChapters = get().workspace.chapters.filter((c) => c.projectId === id);
    const projectScenes = get().workspace.scenes.filter((s) => s.chapterId === projectChapters[0]?.id);
    
    set({
      selectedProjectId: id,
      selectedChapterId: projectChapters[0]?.id || null,
      selectedSceneId: projectScenes[0]?.id || null,
    });
  },

  // Chapter actions
  addChapter: (title) => {
    const { selectedProjectId, workspace } = get();
    if (!selectedProjectId) return "";
    
    const chapters = workspace.chapters.filter((c) => c.projectId === selectedProjectId);
    const chapter = createChapter(selectedProjectId, title, chapters.length);
    const scene = createScene(chapter.id, "Opening Scene", 0, selectedProjectId);
    
    set((state) => ({
      workspace: {
        ...state.workspace,
        chapters: [...state.workspace.chapters, chapter],
        scenes: [...state.workspace.scenes, scene],
      },
      selectedChapterId: chapter.id,
      selectedSceneId: scene.id,
    }));
    get().save();
    return chapter.id;
  },

  updateChapter: (id, updates) => {
    set((state) => ({
      workspace: {
        ...state.workspace,
        chapters: state.workspace.chapters.map((c) =>
          c.id === id ? { ...c, ...updates, updatedAt: new Date().toISOString() } : c
        ),
      },
    }));
    get().save();
  },

  deleteChapter: (id) => {
    const chapterScenes = get().workspace.scenes.filter((s) => s.chapterId === id);
    const projectChapters = get().workspace.chapters.filter((c) => c.projectId === get().selectedProjectId);
    const remainingChapters = projectChapters.filter((c) => c.id !== id);
    
    let newChapterId = get().selectedChapterId;
    let newSceneId = get().selectedSceneId;
    
    if (get().selectedChapterId === id) {
      if (remainingChapters.length > 0) {
        const nextChapter = remainingChapters[0];
        if (nextChapter) {
          newChapterId = nextChapter.id;
          const chapterScenes2 = get().workspace.scenes.filter((s) => s.chapterId === newChapterId);
          newSceneId = chapterScenes2[0]?.id || null;
        }
      } else {
        newChapterId = null;
        newSceneId = null;
      }
    }
    
    set((state) => ({
      workspace: {
        ...state.workspace,
        chapters: state.workspace.chapters.filter((c) => c.id !== id),
        scenes: state.workspace.scenes.filter((s) => s.chapterId !== id),
        revisions: state.workspace.revisions.filter(
          (r) => !chapterScenes.some((s) => s.id === r.sceneId)
        ),
      },
      selectedChapterId: newChapterId,
      selectedSceneId: newSceneId,
    }));
    get().save();
  },

  selectChapter: (id) => {
    const chapterScenes = get().workspace.scenes.filter((s) => s.chapterId === id);
    set({
      selectedChapterId: id,
      selectedSceneId: chapterScenes[0]?.id || null,
    });
  },

  reorderChapters: (chapterIds) => {
    set((state) => ({
      workspace: {
        ...state.workspace,
        chapters: state.workspace.chapters.map((c) => 
          chapterIds.includes(c.id)
            ? { ...c, order: chapterIds.indexOf(c.id) }
            : c
        ),
      },
    }));
    get().save();
  },

  // Scene actions
  addScene: (chapterId, title = "New Scene") => {
    const scenes = get().workspace.scenes.filter((s) => s.chapterId === chapterId);
    const chapter = get().workspace.chapters.find((c) => c.id === chapterId);
    const scene = createScene(chapterId, title, scenes.length, chapter?.projectId || "");
    
    set((state) => ({
      workspace: {
        ...state.workspace,
        scenes: [...state.workspace.scenes, scene],
      },
      selectedSceneId: scene.id,
    }));
    get().save();
    return scene.id;
  },

  updateScene: (id, updates) => {
    const scene = get().workspace.scenes.find((s) => s.id === id);
    if (!scene) return;
    
    // Create revision if content changed
    if (updates.content && updates.content !== scene.content) {
      const revision = createRevision(id, scene.content);
      set((state) => ({
        workspace: {
          ...state.workspace,
          scenes: state.workspace.scenes.map((s) =>
            s.id === id ? { ...s, ...updates, updatedAt: new Date().toISOString() } : s
          ),
          revisions: [...state.workspace.revisions, revision],
        },
      }));
    } else {
      set((state) => ({
        workspace: {
          ...state.workspace,
          scenes: state.workspace.scenes.map((s) =>
            s.id === id ? { ...s, ...updates, updatedAt: new Date().toISOString() } : s
          ),
        },
      }));
    }
    get().save();
  },

  deleteScene: (id) => {
    const currentChapterId = get().selectedChapterId;
    const chapterScenes = get().workspace.scenes.filter((s) => s.chapterId === currentChapterId);
    const remainingScenes = chapterScenes.filter((s) => s.id !== id);
    
    let newSceneId = get().selectedSceneId;
    
    if (get().selectedSceneId === id) {
      newSceneId = remainingScenes[0]?.id || null;
    }
    
    set((state) => ({
      workspace: {
        ...state.workspace,
        scenes: state.workspace.scenes.filter((s) => s.id !== id),
        revisions: state.workspace.revisions.filter((r) => r.sceneId !== id),
      },
      selectedSceneId: newSceneId,
    }));
    get().save();
  },

  selectScene: (id) => {
    set({ selectedSceneId: id });
  },

  reorderScenes: (chapterId, sceneIds) => {
    set((state) => ({
      workspace: {
        ...state.workspace,
        scenes: state.workspace.scenes.map((s) => 
          s.chapterId === chapterId
            ? { ...s, order: sceneIds.indexOf(s.id) }
            : s
        ),
      },
    }));
    get().save();
  },

  // Codex actions
  addCodexEntry: (type, title) => {
    const { selectedProjectId } = get();
    if (!selectedProjectId) return "";
    
    const entry = createCodexEntry(selectedProjectId, type, title);
    
    set((state) => ({
      workspace: {
        ...state.workspace,
        codexEntries: [...state.workspace.codexEntries, entry],
      },
      selectedCodexId: entry.id,
    }));
    get().save();
    return entry.id;
  },

  updateCodexEntry: (id, updates) => {
    set((state) => ({
      workspace: {
        ...state.workspace,
        codexEntries: state.workspace.codexEntries.map((e) =>
          e.id === id ? { ...e, ...updates, updatedAt: new Date().toISOString() } : e
        ),
      },
    }));
    get().save();
  },

  deleteCodexEntry: (id) => {
    set((state) => ({
      workspace: {
        ...state.workspace,
        codexEntries: state.workspace.codexEntries.filter((e) => e.id !== id),
        characterRelations: state.workspace.characterRelations.filter(
          (r) => r.fromId !== id && r.toId !== id
        ),
      },
      selectedCodexId: state.selectedCodexId === id ? null : state.selectedCodexId,
    }));
    get().save();
  },

  selectCodex: (id) => {
    set({ selectedCodexId: id });
  },

  // Character Relations
  addCharacterRelation: (fromId, toId, relationType) => {
    const { selectedProjectId } = get();
    if (!selectedProjectId) return;
    
    const relation = createCharacterRelation(selectedProjectId, fromId, toId, relationType);
    
    set((state) => ({
      workspace: {
        ...state.workspace,
        characterRelations: [...state.workspace.characterRelations, relation],
      },
    }));
    get().save();
  },

  updateCharacterRelation: (id, updates) => {
    set((state) => ({
      workspace: {
        ...state.workspace,
        characterRelations: state.workspace.characterRelations.map((r) =>
          r.id === id ? { ...r, ...updates } : r
        ),
      },
    }));
    get().save();
  },

  deleteCharacterRelation: (id) => {
    set((state) => ({
      workspace: {
        ...state.workspace,
        characterRelations: state.workspace.characterRelations.filter((r) => r.id !== id),
      },
    }));
    get().save();
  },

  // Timeline Events
  addTimelineEvent: (title, date) => {
    const { selectedProjectId, workspace } = get();
    if (!selectedProjectId) return "";
    
    const events = workspace.timelineEvents.filter((e) => e.projectId === selectedProjectId);
    const event = createTimelineEvent(selectedProjectId, title, date, events.length);
    
    set((state) => ({
      workspace: {
        ...state.workspace,
        timelineEvents: [...state.workspace.timelineEvents, event],
      },
    }));
    get().save();
    return event.id;
  },

  updateTimelineEvent: (id, updates) => {
    set((state) => ({
      workspace: {
        ...state.workspace,
        timelineEvents: state.workspace.timelineEvents.map((e) =>
          e.id === id ? { ...e, ...updates } : e
        ),
      },
    }));
    get().save();
  },

  deleteTimelineEvent: (id) => {
    set((state) => ({
      workspace: {
        ...state.workspace,
        timelineEvents: state.workspace.timelineEvents.filter((e) => e.id !== id),
      },
    }));
    get().save();
  },

  // Research Notes
  addResearchNote: (title, category = "General") => {
    const { selectedProjectId } = get();
    if (!selectedProjectId) return "";
    
    const note = createResearchNote(selectedProjectId, title, category);
    
    set((state) => ({
      workspace: {
        ...state.workspace,
        researchNotes: [...state.workspace.researchNotes, note],
      },
    }));
    get().save();
    return note.id;
  },

  updateResearchNote: (id, updates) => {
    set((state) => ({
      workspace: {
        ...state.workspace,
        researchNotes: state.workspace.researchNotes.map((n) =>
          n.id === id ? { ...n, ...updates, updatedAt: new Date().toISOString() } : n
        ),
      },
    }));
    get().save();
  },

  deleteResearchNote: (id) => {
    set((state) => ({
      workspace: {
        ...state.workspace,
        researchNotes: state.workspace.researchNotes.filter((n) => n.id !== id),
      },
    }));
    get().save();
  },

  getResearchNotes: () => {
    const { selectedProjectId, workspace } = get();
    if (!selectedProjectId) return [];
    return workspace.researchNotes.filter((n) => n.projectId === selectedProjectId);
  },

  // Tags
  addTag: (name, color = "#8b5cf6", description = "") => {
    const { selectedProjectId } = get();
    if (!selectedProjectId) return "";
    
    const tag = createTag(selectedProjectId, name, color, description);
    
    set((state) => ({
      workspace: {
        ...state.workspace,
        tags: [...state.workspace.tags, tag],
      },
    }));
    get().save();
    return tag.id;
  },

  updateTag: (id, updates) => {
    set((state) => ({
      workspace: {
        ...state.workspace,
        tags: state.workspace.tags.map((t) =>
          t.id === id ? { ...t, ...updates } : t
        ),
      },
    }));
    get().save();
  },

  deleteTag: (id) => {
    set((state) => ({
      workspace: {
        ...state.workspace,
        tags: state.workspace.tags.filter((t) => t.id !== id),
      },
    }));
    get().save();
  },

  getTags: () => {
    const { selectedProjectId, workspace } = get();
    if (!selectedProjectId) return [];
    return workspace.tags.filter((t) => t.projectId === selectedProjectId);
  },

  // Settings
  updateSettings: (updates) => {
    set((state) => ({
      settings: { ...state.settings, ...updates },
    }));
    get().save();
  },

  setTheme: (theme) => {
    set((state) => ({
      settings: { ...state.settings, theme },
    }));
    get().save();
  },

  // Navigation
  setCurrentView: (view) => {
    set({ currentView: view });
  },

  // Session
  startWritingSession: (sceneId) => {
    set({
      writingSession: {
        startTime: Date.now(),
        wordsWritten: 0,
        sceneId,
      },
    });
  },

  updateSessionWords: (words) => {
    set((state) => ({
      writingSession: {
        ...state.writingSession,
        wordsWritten: state.writingSession.wordsWritten + words,
      },
    }));
  },

  resetSession: () => {
    set({ writingSession: DEFAULT_SESSION });
  },

  updateDailyWords: (words: number) => {
    const today = new Date().toISOString().split("T")[0] ?? "";
    set((state) => ({
      settings: {
        ...state.settings,
        dailyWords: words,
        lastWritingDate: today,
      },
    }));
  },

  toggleNanoWriMo: () => {
    set((state) => ({
      settings: {
        ...state.settings,
        nanoWriMoMode: !state.settings.nanoWriMoMode,
      },
    }));
  },

  setNanoTarget: (target: number) => {
    set((state) => ({
      settings: {
        ...state.settings,
        nanoWriMoTarget: target,
      },
    }));
  },

  // Computed getters
  getProject: () => {
    const { selectedProjectId, workspace } = get();
    if (!selectedProjectId) return null;
    return getProjectWithRelations(selectedProjectId, workspace);
  },

  getCurrentChapter: () => {
    const { selectedChapterId, workspace } = get();
    if (!selectedChapterId) return null;
    return workspace.chapters.find((c) => c.id === selectedChapterId) || null;
  },

  getCurrentScene: () => {
    const { selectedSceneId, workspace } = get();
    if (!selectedSceneId) return null;
    return workspace.scenes.find((s) => s.id === selectedSceneId) || null;
  },

  getProjectStats: () => {
    const project = get().getProject();
    if (!project) return null;
    
    const wordCount = project.scenes.reduce((sum, s) => sum + calculateWordCount(s.content), 0);
    const draftedScenes = project.scenes.filter((s) => s.status === "draft" || s.status === "revising").length;
    const completedScenes = project.scenes.filter((s) => s.status === "complete").length;
    const characters = project.codexEntries.filter((e) => e.type === "character").length;
    const locations = project.codexEntries.filter((e) => e.type === "location").length;
    const timelineEvents = get().workspace.timelineEvents.filter((e) => e.projectId === project.id).length;
    
    return {
      wordCount,
      sceneCount: project.scenes.length,
      chapterCount: project.chapters.length,
      draftedScenes,
      completedScenes,
      targetWords: project.targetWordCount,
      completion: Math.min(100, Math.round((wordCount / project.targetWordCount) * 100)),
      characters,
      locations,
      timelineEvents,
    };
  },

  getCharacterRelations: () => {
    const { selectedProjectId, workspace } = get();
    if (!selectedProjectId) return [];
    return workspace.characterRelations.filter((r) => r.projectId === selectedProjectId);
  },

  getTimelineEvents: () => {
    const { selectedProjectId, workspace } = get();
    if (!selectedProjectId) return [];
    return workspace.timelineEvents
      .filter((e) => e.projectId === selectedProjectId)
      .sort((a, b) => a.order - b.order);
  },
}));

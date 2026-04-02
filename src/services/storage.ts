import { invoke } from "@tauri-apps/api/core";
import {
  Workspace,
  Project,
  Chapter,
  Scene,
  CodexEntry,
  Revision,
  CharacterRelation,
  TimelineEvent,
  ProjectWithRelations,
  AppSettings,
  CodexType,
  ResearchNote,
  Tag,
} from "../types";
import { v4 as uuidv4 } from "uuid";

const DEFAULT_WORKSPACE: Workspace = {
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
};

/**
 * Utility to get current timestamp once per operation to ensure consistency.
 */
function getTimestamp(): string {
  return new Date().toISOString();
}

export async function loadWorkspace(): Promise<Workspace> {
  try {
    const data = await invoke<string | null>("load_workspace_snapshot");
    if (data) {
      const parsed = JSON.parse(data) as Workspace;
      return {
        ...DEFAULT_WORKSPACE,
        ...parsed,
        folders: parsed.folders || [],
        characterRelations: parsed.characterRelations || [],
        timelineEvents: parsed.timelineEvents || [],
      };
    }
    return DEFAULT_WORKSPACE;
  } catch (error) {
    console.error("Failed to load workspace:", error);
    return DEFAULT_WORKSPACE;
  }
}

export async function saveWorkspace(workspace: Workspace): Promise<void> {
  try {
    await invoke("save_workspace_snapshot", { workspaceJson: JSON.stringify(workspace) });
  } catch (error) {
    console.error("Failed to save workspace:", error);
    throw error;
  }
}

export async function loadSettings(): Promise<AppSettings | null> {
  try {
    const data = await invoke<string | null>("load_settings");
    if (data) {
      return JSON.parse(data) as AppSettings;
    }
    return null;
  } catch {
    return null;
  }
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  try {
    await invoke("save_settings", { settingsJson: JSON.stringify(settings) });
  } catch (error) {
    console.error("Failed to save settings:", error);
    throw error;
  }
}

export function exportWorkspaceToJSON(workspace: Workspace): string {
  return JSON.stringify(workspace, null, 2);
}

export function downloadWorkspaceBackup(workspace: Workspace): void {
  const timestamp = new Date().toISOString().split("T")[0];
  const json = exportWorkspaceToJSON(workspace);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `novel-studio-backup-${timestamp}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function importWorkspaceFromJSON(jsonString: string): Workspace {
  const parsed = JSON.parse(jsonString) as Workspace;
  return {
    ...DEFAULT_WORKSPACE,
    ...parsed,
    projects: parsed.projects || [],
    chapters: parsed.chapters || [],
    scenes: parsed.scenes || [],
    codexEntries: parsed.codexEntries || [],
    revisions: parsed.revisions || [],
    folders: parsed.folders || [],
    characterRelations: parsed.characterRelations || [],
    timelineEvents: parsed.timelineEvents || [],
    researchNotes: parsed.researchNotes || [],
    tags: parsed.tags || [],
  };
}

// Helper functions
export function createProject(title: string, type: string = "Novel"): Project {
  const now = getTimestamp();
  return {
    id: uuidv4(),
    title,
    type,
    status: "drafting",
    synopsis: "",
    targetWordCount: 80000,
    tags: [],
    storyThreads: [],
    genre: "",
    tone: "",
    pov: "",
    lastOpened: now, // New: for "Recent Projects" UI
    createdAt: now,
    updatedAt: now,
  };
}

export function createChapter(projectId: string, title: string, order: number): Chapter {
  const now = getTimestamp();
  return {
    id: uuidv4(),
    projectId,
    title,
    notes: "",
    synopsis: "",
    order,
    folderId: null,
    createdAt: now,
    updatedAt: now,
  };
}

export function createScene(chapterId: string, title: string, order: number, projectId: string = ""): Scene {
  const now = getTimestamp();
  return {
    id: uuidv4(),
    projectId,
    chapterId,
    title,
    summary: "",
    content: "",
    status: "outline",
    goal: "",
    conflict: "",
    outcome: "",
    pov: "",
    location: "",
    timeOfDay: "",
    color: "#8b5cf6",
    tags: [],
    order,
    createdAt: now,
    updatedAt: now,
  };
}

export function createCodexEntry(projectId: string, type: CodexType, title: string): CodexEntry {
  const now = getTimestamp();
  return {
    id: uuidv4(),
    projectId,
    type,
    title,
    summary: "",
    details: "",
    tags: [],
    relations: [],
    createdAt: now,
    updatedAt: now,
  };
}

export function createRevision(sceneId: string, content: string): Revision {
  const now = getTimestamp();
  return {
    id: uuidv4(),
    sceneId,
    content,
    wordCount: calculateWordCount(content),
    createdAt: now,
  };
}

export function createCharacterRelation(
  projectId: string,
  fromId: string,
  toId: string,
  relationType: string
): CharacterRelation {
  return {
    id: uuidv4(),
    projectId,
    fromId,
    toId,
    relationType,
    description: "",
    strength: 5,
  };
}

export function createTimelineEvent(projectId: string, title: string, date: string, order: number): TimelineEvent {
  const now = getTimestamp();
  return {
    id: uuidv4(),
    projectId,
    title,
    description: "",
    date,
    order,
    tags: [],
    relatedCharacters: [],
    relatedLocations: [],
    createdAt: now,
    updatedAt: now,
  };
}

export function createResearchNote(projectId: string, title: string, category: string = "General"): ResearchNote {
  const now = getTimestamp();
  return {
    id: uuidv4(),
    projectId,
    title,
    content: "",
    category,
    tags: [],
    createdAt: now,
    updatedAt: now,
  };
}

export function createTag(projectId: string, name: string, color: string = "#8b5cf6", description: string = ""): Tag {
  const now = getTimestamp();
  return {
    id: uuidv4(),
    projectId,
    name,
    color,
    description,
    createdAt: now,
    updatedAt: now,
  };
}

// Query functions
export function getProjectWithRelations(
  projectId: string,
  workspace: Workspace
): ProjectWithRelations | null {
  const project = workspace.projects.find((p) => p.id === projectId);
  if (!project) return null;

  // Use a Set for chapter IDs to make scene filtering O(N) instead of O(N*M)
  const chapters = workspace.chapters
    .filter((c) => c.projectId === projectId)
    .sort((a, b) => a.order - b.order);

  const chapterIds = new Set(chapters.map(c => c.id));
  
  const scenes = workspace.scenes
    .filter((s) => chapterIds.has(s.chapterId))
    .sort((a, b) => a.order - b.order); // Scenes are often retrieved by order

  const codexEntries = workspace.codexEntries.filter((e) => e.projectId === projectId);

  return {
    ...project,
    chapters,
    scenes,
    codexEntries,
  };
}

// Utility functions
export function calculateWordCount(content: string): number {
  if (!content || typeof content !== 'string') return 0;
  // Fast regex-based count avoids massive array allocation in memory
  let count = 0;
  const regex = /\S+/g;
  while (regex.exec(content)) count++;
  return count;
}

/**
 * High-performance character counter.
 * Iterates manually to avoid large string allocations via .replace()
 */
export function calculateCharacterCount(content: string): number {
  if (!content || typeof content !== 'string') return 0;
  let count = 0;
  for (let i = 0; i < content.length; i++) {
    if (content[i] !== ' ' && content[i] !== '\n' && content[i] !== '\r' && content[i] !== '\t') {
      count++;
    }
  }
  return count;
}

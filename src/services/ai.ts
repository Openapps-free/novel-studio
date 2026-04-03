import { AIRequest, AIResponse, AppSettings, AIModelConfig, CodexEntry } from "../types";

const API_ENDPOINTS = {
  openai: "https://api.openai.com/v1/chat/completions",
  anthropic: "https://api.anthropic.com/v1/messages",
  ollama: "http://localhost:11434/v1/chat/completions",
  lmstudio: "http://localhost:1234/v1/chat/completions",
};

/**
 * Enhanced metadata for UI rendering. 
 * Includes colors and expected wait times for better UX feedback.
 */
export const AI_MODES = [
  { id: "continue", label: "Continue", description: "Natural extension of your current prose", icon: "➡️", category: "writing", color: "#3b82f6", effort: "low" },
  { id: "expand", label: "Expand", description: "Flesh out details and descriptions", icon: "📝", category: "writing", color: "#60a5fa", effort: "low" },
  { id: "rewrite", label: "Rewrite", description: "Improve flow, impact, and clarity", icon: "✏️", category: "writing", color: "#2563eb", effort: "medium" },
  { id: "summarize", label: "Summarize", description: "Condense selection into key points", icon: "📋", category: "writing", color: "#94a3b8", effort: "low" },
  { id: "dialogue", label: "Fix Dialogue", description: "Sharpen character voices and subtext", icon: "💬", category: "writing", color: "#8b5cf6", effort: "medium" },
  { id: "description", label: "Atmosphere", description: "Inject vivid sensory immersion", icon: "🎨", category: "writing", color: "#ec4899", effort: "medium" },
  { id: "action", label: "Action", description: "High-octane choreography", icon: "⚡", category: "writing", color: "#f59e0b", effort: "medium" },
  { id: "analyze", label: "Analyze", description: "Structural and stylistic audit", icon: "🔍", category: "analysis", color: "#10b981", effort: "high" },
  { id: "brainstorm", label: "Brainstorm", description: "Creative seeds and story angles", icon: "💡", category: "creation", color: "#facc15", effort: "medium" },
  { id: "plot_twist", label: "Plot Twist", description: "Unexpected story pivots", icon: "🎲", category: "creation", color: "#ef4444", effort: "medium" },
  { id: "character_bio", label: "Character Profile", description: "Deep-dive persona creation", icon: "👤", category: "creation", color: "#6366f1", effort: "high" },
  { id: "worldbuild", label: "World Building", description: "Lore and setting development", icon: "🌍", category: "creation", color: "#065f46", effort: "high" },
  { id: "outline", label: "Beat Outline", description: "Generate structural story beats", icon: "🗂️", category: "planning", color: "#475569", effort: "high" },
  { id: "chapter_summary", label: "Recap", description: "Chapter-level executive summary", icon: "📑", category: "summary", color: "#64748b", effort: "medium" },
];

export const LOCAL_MODELS: AIModelConfig[] = [
  { id: "llama3.1-8b", name: "Llama 3.1 8B", provider: "ollama", maxTokens: 4096, description: "Balanced for general writing", recommendedFor: ["continue", "expand", "brainstorm"] },
  { id: "llama3.1-70b", name: "Llama 3.1 70B", provider: "ollama", maxTokens: 4096, description: "High quality, needs GPU", recommendedFor: ["analyze", "rewrite", "character_bio"] },
  { id: "mistral", name: "Mistral 7B", provider: "ollama", maxTokens: 4096, description: "Fast and capable", recommendedFor: ["continue", "dialogue"] },
  { id: "deepseek-r1", name: "DeepSeek R1", provider: "ollama", maxTokens: 4096, description: "Excellent reasoning", recommendedFor: ["analyze", "plot_twist", "outline"] },
  { id: "phi3", name: "Phi-3 Mini", provider: "ollama", maxTokens: 2048, description: "Lightweight, fast", recommendedFor: ["continue", "summarize"] },
  { id: "qwen2.5", name: "Qwen 2.5", provider: "ollama", maxTokens: 4096, description: "Strong multilingual", recommendedFor: ["worldbuild", "character_bio"] },
  { id: "gemma2", name: "Gemma 2 9B", provider: "ollama", maxTokens: 4096, description: "Google's efficient model", recommendedFor: ["expand", "description"] },
  { id: "lmstudio-llama", name: "Llama 3 via LM Studio", provider: "lmstudio", maxTokens: 4096, description: "Via LM Studio GUI", recommendedFor: ["continue", "expand"] },
  { id: "lmstudio-mistral", name: "Mistral via LM Studio", provider: "lmstudio", maxTokens: 4096, description: "Via LM Studio GUI", recommendedFor: ["dialogue", "brainstorm"] },
];

export const CLOUD_MODELS = [
  { id: "gpt-4o", name: "GPT-4o", provider: "openai", maxTokens: 16384, description: "Best overall quality", recommendedFor: ["all"] },
  { id: "gpt-4o-mini", name: "GPT-4o Mini", provider: "openai", maxTokens: 16384, description: "Fast and affordable", recommendedFor: ["continue", "summarize", "brainstorm"] },
  { id: "claude-3-5-sonnet", name: "Claude 3.5 Sonnet", provider: "anthropic", maxTokens: 200000, description: "Excellent writing quality", recommendedFor: ["all"] },
  { id: "claude-3-haiku", name: "Claude 3 Haiku", provider: "anthropic", maxTokens: 200000, description: "Fast and capable", recommendedFor: ["continue", "expand", "summarize"] },
];

export const ALL_MODELS = [...LOCAL_MODELS, ...CLOUD_MODELS];

export const getModelsByProvider = (provider: string) => {
  return ALL_MODELS.filter(m => m.provider === provider);
};

export const getModesByCategory = (category: string) => {
  return AI_MODES.filter(m => m.category === category);
};

/**
 * Registry of AI provider implementations.
 */
const PROVIDER_HANDLERS: Record<string, (request: AIRequest, apiKey: string, systemPrompt: string, model: string) => Promise<AIResponse>> = {
  openai: (req, key, sys, model) => callOpenAI(req, key, sys, model),
  anthropic: (req, key, sys, model) => callAnthropic(req, key, sys, model),
  ollama: (req, _key, sys, model) => callLocalAI(req, "ollama", model, sys),
  lmstudio: (req, _key, sys, model) => callLocalAI(req, "lmstudio", model, sys),
};

export async function callAI(
  request: AIRequest,
  settings: AppSettings
): Promise<AIResponse> {
  const { apiKey, apiProvider, localModel } = settings;

  const isLocal = apiProvider === "ollama" || apiProvider === "lmstudio";
  
  if (!isLocal && (!apiKey || apiKey.trim() === "")) {
    throw new Error(`${apiProvider.toUpperCase()} API key is required. Please check your settings.`);
  }

  const systemPrompt = getSystemPrompt(request.type || "analyze");
  const model = isLocal ? localModel : settings.cloudModel || "gpt-4o-mini";

  const handler = PROVIDER_HANDLERS[apiProvider];
  if (!handler) {
    throw new Error(`Unsupported API provider: ${apiProvider}`);
  }

  return handler(request, apiKey || "", systemPrompt, model || "");
}

/**
 * Professional Narrative Personas.
 * Engineered to produce publication-ready prose by emphasizing "internalities," 
 * rhythmic variation, and avoiding common AI linguistic tropes.
 */
const SYSTEM_PROMPTS: Record<string, string> = {
    continue: `You are an elite literary ghostwriter. Mimic the author's prose style, vocabulary, and sentence rhythm exactly. Focus on character interiority, unspoken subtext, and visceral sensory details. Do NOT summarize or use flowery AI-isms like "a testament to" or "shrouded in mystery." Write publication-ready fiction.`,
    expand: `You are a master of atmospheric prose. Take the provided scene fragment and expand it using the "Show, Don't Tell" principle. Focus on sensory grounding (scent, texture, ambient sound) and the character's emotional reaction to the environment.`,
    summarize: `You are a concise writer. Create a brief, clear summary capturing the essential points, key events, and main ideas. Keep it to 1-2 paragraphs.`,
    rewrite: `You are a senior developmental editor. Tighten the prose, remove "filter words," and sharpen the emotional impact. Preserve the unique authorial voice while enhancing clarity and flow.`,
    dialogue: `You are a dialogue specialist. Rewrite interactions to use subtext and distinct character idiolects. Ensure every line reveals character or advances the plot. Avoid redundant speech tags.`,
    description: `You are a master of sensory immersion. Layer the scene with non-obvious details. Move beyond the visual; incorporate smell, sound, and tactile sensations to create a 3D world.`,
    action: `You are an action choreographer. Write dynamic, clear action sequences with good pacing. Use short punchy sentences for intensity, vary rhythm, and keep readers oriented in space.`,
    emotion: `You are a deep-character specialist. Deepen emotional resonance by showing internal landscape and cognitive dissonance. Use physiological reactions rather than naming the emotion directly.`,
    analyze: `You are a professional literary analyst. Perform a deep audit of: Pacing, Prose Health (Filter Words), Sensory Density, and Narrative Tension. Provide actionable, high-level editorial feedback.`,
    brainstorm: `You are a creative collaborator. Generate innovative ideas, plot possibilities, character directions, and story angles. Think creatively and expansively. Provide 3-5 concrete options.`,
    outline: `You are a plot architect. Help structure scenes and chapters with clear beats: setup, conflict, escalation, climax, resolution. Keep outlines practical and actionable.`,
    worldbuild: `You are a world-building expert. Develop rich, immersive settings with history, culture, geography, politics, and details that make the world feel lived-in and believable.`,
    character_bio: `You are a character development specialist. Create detailed, compelling character profiles including: physical appearance, personality traits, background story, motivations, fears, goals, and relationships. Make them feel like real people.`,
    backstory: `You are a story world expert. Develop rich, detailed backstory for a character. Include formative events, key relationships, turning points, and secrets that shaped who they are today.`,
    character_voice: `You are a dialogue specialist. Develop a distinct voice for a character. Consider their background, personality, education, and speech patterns. Write sample dialogue that captures their unique voice.`,
    plot_twist: `You are a plot engineer. Create surprising yet believable plot twists. Consider: what would shock readers but still feel earned? What hidden information could recontextualize the story?`,
    conflict_ideas: `You are a story tension specialist. Generate conflict ideas that drive narrative forward: internal conflicts, external conflicts, character vs character, character vs environment, etc. Make them specific to your story.`,
    scene_setup: `You are a scene director. Set the stage for a scene: establish location, time, mood, and key elements. Create atmosphere through sensory details and environmental description.`,
    chapter_summary: `You are a précis writer. Create a concise summary of a chapter capturing: main events, character developments, key revelations, and thematic elements. 2-3 paragraphs max.`,
    ending_suggestion: `You are a narrative architect. Suggest 3-5 possible endings for this story that would be satisfying, considering: character arcs, thematic resolution, and reader expectations.`,
    title_suggestion: `You are a branding expert for books. Suggest 5-10 creative, marketable titles for this work. Consider: genre, tone, key themes, and target audience.`,
    blurb: `You are a marketing copywriter. Write a compelling blurb (100-200 words) that hooks readers, establishes tone, and teases the main conflict. Make it irresistible.`,
};

function getSystemPrompt(type: string): string {
  return SYSTEM_PROMPTS[type] ?? SYSTEM_PROMPTS.analyze ?? "";
}

async function handleAIResponse(response: Response, providerName: string): Promise<Record<string, unknown>> {
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`${providerName} API error: ${error}`);
  }
  return response.json();
}

async function callOpenAI(
  request: AIRequest,
  apiKey: string,
  systemPrompt: string,
  model: string
): Promise<AIResponse> {
  const rawResponse = await fetch(API_ENDPOINTS.openai, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: request.prompt },
      ],
      max_tokens: request.maxTokens || 2000,
      temperature: 0.7,
    }),
  });

  const data = await handleAIResponse(rawResponse, "OpenAI") as any;
  const choice = data.choices?.[0];
  const message = choice?.message;
  return {
    text: message?.content || "",
    tokens: data.usage?.total_tokens || 0,
    model: data.model || model,
  };
}

async function callAnthropic(
  request: AIRequest,
  apiKey: string,
  systemPrompt: string,
  model: string
): Promise<AIResponse> {
  const response = await fetch(API_ENDPOINTS.anthropic, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2024-06-20",
    },
    body: JSON.stringify({
      model: model,
      max_tokens: 2000,
      system: systemPrompt,
      messages: [{ role: "user", content: request.prompt }],
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Anthropic API error: ${error}`);
  }

  const data = await response.json();
  return {
    text: data.content[0].text,
    tokens: (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0),
    model: data.model,
  };
}

async function callLocalAI(
  request: AIRequest,
  provider: "ollama" | "lmstudio",
  model: string,
  systemPrompt: string
): Promise<AIResponse> {
  const endpoint = provider === "ollama" ? API_ENDPOINTS.ollama : API_ENDPOINTS.lmstudio;
  
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: request.prompt },
      ],
      max_tokens: 2000,
      temperature: 0.7,
      stream: false,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`${provider === "ollama" ? "Ollama" : "LM Studio"} error: ${error}. Make sure the server is running.`);
  }

  const data = await response.json();
  return {
    text: data.choices?.[0]?.message?.content || "No response generated.",
    tokens: data.usage?.total_tokens || 0,
    model: data.model,
  };
}

export function hasAIConfigured(settings: AppSettings): boolean {
  const isLocal = settings.apiProvider === "ollama" || settings.apiProvider === "lmstudio";
  if (isLocal) return true;
  return !!settings.apiKey && settings.apiKey.length > 0;
}

/**
 * Truncates text to the last N words using a memory-efficient backward scan.
 * Prevents massive array allocations on large novel scenes.
 */
function truncateToContextWindow(text: string, maxWords: number = 2000): string {
  if (!text || text.length < 1000) return text;

  let count = 0;
  let i = text.length;

  while (i > 0 && count < maxWords) {
    // Skip current word
    while (i > 0) {
      const char = text[i - 1];
      if (!char || /\s/.test(char)) break;
      i--;
    }
    count++;
    // Skip whitespace
    while (i > 0) {
      const char = text[i - 1];
      if (!char || !/\s/.test(char)) break;
      i--;
    }
  }

  if (i === 0) return text;
  return "... " + text.slice(i).trim();
}

export function generateAIPrompt(
  type: string,
  context: {
    sceneContent?: string;
    characterBio?: string;
    codexEntries?: CodexEntry[];
    selectedText?: string;
    plotSummary?: string;
    chapterContext?: string;
    characterNames?: string[];
    characterName?: string;
    projectTitle?: string;
    proseStyle?: string;
    genre?: string;
    tone?: string;
  }
): string {
  const { 
    sceneContent, 
    characterBio, 
    codexEntries: _codexEntries, 
    selectedText, 
    plotSummary, 
    chapterContext, 
    characterNames, 
    characterName, 
    projectTitle, 
    proseStyle, 
    genre,
    tone 
  } = context;
  
  const charsPresent = characterNames?.length ? `\n### CHARACTERS PRESENT\n${characterNames.join(", ")}` : "";
  const characterInfo = characterBio ? `\n### CHARACTER DOSSIER\n${characterBio}` : "";
  const chapSynopsis = chapterContext ? `\n### CHAPTER SYNOPSIS\n${chapterContext}` : "";
  const projectInfo = projectTitle ? `\n### PROJECT: ${projectTitle}` : "";
  const metaInfo = (genre || tone) ? `\n### GENRE/TONE\n${genre || "General"} / ${tone || "Neutral"}` : "";
  const styleInfo = proseStyle ? `\n### STYLE DIRECTIVE\n${proseStyle}` : "";

  // Advanced RAG placeholder for future implementation
  
  const codexContext = "";

  // For huge projects, we window the scene content to the last 2500 words
  // Increased window for high-end models to 3500 words
  const activeContent = sceneContent ? truncateToContextWindow(sceneContent, 3500) : "";

  const sceneMatrixInfo = context.sceneContent ? `
### SCENE BEATS
* GOAL: ${context.chapterContext || "Discover/Advance plot"}
* CONFLICT: ${context.tone || "Emotional/Physical tension"}
* EXPECTED OUTCOME: ${context.plotSummary || "Narrative progression"}
` : "";

  const prompts: Record<string, string> = {
    continue: `STORY CONTEXT:${projectInfo}${metaInfo}${sceneMatrixInfo}${chapSynopsis}${charsPresent}${codexContext}${styleInfo}\n\n### TASK\nSeamlessly continue the narrative. You are currently in the ${context.genre || "story"} phase. Ensure the writing addresses the SCENE BEATS while maintaining the author's unique prose rhythm.\n\n### INPUT TEXT\n${activeContent}`,
    expand: `STORY CONTEXT:${characterInfo}${codexContext}${styleInfo}\n\n### TASK\nFlesh out this scene fragment using visceral, sensory-rich prose. Focus on atmospheric micro-beats.\n\n### INPUT TEXT\n${selectedText || sceneContent || ""}`,
    summarize: `### TASK\nCreate a brief, structurally sound summary of the following content:\n\n${activeContent || selectedText || ""}`,
    rewrite: `### TASK\nAct as a Senior Developmental Editor. Polish this passage for maximum impact while preserving the unique authorial voice.\n\n${selectedText || activeContent}`,
    dialogue: `### TASK\nWrite or improve the dialogue. Use subtext and distinct idiolects. Ensure every line advances the conflict.\n\n${selectedText || activeContent}`,
    description: `### TASK\nLayer this scene with non-obvious sensory details. Focus on atmosphere, lighting, and visceral texture.\n\n${selectedText || activeContent}`,
    analyze: `### TASK\nPerform a deep stylistic audit. Analyze pacing, sensory density, filter words, and emotional subtext.\n\n${activeContent || selectedText}`,
    brainstorm: `STORY CONTEXT:${projectInfo}${plotSummary ? `\n### PLOT ARC\n${plotSummary}` : ""}${chapSynopsis}\n\n### TASK\nGenerate 3-5 innovative plot directions or twists that feel earned and high-stakes.\n\n${activeContent}`,
    outline: `### TASK\nConstruct a scene outline using the Hero's Journey or 3-Act structure based on this context:\n\n${activeContent || "No content yet"}`,
    worldbuild: `### TASK\nDevelop the history, culture, or physics of this world aspect with plausible, immersive depth:\n\n${activeContent || selectedText}`,
    character_bio: `Create a detailed character profile${characterName ? ` for ${characterName}` : ""}:${projectInfo}\n\nInclude: physical appearance, personality, background, motivations, fears, goals.`,
    backstory: `Develop a rich backstory${characterName ? ` for ${characterName}` : ""}:${projectInfo}${characterInfo}\n\nInclude formative events, key relationships, and secrets.`,
    character_voice: `Develop a distinct voice for${characterName ? ` ${characterName}` : " this character"}:${characterInfo}${projectInfo}\n\nWrite sample dialogue that captures their unique speech patterns.`,
    plot_twist: `Create surprising but believable plot twists:${projectInfo}${plotSummary ? `\nCurrent plot: ${plotSummary}` : ""}\n\nProvide 3-5 options that would shock readers but feel earned.`,
    conflict_ideas: `Generate conflict ideas that drive this story forward:${projectInfo}${plotSummary ? `\nCurrent plot: ${plotSummary}` : ""}\n\nInclude internal and external conflicts.`,
    scene_setup: `Set the stage for this scene:${projectInfo}${chapSynopsis}\n\nEstablish location, time, mood, and atmosphere.`,
    chapter_summary: `Create a concise summary of this chapter:${projectInfo}\n\nCapture main events, character developments, and key revelations.`,
    ending_suggestion: `Suggest possible endings for this story:${projectInfo}${plotSummary ? `\nStory: ${plotSummary}` : ""}\n\nConsider character arcs and thematic resolution.`,
    title_suggestion: `Suggest creative, marketable titles for "${projectTitle || "this work"}":\n\n${plotSummary ? `Plot: ${plotSummary}` : ""}\n\nProvide 5-10 options considering genre and tone.`,
    blurb: `Write a compelling blurb (100-200 words) for "${projectTitle || "this book"}":\n\n${plotSummary ? `Plot: ${plotSummary}` : ""}\n\nHook readers, establish tone, tease the conflict.`,
  };
  
  return prompts[type] ?? prompts.analyze ?? "";
}

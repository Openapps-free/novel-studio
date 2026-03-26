import { AIRequest, AIResponse, AppSettings, AIModelConfig } from "../types";

const API_ENDPOINTS = {
  openai: "https://api.openai.com/v1/chat/completions",
  anthropic: "https://api.anthropic.com/v1/messages",
  ollama: "http://localhost:11434/v1/chat/completions",
  lmstudio: "http://localhost:1234/v1/chat/completions",
};

export const AI_MODES = [
  { id: "continue", label: "Continue Writing", description: "Continue the story naturally", icon: "➡️", category: "writing" },
  { id: "expand", label: "Expand", description: "Add more detail and description", icon: "📝", category: "writing" },
  { id: "rewrite", label: "Rewrite", description: "Rewrite with better flow and impact", icon: "✏️", category: "writing" },
  { id: "summarize", label: "Summarize", description: "Create a brief summary", icon: "📋", category: "writing" },
  { id: "dialogue", label: "Improve Dialogue", description: "Natural character conversations", icon: "💬", category: "writing" },
  { id: "description", label: "Enhance Description", description: "Vivid sensory details", icon: "🎨", category: "writing" },
  { id: "action", label: "Action Sequence", description: "Dynamic action choreography", icon: "⚡", category: "writing" },
  { id: "emotion", label: "Emotional Depth", description: "Deeper emotional resonance", icon: "❤️", category: "writing" },
  { id: "analyze", label: "Analyze Writing", description: "Get feedback and suggestions", icon: "🔍", category: "analysis" },
  { id: "character_bio", label: "Character Bio", description: "Create detailed character profile", icon: "👤", category: "creation" },
  { id: "backstory", label: "Backstory", description: "Develop character's history", icon: "📜", category: "creation" },
  { id: "character_voice", label: "Character Voice", description: "Distinct voice for character", icon: "🎭", category: "creation" },
  { id: "brainstorm", label: "Brainstorm Ideas", description: "Generate creative ideas", icon: "💡", category: "creation" },
  { id: "plot_twist", label: "Plot Twist", description: "Unexpected story developments", icon: "🎲", category: "creation" },
  { id: "conflict_ideas", label: "Conflict Ideas", description: "Create story tension", icon: "⚔️", category: "creation" },
  { id: "scene_setup", label: "Scene Setup", description: "Establish setting and mood", icon: "🎬", category: "creation" },
  { id: "chapter_summary", label: "Chapter Summary", description: "Recap chapter events", icon: "📑", category: "summary" },
  { id: "outline", label: "Create Outline", description: "Structure scenes and chapters", icon: "🗂️", category: "planning" },
  { id: "ending_suggestion", label: "Ending Options", description: "Possible story endings", icon: "🏁", category: "planning" },
  { id: "title_suggestion", label: "Title Ideas", description: "Creative title suggestions", icon: "📖", category: "marketing" },
  { id: "blurb", label: "Write Blurb", description: "Compelling book description", icon: "📢", category: "marketing" },
  { id: "worldbuild", label: "World Building", description: "Develop setting and lore", icon: "🌍", category: "creation" },
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

export async function callAI(
  request: AIRequest,
  settings: AppSettings
): Promise<AIResponse> {
  const { apiKey, apiProvider, localModel } = settings;

  const isLocal = apiProvider === "ollama" || apiProvider === "lmstudio";
  
  if (isLocal && !apiKey && apiProvider === "ollama") {
    throw new Error("Please ensure Ollama is running. Start with: ollama serve");
  }
  
  if (isLocal && !apiKey && apiProvider === "lmstudio") {
    throw new Error("Please ensure LM Studio is running with server enabled.");
  }

  const systemPrompt = getSystemPrompt(request.type);

  switch (apiProvider) {
    case "openai":
      return callOpenAI(request, apiKey, systemPrompt);
    case "anthropic":
      return callAnthropic(request, apiKey, systemPrompt);
    case "ollama":
      return callLocalAI(request, "ollama", localModel || "llama3.1", systemPrompt);
    case "lmstudio":
      return callLocalAI(request, "lmstudio", localModel || "llama3", systemPrompt);
    default:
      throw new Error("Unknown API provider");
  }
}

function getSystemPrompt(type: string): string {
  const prompts: Record<string, string> = {
    continue: `You are a talented novelist. Continue the story naturally, matching the author's voice, tone, and pacing. Write seamless prose that flows from the existing text. Keep it to 2-4 paragraphs unless more is needed for a complete thought.`,
    expand: `You are a descriptive writer. Expand the given text with rich sensory details, vivid imagery, and atmospheric depth. Add specifics that bring scenes to life while maintaining the author's voice.`,
    summarize: `You are a concise writer. Create a brief, clear summary capturing the essential points, key events, and main ideas. Keep it to 1-2 paragraphs.`,
    rewrite: `You are an expert editor. Rewrite the passage to improve clarity, flow, impact, and readability while PRESERVING the author's original voice and intent. Make it better, not different.`,
    dialogue: `You are a dialogue specialist. Write natural, authentic conversations that reveal character personality, advance plot, and create tension. Make each character sound distinct.`,
    description: `You are a descriptive prose master. Enhance the passage with vivid sensory details - what characters see, hear, smell, taste, and feel. Create atmosphere and mood through precise language.`,
    action: `You are an action choreographer. Write dynamic, clear action sequences with good pacing. Use short punchy sentences for intensity, vary rhythm, and keep readers oriented in space.`,
    emotion: `You are an emotional storyteller. Deepen the emotional resonance of the passage. Show character's inner feelings through physical reactions, thoughts, and subtext rather than telling directly.`,
    analyze: `You are a story analyst and writing coach. Provide constructive feedback on: pacing, tension, character voice, dialogue quality, show-don't-tell, prose style, and areas for improvement. Be specific and actionable.`,
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
  
  return prompts[type] || prompts.analyze;
}

async function callOpenAI(
  request: AIRequest,
  apiKey: string,
  systemPrompt: string
): Promise<AIResponse> {
  const response = await fetch(API_ENDPOINTS.openai, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: request.prompt },
      ],
      max_tokens: 2000,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI API error: ${error}`);
  }

  const data = await response.json();
  return {
    text: data.choices[0].message.content,
    tokens: data.usage?.total_tokens || 0,
    model: data.model,
  };
}

async function callAnthropic(
  request: AIRequest,
  apiKey: string,
  systemPrompt: string
): Promise<AIResponse> {
  const response = await fetch(API_ENDPOINTS.anthropic, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-3-haiku-20240307",
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
    tokens: data.usage?.input_tokens + data.usage?.output_tokens || 0,
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
    text: data.choices[0].message.content,
    tokens: data.usage?.total_tokens || 0,
    model: data.model,
  };
}

export function hasAIConfigured(settings: AppSettings): boolean {
  const isLocal = settings.apiProvider === "ollama" || settings.apiProvider === "lmstudio";
  if (isLocal) return true;
  return !!settings.apiKey && settings.apiKey.length > 0;
}

export function generateAIPrompt(
  type: string,
  context: {
    sceneContent?: string;
    characterBio?: string;
    selectedText?: string;
    plotSummary?: string;
    chapterContext?: string;
    characterNames?: string[];
    characterName?: string;
    projectTitle?: string;
  }
): string {
  const { sceneContent, characterBio, selectedText, plotSummary, chapterContext, characterNames, characterName, projectTitle } = context;
  
  const characterContext = characterNames?.length ? `\nCharacters involved: ${characterNames.join(", ")}` : "";
  const characterInfo = characterBio ? `\nCharacter background: ${characterBio}` : "";
  const chapterInfo = chapterContext ? `\nChapter context: ${chapterContext}` : "";
  const projectInfo = projectTitle ? `\nProject: ${projectTitle}` : "";

  const prompts: Record<string, string> = {
    continue: `Continue this story naturally from where it ends:${projectInfo}${chapterInfo}${characterContext}\n\nCurrent text:\n${sceneContent || ""}`,
    expand: `Expand this passage with rich sensory details and description:${characterInfo}${chapterInfo}${projectInfo}\n\nPassage:\n${selectedText || sceneContent || ""}`,
    summarize: `Create a concise summary of this content:\n\n${sceneContent || selectedText || ""}`,
    rewrite: `Rewrite this passage to be more engaging and impactful:${characterInfo}${chapterInfo}${projectInfo}\n\nOriginal:\n${selectedText || sceneContent || ""}`,
    dialogue: `Write or improve the dialogue in this passage. Make it natural, distinct for each character, and reveal character:${characterInfo}${characterContext}\n\nPassage:\n${selectedText || sceneContent || ""}`,
    description: `Enhance this passage with vivid sensory details - sights, sounds, smells, textures, atmosphere:${chapterInfo}${projectInfo}\n\nPassage:\n${selectedText || sceneContent || ""}`,
    action: `Improve this action sequence with dynamic pacing and clarity:${characterContext}\n\nPassage:\n${selectedText || sceneContent || ""}`,
    emotion: `Deepen the emotional content of this passage. Show feelings through physical reactions, thoughts, and subtext:${characterInfo}${characterContext}\n\nPassage:\n${selectedText || sceneContent || ""}`,
    analyze: `Analyze this writing for improvement. Cover: pacing, tension, dialogue quality, show-don't-tell, prose style, and specific suggestions:\n\n${sceneContent || selectedText || ""}`,
    brainstorm: `Brainstorm creative ideas for this story:${projectInfo}${plotSummary ? `\nCurrent plot: ${plotSummary}` : ""}${chapterInfo}\n\n${sceneContent || ""}`,
    outline: `Create a practical scene/chapter outline with beats:${projectInfo}${plotSummary ? `\nStory: ${plotSummary}` : ""}\n\n${sceneContent || "No content yet"}`,
    worldbuild: `Develop this aspect of your world with rich detail:\n\n${sceneContent || selectedText || ""}`,
    character_bio: `Create a detailed character profile${characterName ? ` for ${characterName}` : ""}:${projectInfo}\n\nInclude: physical appearance, personality, background, motivations, fears, goals.`,
    backstory: `Develop a rich backstory${characterName ? ` for ${characterName}` : ""}:${projectInfo}${characterInfo}\n\nInclude formative events, key relationships, and secrets.`,
    character_voice: `Develop a distinct voice for${characterName ? ` ${characterName}` : " this character"}:${characterInfo}${projectInfo}\n\nWrite sample dialogue that captures their unique speech patterns.`,
    plot_twist: `Create surprising but believable plot twists:${projectInfo}${plotSummary ? `\nCurrent plot: ${plotSummary}` : ""}\n\nProvide 3-5 options that would shock readers but feel earned.`,
    conflict_ideas: `Generate conflict ideas that drive this story forward:${projectInfo}${plotSummary ? `\nCurrent plot: ${plotSummary}` : ""}\n\nInclude internal and external conflicts.`,
    scene_setup: `Set the stage for this scene:${projectInfo}${chapterInfo}\n\nEstablish location, time, mood, and atmosphere.`,
    chapter_summary: `Create a concise summary of this chapter:${projectInfo}\n\nCapture main events, character developments, and key revelations.`,
    ending_suggestion: `Suggest possible endings for this story:${projectInfo}${plotSummary ? `\nStory: ${plotSummary}` : ""}\n\nConsider character arcs and thematic resolution.`,
    title_suggestion: `Suggest creative, marketable titles for "${projectTitle || "this work"}":\n\n${plotSummary ? `Plot: ${plotSummary}` : ""}\n\nProvide 5-10 options considering genre and tone.`,
    blurb: `Write a compelling blurb (100-200 words) for "${projectTitle || "this book"}":\n\n${plotSummary ? `Plot: ${plotSummary}` : ""}\n\nHook readers, establish tone, tease the conflict.`,
  };
  
  return prompts[type] || prompts.analyze;
}

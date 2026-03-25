import { AIRequest, AIResponse, AppSettings } from "../types";

const API_ENDPOINTS = {
  openai: "https://api.openai.com/v1/chat/completions",
  anthropic: "https://api.anthropic.com/v1/messages",
};

export const AI_MODES = [
  { id: "continue", label: "Continue", description: "Continue writing from where you left off", icon: "➡️" },
  { id: "expand", label: "Expand", description: "Add more detail and description", icon: "📝" },
  { id: "summarize", label: "Summarize", description: "Create a brief summary of the content", icon: "📋" },
  { id: "rewrite", label: "Rewrite", description: "Rewrite with better flow and impact", icon: "✏️" },
  { id: "dialogue", label: "Dialogue", description: "Improve or add character dialogue", icon: "💬" },
  { id: "description", label: "Description", description: "Enhance sensory and atmospheric details", icon: "🎨" },
  { id: "action", label: "Action", description: "Improve action sequences and pacing", icon: "⚡" },
  { id: "emotion", label: "Emotion", description: "Deepen emotional resonance", icon: "❤️" },
  { id: "analyze", label: "Analyze", description: "Get feedback on your writing", icon: "🔍" },
  { id: "brainstorm", label: "Brainstorm", description: "Generate new ideas", icon: "💡" },
  { id: "outline", label: "Outline", description: "Create structure for scenes/chapters", icon: "📑" },
  { id: "worldbuild", label: "World-Build", description: "Develop setting and lore", icon: "🌍" },
];

export async function callAI(
  request: AIRequest,
  settings: AppSettings
): Promise<AIResponse> {
  const { apiKey, apiProvider } = settings;

  if (!apiKey) {
    throw new Error("API key not configured. Please add your API key in Settings.");
  }

  const systemPrompt = getSystemPrompt(request.type);

  switch (apiProvider) {
    case "openai":
      return callOpenAI(request, apiKey, systemPrompt);
    case "anthropic":
      return callAnthropic(request, apiKey, systemPrompt);
    default:
      throw new Error("Unknown API provider");
  }
}

function getSystemPrompt(type: AIRequest["type"]): string {
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
    
    brainstorm: `You are a creative collaborator. Generate innovative ideas, plot possibilities, character directions, and story angles. Think creatively and expansively.`,
    
    outline: `You are a plot architect. Help structure scenes and chapters with clear beats: setup, conflict, escalation, climax, resolution. Keep outlines practical and actionable.`,
    
    worldbuild: `You are a world-building expert. Develop rich, immersive settings with history, culture, geography, politics, and details that make the world feel lived-in and believable.`,
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

export function hasAIConfigured(settings: AppSettings): boolean {
  return !!settings.apiKey && settings.apiKey.length > 0;
}

export function generateAIPrompt(
  type: AIRequest["type"],
  context: {
    sceneContent?: string;
    characterBio?: string;
    selectedText?: string;
    plotSummary?: string;
    chapterContext?: string;
    characterNames?: string[];
  }
): string {
  const { sceneContent, characterBio, selectedText, plotSummary, chapterContext, characterNames } = context;
  
  const characterContext = characterNames?.length ? `\nCharacters involved: ${characterNames.join(", ")}` : "";
  const characterInfo = characterBio ? `\nCharacter background: ${characterBio}` : "";
  const chapterInfo = chapterContext ? `\nChapter context: ${chapterContext}` : "";

  const prompts: Record<string, string> = {
    continue: `Continue this story naturally from where it ends:${chapterInfo}${characterContext}\n\nCurrent text:\n${sceneContent || ""}`,
    
    expand: `Expand this passage with rich sensory details and description:${characterInfo}${chapterInfo}\n\nPassage:\n${selectedText || sceneContent || ""}`,
    
    summarize: `Create a concise summary of this content:\n\n${sceneContent || selectedText || ""}`,
    
    rewrite: `Rewrite this passage to be more engaging and impactful:${characterInfo}${chapterInfo}\n\nOriginal:\n${selectedText || sceneContent || ""}`,
    
    dialogue: `Write or improve the dialogue in this passage. Make it natural, distinct for each character, and reveal character:${characterInfo}${characterContext}\n\nPassage:\n${selectedText || sceneContent || ""}`,
    
    description: `Enhance this passage with vivid sensory details - sights, sounds, smells, textures, atmosphere:${chapterInfo}\n\nPassage:\n${selectedText || sceneContent || ""}`,
    
    action: `Improve this action sequence with dynamic pacing and clarity:${characterContext}\n\nPassage:\n${selectedText || sceneContent || ""}`,
    
    emotion: `Deepen the emotional content of this passage. Show feelings through physical reactions, thoughts, and subtext:${characterInfo}${characterContext}\n\nPassage:\n${selectedText || sceneContent || ""}`,
    
    analyze: `Analyze this writing for improvement. Cover: pacing, tension, dialogue quality, show-don't-tell, prose style, and specific suggestions:\n\n${sceneContent || selectedText || ""}`,
    
    brainstorm: `Brainstorm creative ideas for this story:${plotSummary ? `\nCurrent plot: ${plotSummary}` : ""}${chapterInfo}\n\n${sceneContent || ""}`,
    
    outline: `Create a practical scene/chapter outline with beats:${plotSummary ? `\nStory: ${plotSummary}` : ""}\n\n${sceneContent || "No content yet"}`,
    
    worldbuild: `Develop this aspect of your world with rich detail:\n\n${sceneContent || selectedText || ""}`,
  };
  
  return prompts[type] || prompts.analyze;
}

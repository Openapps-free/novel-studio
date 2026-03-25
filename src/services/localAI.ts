import { Scene, ProjectWithRelations } from "../types";
import { calculateWordCount, calculateCharacterCount } from "./storage";

export interface TextAnalysis {
  wordCount: number;
  characterCount: number;
  sentenceCount: number;
  paragraphCount: number;
  avgWordsPerSentence: number;
  avgCharsPerWord: number;
  readingTime: number;
  dialogueCount: number;
  dialogueWords: number;
  descriptionWords: number;
  actionWords: number;
  passiveVoice: number;
  adverbs: number;
  adjectives: number;
  sentiment: "positive" | "negative" | "neutral";
  readability: "easy" | "medium" | "hard";
  pov: string;
  tense: "past" | "present" | "mixed";
}

export interface StoryBeatsResult {
  acts: {
    name: string;
    description: string;
    scenes: string[];
  }[];
  beats: {
    name: string;
    description: string;
    typicalChapter: number | string;
  }[];
}

export interface WritingFeedback {
  issues: {
    type: "warning" | "error" | "suggestion";
    message: string;
    location?: { line: number; column: number };
  }[];
  strengths: string[];
  suggestions: string[];
}

export function analyzeText(content: string, currentScene?: Scene): TextAnalysis {
  const wordCount = calculateWordCount(content);
  const characterCount = calculateCharacterCount(content);
  
  const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const sentenceCount = Math.max(1, sentences.length);
  
  const paragraphs = content.split(/\n\n+/).filter(p => p.trim().length > 0);
  const paragraphCount = Math.max(1, paragraphs.length);
  
  const dialogueMatches = content.match(/"[^"]+"/g) || [];
  const dialogueCount = dialogueMatches.length;
  const dialogueWords = dialogueMatches.reduce((sum, d) => sum + calculateWordCount(d), 0);
  
  const actionPatterns = /\b(ran|walked|ran|jumped|fought|struck|kicked|pushed|grabbed|threw|attacked|defended|escaped|chased|moved|stood|sat|lay)\b/gi;
  const actionMatches = content.match(actionPatterns) || [];
  const actionWords = actionMatches.length;
  
  const descriptionWords = Math.max(0, wordCount - dialogueWords - actionWords);
  
  const passivePatterns = /\b(was|were|been|being|is|are)\s+\w+ed\b/gi;
  const passiveMatches = content.match(passivePatterns) || [];
  const passiveVoice = passiveMatches.length;
  
  const adverbPatterns = /\b\w+ly\b/gi;
  const adverbMatches = content.match(adverbPatterns) || [];
  const adverbs = adverbMatches.length;
  
  const adjectivePatterns = /\b(\w+ful|\w+less|\w+ous|\w+ive|\w+able|\w+ible)\b/gi;
  const adjectiveMatches = content.match(adjectivePatterns) || [];
  const adjectives = adjectiveMatches.length;
  
  const positiveWords = /\b(love|happy|joy|peace|hope|beautiful|wonderful|great|good|smile|laugh|friend|hope|dream)\b/gi;
  const negativeWords = /\b(hate|sad|angry|fear|death|kill|destroy|terrible|awful|bad|cry|suffer|war)\b/gi;
  const positiveCount = (content.match(positiveWords) || []).length;
  const negativeCount = (content.match(negativeWords) || []).length;
  
  let sentiment: "positive" | "negative" | "neutral" = "neutral";
  if (positiveCount > negativeCount + 2) sentiment = "positive";
  else if (negativeCount > positiveCount + 2) sentiment = "negative";
  
  const avgWordsPerSentence = Math.round(wordCount / sentenceCount);
  const avgCharsPerWord = wordCount > 0 ? Math.round(characterCount / wordCount) : 0;
  const readingTime = Math.ceil(wordCount / 200);
  
  let readability: "easy" | "medium" | "hard" = "medium";
  if (avgWordsPerSentence < 12 && avgCharsPerWord < 5) readability = "easy";
  else if (avgWordsPerSentence > 20 || avgCharsPerWord > 6) readability = "hard";
  
  const pastTensePatterns = /\b(was|were|had|did|went|saw|thought|said|knew|felt)\b/gi;
  const presentTensePatterns = /\b(is|are|am|do|go|see|think|say|know|feel|become)\b/gi;
  const pastCount = (content.match(pastTensePatterns) || []).length;
  const presentCount = (content.match(presentTensePatterns) || []).length;
  
  let tense: "past" | "present" | "mixed" = "past";
  if (presentCount > pastCount * 0.5) tense = "mixed";
  else if (presentCount > pastCount) tense = "present";

  return {
    wordCount,
    characterCount,
    sentenceCount,
    paragraphCount,
    avgWordsPerSentence,
    avgCharsPerWord,
    readingTime,
    dialogueCount,
    dialogueWords,
    descriptionWords,
    actionWords,
    passiveVoice,
    adverbs,
    adjectives,
    sentiment,
    readability,
    pov: currentScene?.pov || "Unknown",
    tense,
  };
}

export function getStoryBeats(project: ProjectWithRelations): StoryBeatsResult {
  const totalScenes = project.scenes.length;
  const totalWords = project.scenes.reduce((sum, s) => sum + calculateWordCount(s.content), 0);
  
  const heroJourney = [
    { name: "Ordinary World", description: "The hero's normal life before the adventure", typicalChapter: 1 },
    { name: "Call to Adventure", description: "The hero receives a challenge or quest", typicalChapter: 2 },
    { name: "Refusal of the Call", description: "Hero initially hesitates or refuses", typicalChapter: 3 },
    { name: "Meeting the Mentor", description: "Hero gains guidance or supernatural aid", typicalChapter: 4 },
    { name: "Crossing the Threshold", description: "Hero commits to the adventure", typicalChapter: 5 },
    { name: "Tests, Allies, Enemies", description: "Hero faces challenges and meets characters", typicalChapter: "6-10" },
    { name: "Approach to Inmost Cave", description: "Hero prepares for major challenge", typicalChapter: "10-12" },
    { name: "Ordeal", description: "Hero faces greatest fear/death/rebirth", typicalChapter: 13 },
    { name: "Reward", description: "Hero takes possession of the treasure", typicalChapter: 14 },
    { name: "The Road Back", description: "Hero begins the return journey", typicalChapter: 15 },
    { name: "Resurrection", description: "Final test and transformation", typicalChapter: 16 },
    { name: "Return with Elixir", description: "Hero returns changed, bringing healing", typicalChapter: 17 },
  ];
  
  // const threeAct = [
  //   { name: "Act 1: Setup", description: "Introduce world, characters, and central conflict", typicalChapter: "1-5" },
  //   { name: "Act 2: Confrontation", description: "Rising action, obstacles, and midpoint", typicalChapter: "6-12" },
  //   { name: "Act 3: Resolution", description: "Climax and resolution of the story", typicalChapter: "13-17" },
  // ];

  const act1Scenes = project.scenes.filter((_, i) => i < Math.ceil(totalScenes * 0.2));
  const act2Scenes = project.scenes.filter((_, i) => i >= Math.ceil(totalScenes * 0.2) && i < Math.ceil(totalScenes * 0.8));
  const act3Scenes = project.scenes.filter((_, i) => i >= Math.ceil(totalScenes * 0.8));

  return {
    acts: [
      { name: "Act 1: Setup", description: `Introduces ${act1Scenes.length} scenes (${Math.round(totalWords * 0.2)} words)`, scenes: act1Scenes.map(s => s.title) },
      { name: "Act 2: Confrontation", description: `Develops ${act2Scenes.length} scenes (${Math.round(totalWords * 0.6)} words)`, scenes: act2Scenes.map(s => s.title) },
      { name: "Act 3: Resolution", description: `Concludes ${act3Scenes.length} scenes (${Math.round(totalWords * 0.2)} words)`, scenes: act3Scenes.map(s => s.title) },
    ],
    beats: totalScenes <= 5 ? heroJourney.slice(0, Math.ceil(totalScenes * 1.5)) : heroJourney,
  };
}

export function analyzeWriting(content: string): WritingFeedback {
  const issues: WritingFeedback["issues"] = [];
  const strengths: string[] = [];
  const suggestions: string[] = [];
  
  const wordCount = calculateWordCount(content);
  const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
  
  if (wordCount < 50) {
    issues.push({ type: "warning", message: "This section seems very short. Consider adding more detail." });
  }
  
  if (sentences.length > 0) {
    const avgLength = wordCount / sentences.length;
    if (avgLength > 25) {
      issues.push({ type: "suggestion", message: `Average sentence length is ${Math.round(avgLength)} words. Consider breaking up long sentences for better readability.` });
    }
  }
  
  const dialogueMatches = content.match(/"[^"]+"/g) || [];
  if (dialogueMatches.length > 0) {
    strengths.push("Good use of dialogue to show character voices");
  }
  
  const passivePatterns = /\b(was|were|been|being|is|are)\s+\w+ed\b/gi;
  const passiveMatches = content.match(passivePatterns) || [];
  if (passiveMatches.length > wordCount * 0.05) {
    issues.push({ type: "suggestion", message: "High use of passive voice. Consider rewriting in active voice." });
  }
  
  const adverbPatterns = /\b\w+ly\b/gi;
  const adverbMatches = content.match(adverbPatterns) || [];
  if (adverbMatches.length > wordCount * 0.08) {
    issues.push({ type: "suggestion", message: "High use of adverbs. Consider using stronger verbs instead." });
  }
  
  const filterWords = /\b(very|really|just|actually|basically|literally|totally|absolutely)\b/gi;
  const filterMatches = content.match(filterWords) || [];
  if (filterMatches.length > 2) {
    suggestions.push("Consider removing filter words like 'very', 'really', 'just' for stronger prose.");
  }
  
  const startPatterns = /^[^.!?]*\b(saw|heard|noticed|watched|looked|felt)\b/gi;
  const filterStart = content.match(startPatterns) || [];
  if (filterStart.length > sentences.length * 0.3) {
    suggestions.push("Many sentences start with filter words. Consider varying your sentence openers.");
  }
  
  const veryShortSentences = sentences.filter(s => s.trim().split(/\s+/).length < 5).length;
  if (veryShortSentences > sentences.length * 0.4) {
    suggestions.push("Consider combining some very short sentences for better flow.");
  }
  
  if (dialogueMatches.length === 0 && wordCount > 200) {
    suggestions.push("No dialogue detected. Consider adding character conversations for variety.");
  }
  
  if (issues.length === 0) {
    strengths.push("No major issues detected. Keep up the good work!");
  }
  
  if (strengths.length === 0 && suggestions.length > 0) {
    suggestions.push("Focus on one improvement at a time for best results.");
  }
  
  return { issues, strengths, suggestions };
}

export function getWritingStats(project: ProjectWithRelations) {
  const scenes = project.scenes;
  const words = scenes.map(s => calculateWordCount(s.content));
  const totalWords = words.reduce((a, b) => a + b, 0);
  
  const statusBreakdown = {
    outline: scenes.filter(s => s.status === "outline").length,
    draft: scenes.filter(s => s.status === "draft").length,
    revising: scenes.filter(s => s.status === "revising").length,
    complete: scenes.filter(s => s.status === "complete").length,
  };
  
  const avgWordsPerScene = totalWords / scenes.length || 0;
  const longestScene = Math.max(...words);
  const shortestScene = Math.min(...words.filter(w => w > 0)) || 0;
  
  const chapters = project.chapters;
  const chapterStats = chapters.map(ch => {
    const chScenes = scenes.filter(s => s.chapterId === ch.id);
    const chWords = chScenes.reduce((sum, s) => sum + calculateWordCount(s.content), 0);
    return {
      title: ch.title,
      sceneCount: chScenes.length,
      wordCount: chWords,
      percentComplete: chScenes.filter(s => s.status === "complete").length / chScenes.length * 100,
    };
  });

  return {
    totalWords,
    totalScenes: scenes.length,
    totalChapters: chapters.length,
    avgWordsPerScene: Math.round(avgWordsPerScene),
    longestScene,
    shortestScene,
    statusBreakdown,
    chapterStats,
    targetWordCount: project.targetWordCount,
    progress: Math.min(100, Math.round((totalWords / project.targetWordCount) * 100)),
    estimatedChapters: Math.ceil(totalWords / 5000),
  };
}

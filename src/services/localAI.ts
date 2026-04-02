import { Scene, ProjectWithRelations } from "../types";
import { calculateWordCount, calculateCharacterCount } from "./storage";

/**
 * Pre-compiled regex patterns for performance.
 * Compiling regex once at module level is significantly faster than re-compiling inside functions.
 */
const PATTERNS = {
  SENTENCE_SPLIT: /[.!?]+/,
  PARAGRAPH_SPLIT: /\n\n+/,
  DIALOGUE: /"[^"]+"/g,
  WORDS: /\b[a-zA-Z'-]+\b/g, // More robust word detection
  ACTION: /\b(ran|walked|jumped|fought|struck|kicked|pushed|grabbed|threw|attacked|defended|escaped|chased|moved|stood|sat|lay)\b/gi,
  TELLING: /\b(knew|thought|decided|seemed|wondered|realized|understood|believed)\b/gi,
  FILTER: /\b(saw|heard|noticed|realized|looked|thought|knew|seemed|wondered|just|very|really|begin|began|start|started|feel|felt|watch|watched)\b/gi, // Expanded filter words
  PASSIVE: /\b(was|were|been|being|is|are)\s+\w+ed\b/gi,
  ADVERBS: /\b\w+ly\b/gi,
  ADJECTIVES: /\b(\w+ful|\w+less|\w+ous|\w+ive|\w+able|\w+ible)\b/gi,
  SENTIMENT_POSITIVE: /\b(love|happy|joy|peace|hope|beautiful|wonderful|great|good|smile|laugh|friend|hope|dream)\b/gi,
  SENTIMENT_NEGATIVE: /\b(hate|sad|angry|fear|death|kill|destroy|terrible|awful|bad|cry|suffer|war)\b/gi,
  TENSE_PAST: /\b(was|were|had|did|went|saw|thought|said|knew|felt)\b/gi,
  TENSE_PRESENT: /\b(is|are|am|do|go|see|think|say|know|feel|become)\b/gi,
  SENSORY: {
    sight: /\b(saw|looked|bright|dark|red|blue|visible|shadow|glistened|glowed|gleamed)\b/gi,
    sound: /\b(heard|listened|loud|quiet|echoed|rang|thud|whisper|roared|hummed)\b/gi,
    smell: /\b(smelled|scent|aroma|stink|fragrance|wafted|reeked|perfume)\b/gi,
    touch: /\b(soft|hard|cold|hot|rough|smooth|texture|gritty|silky|coarse)\b/gi,
    taste: /\b(tasted|bitter|sweet|sour|salty|flavor|tangy|savory)\b/gi,
  },
};

/**
 * Configurable scoring weights for literary analysis.
 */
const SCORING_CONFIG = {
  PACING: { SHORT_SENTENCE: 0.5, ACTION: 3.0, DIALOGUE: 1.5 }, // Normalized weights
  SHOW_DONT_TELL: { MULTIPLIER: 500 }, // Adjusted multiplier for sensitivity
  SENTIMENT_THRESHOLD: 0.1, // Percentage difference for sentiment to be non-neutral
};

export interface TextAnalysis {
  wordCount: number;
  characterCount: number;
  rawCharacterCount: number; // Added for more accurate Flesch-Kincaid
  sentenceCount: number;
  paragraphCount: number;
  avgWordsPerSentence: number;
  readabilityGrade: number; // New: 0-12+ for UI labels
  avgCharsPerWord: number;
  readingTime: number;
  dialogueCount: number;
  dialogueWords: number;
  descriptionWords: number;
  actionWords: number;
  passiveVoice: number;
  adverbs: number;
  adjectives: number;
  sentimentScore: number; // Numerical sentiment score (-100 to 100)
  readability: "easy" | "medium" | "hard";
  pov: string;
  tense: "past" | "present" | "mixed";
  sensoryScore: { sight: number; sound: number; smell: number; touch: number; taste: number };
  clarityScore: number; // 0-100 (higher is clearer)
  lexicalDensity: number; // Percentage of unique content words
  showDontTellScore: number;
  pacingScore: number; // 0 (Slow/Reflective) to 100 (High Action)
  pacingAnalysis: string;
  overusedWords: { word: string; count: number }[];
  sentenceVarietyScore: number;
  filterWordsCount: number;
  sentimentArc: number[]; // Added for UI visualization
  pacingArc: number[];    // Added for UI visualization
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
  const rawCharacterCount = content.length; // Total characters including spaces for Flesch-Kincaid
  
  const sentences = content.split(PATTERNS.SENTENCE_SPLIT).filter(s => s.trim().length > 0);
  const sentenceCount = Math.max(1, sentences.length);
  
  const paragraphs = content.split(PATTERNS.PARAGRAPH_SPLIT).filter(p => p.trim().length > 0);
  const paragraphCount = Math.max(1, paragraphs.length);
  
  const dialogueMatches = content.match(PATTERNS.DIALOGUE) || [];
  const dialogueCount = dialogueMatches.length;
  const dialogueWords = dialogueMatches.reduce((sum, d) => sum + calculateWordCount(d), 0);

  // Premium Feature: Word Frequency Analysis
  const words = content.toLowerCase().match(PATTERNS.WORDS) || [];
  const stopWords = new Set(['the', 'and', 'was', 'that', 'with', 'for', 'but', 'his', 'her', 'they', 'she', 'had', 'its', 'you']);
  const freqMap: Record<string, number> = {};
  words.forEach(w => { // Only count words longer than 2 chars and not stop words
    if (w.length > 2 && !stopWords.has(w)) {
      freqMap[w] = (freqMap[w] || 0) + 1;
    }
  });
  const overusedWords = Object.entries(freqMap)
    .map(([word, count]) => ({ word, count }))
    .filter(item => item.count > Math.max(5, wordCount * 0.005)) // Dynamic threshold for overused words
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // Premium Feature: Sentence Variety Analysis (The "Rhythm" of prose)
  const sentenceLengths = sentences.map(s => calculateWordCount(s));
  const avgSentenceLength = wordCount / sentenceCount;
  const variance = sentenceLengths.reduce((acc, len) => acc + Math.pow(len - avgSentenceLength, 2), 0) / sentenceCount;
  // Calibrated: stddev of 5-15 is typical for good prose; clamp to 0-100
  const sentenceVarietyScore = Math.min(100, Math.max(0, Math.round((Math.sqrt(variance) / 15) * 100)));

  // Professional Metric: Lexical Density (Unique words / Total words)
  const uniqueWords = new Set(words.filter(w => !stopWords.has(w))).size;
  const lexicalDensity = wordCount > 0 ? (uniqueWords / wordCount) * 100 : 0;

  // Professional Metric: Clarity Score (Inverse of average sentence length + complex word density)
  const clarityScore = Math.max(0, Math.min(100, 100 - (avgSentenceLength * 1.5)));

  // Premium Feature: Sensory Language Analysis
  const sensory = {
    sight: (content.match(PATTERNS.SENSORY.sight) || []).length,
    sound: (content.match(PATTERNS.SENSORY.sound) || []).length,
    smell: (content.match(PATTERNS.SENSORY.smell) || []).length,
    touch: (content.match(PATTERNS.SENSORY.touch) || []).length,
    taste: (content.match(PATTERNS.SENSORY.taste) || []).length,
  };

  // Premium Feature: "Show, Don't Tell" Heuristic
  const tellingWordsCount = (content.match(PATTERNS.TELLING) || []).length;
  const showDontTellScore = Math.max(0, Math.min(100, 100 - (tellingWordsCount / Math.max(wordCount, 1) * SCORING_CONFIG.SHOW_DONT_TELL.MULTIPLIER)));
  
  const actionMatches = content.match(PATTERNS.ACTION) || [];
  const actionWords = actionMatches.length;
  
  // Advanced Heuristic: Filter Word Detection (Pro-level feature)
  // Expanded filter words in PATTERNS.FILTER
  const filterWordsCount = (content.match(PATTERNS.FILTER) || []).length;

  // Performance: Use a more direct loop for short sentence detection instead of filter
  let shortSentences = 0;
  for (const s of sentences) if (calculateWordCount(s) < 8) shortSentences++;
  const shortSentenceRatio = shortSentences / sentenceCount;

  const actionDensity = actionWords / Math.max(wordCount, 1);
  const dialogueRatio = dialogueWords / Math.max(wordCount, 1);
  // Calibrated pacing: weights sum to 1.0 for a max score of 100
  const { SHORT_SENTENCE, ACTION, DIALOGUE } = SCORING_CONFIG.PACING;
  // Pacing score is a weighted average, scaled to 0-100
  const pacingScore = Math.min(100, Math.round((shortSentenceRatio * SHORT_SENTENCE) + (actionDensity * ACTION) + (dialogueRatio * DIALOGUE)));

  let pacingAnalysis = "Balanced";
  if (pacingScore > 70) pacingAnalysis = "Fast-Paced / Intense";
  else if (pacingScore < 30) pacingAnalysis = "Reflective / Atmospheric";

  const descriptionWords = Math.max(0, wordCount - dialogueWords - actionWords);
  
  const passiveMatches = content.match(PATTERNS.PASSIVE) || [];
  const passiveVoice = passiveMatches.length;
  
  const adverbMatches = content.match(PATTERNS.ADVERBS) || [];
  const adverbs = adverbMatches.length;
  
  const adjectiveMatches = content.match(PATTERNS.ADJECTIVES) || [];
  const adjectives = adjectiveMatches.length;
  
  const positiveCount = (content.match(PATTERNS.SENTIMENT_POSITIVE) || []).length;
  const negativeCount = (content.match(PATTERNS.SENTIMENT_NEGATIVE) || []).length;
  
  // Calculate numerical sentiment score (-100 to 100)
  const sentimentScore = wordCount > 0 ? ((positiveCount - negativeCount) / wordCount) * 100 : 0;

  // Advanced Feature: Arc Analysis (Break into chunks for graphing)
  const chunkCount = 5;
  const sentencesPerChunk = Math.ceil(sentenceCount / chunkCount);
  const sentimentArc: number[] = [];
  const pacingArc: number[] = [];

  for (let i = 0; i < chunkCount; i++) {
    const chunkSentences = sentences.slice(i * sentencesPerChunk, (i + 1) * sentencesPerChunk);
    const chunkContent = chunkSentences.join(". "); // Reconstruct chunk content

    if (!chunkContent) {
      sentimentArc.push(0); // Neutral
      pacingArc.push(0); // Default pacing
      continue;
    }

    // Calculate sentiment for the chunk
    const chunkPositiveCount = (chunkContent.match(PATTERNS.SENTIMENT_POSITIVE) || []).length;
    const chunkNegativeCount = (chunkContent.match(PATTERNS.SENTIMENT_NEGATIVE) || []).length;
    const chunkWordCount = calculateWordCount(chunkContent);
    const chunkSentimentScore = chunkWordCount > 0 ? ((chunkPositiveCount - chunkNegativeCount) / chunkWordCount) * 100 : 0;
    sentimentArc.push(chunkSentimentScore);

    // Calculate pacing for the chunk
    const chunkShortSentences = chunkSentences.filter(s => calculateWordCount(s) < 8).length;
    const chunkShortSentenceRatio = chunkShortSentences / Math.max(1, chunkSentences.length);
    const chunkActionMatches = chunkContent.match(PATTERNS.ACTION) || [];
    const chunkActionDensity = chunkActionMatches.length / Math.max(1, chunkWordCount);
    const chunkDialogueMatches = chunkContent.match(PATTERNS.DIALOGUE) || [];
    const chunkDialogueWords = chunkDialogueMatches.reduce((sum, d) => sum + calculateWordCount(d), 0);
    const chunkDialogueRatio = chunkDialogueWords / Math.max(1, chunkWordCount);
    const chunkPacingScore = Math.min(100, Math.round((chunkShortSentenceRatio * SHORT_SENTENCE + chunkActionDensity * ACTION + chunkDialogueRatio * DIALOGUE) * 100 / (SHORT_SENTENCE + ACTION + DIALOGUE)));
    pacingArc.push(chunkPacingScore);
  }
  
  const avgWordsPerSentence = Math.round(wordCount / sentenceCount);
  const readabilityGrade = Math.max(0, Math.min(18, Math.round(0.39 * (wordCount / sentenceCount) + 11.8 * (rawCharacterCount / wordCount) - 15.59))); // Flesch-Kincaid uses total characters, not just non-space

  const avgCharsPerWord = wordCount > 0 ? Math.round(calculateCharacterCount(content) / wordCount) : 0;
  const readingTime = Math.ceil(wordCount / 200);
  
  let readability: "easy" | "medium" | "hard" = "medium";
  if (readabilityGrade < 8) readability = "easy";
  else if (readabilityGrade > 12) readability = "hard";
  
  const pastCount = (content.match(PATTERNS.TENSE_PAST) || []).length;
  const presentCount = (content.match(PATTERNS.TENSE_PRESENT) || []).length;

  const sensoryScore = sensory;
  
  let tense: "past" | "present" | "mixed" = "past";
  if (presentCount > pastCount * 0.5) tense = "mixed";
  else if (presentCount > pastCount) tense = "present";

  return {
    wordCount,
    characterCount: calculateCharacterCount(content), // Non-space character count
    rawCharacterCount, // Total characters including spaces
    sentenceCount,
    paragraphCount,
    avgWordsPerSentence,
    readabilityGrade,
    avgCharsPerWord,
    readingTime,
    dialogueCount,
    dialogueWords,
    descriptionWords,
    actionWords: actionMatches.length,
    passiveVoice,
    adverbs,
    adjectives,
    sentimentScore: Math.round(sentimentScore),
    readability,
    pov: currentScene?.pov || "Unknown",
    tense,
    sensoryScore,
    clarityScore: Math.round(clarityScore),
    lexicalDensity: parseFloat(lexicalDensity.toFixed(2)),
    showDontTellScore: Math.round(showDontTellScore),
    pacingScore: Math.round(pacingScore),
    pacingAnalysis,
    overusedWords,
    sentenceVarietyScore: Math.round(sentenceVarietyScore),
    filterWordsCount,
    sentimentArc,
    pacingArc
  };
}

export function getStoryBeats(project: ProjectWithRelations): StoryBeatsResult {
  const totalScenes = project.scenes.length;
  
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
  
  // Group scenes by chapter order
  const chapters = project.chapters;
  const totalChapters = chapters.length;
  const act1ChapterCount = Math.ceil(totalChapters * 0.2);
  const act2ChapterCount = Math.ceil(totalChapters * 0.6);
  
  const act1ChapterIds = new Set(chapters.slice(0, act1ChapterCount).map(c => c.id));
  const act2ChapterIds = new Set(chapters.slice(act1ChapterCount, act1ChapterCount + act2ChapterCount).map(c => c.id));
  const act3ChapterIds = new Set(chapters.slice(act1ChapterCount + act2ChapterCount).map(c => c.id));
  
  const act1Scenes = project.scenes.filter(s => act1ChapterIds.has(s.chapterId));
  const act2Scenes = project.scenes.filter(s => act2ChapterIds.has(s.chapterId));
  const act3Scenes = project.scenes.filter(s => act3ChapterIds.has(s.chapterId));
  
  const act1Words = act1Scenes.reduce((sum, s) => sum + calculateWordCount(s.content), 0);
  const act2Words = act2Scenes.reduce((sum, s) => sum + calculateWordCount(s.content), 0);
  const act3Words = act3Scenes.reduce((sum, s) => sum + calculateWordCount(s.content), 0);

  return {
    acts: [
      { name: "Act 1: Setup", description: `Introduces ${act1Scenes.length} scenes (${act1Words} words)`, scenes: act1Scenes.map(s => s.title) },
      { name: "Act 2: Confrontation", description: `Develops ${act2Scenes.length} scenes (${act2Words} words)`, scenes: act2Scenes.map(s => s.title) },
      { name: "Act 3: Resolution", description: `Concludes ${act3Scenes.length} scenes (${act3Words} words)`, scenes: act3Scenes.map(s => s.title) },
    ],
    beats: totalScenes <= 5 ? heroJourney.slice(0, Math.ceil(totalScenes * 1.5)) : heroJourney,
  };
}

export function analyzeWriting(content: string): WritingFeedback {
  const issues: WritingFeedback["issues"] = [];
  const strengths: string[] = [];
  const suggestions: string[] = [];
  
  const wordCount = calculateWordCount(content);
  const sentences = content.split(PATTERNS.SENTENCE_SPLIT).filter(s => s.trim().length > 0);
  
  if (wordCount < 50) {
    issues.push({ type: "warning", message: "This section seems very short. Consider adding more detail." });
  }
  
  if (sentences.length > 0) {
    const avgLength = wordCount / sentences.length;
    if (avgLength > 25) {
      issues.push({ type: "suggestion", message: `Average sentence length is ${Math.round(avgLength)} words. Consider breaking up long sentences for better readability.` });
    }
  }
  
  const dialogueMatches = content.match(PATTERNS.DIALOGUE) || [];
  if (dialogueMatches && dialogueMatches.length > 0) {
    strengths.push("Good use of dialogue to show character voices");
  }
  
  const passiveMatches = content.match(PATTERNS.PASSIVE) || [];
  if (passiveMatches && passiveMatches.length > wordCount * 0.05) {
    issues.push({ type: "suggestion", message: "High use of passive voice. Consider rewriting in active voice." });
  }
  
  const adverbMatches = content.match(PATTERNS.ADVERBS) || [];
  if (adverbMatches.length > wordCount * 0.08) {
    issues.push({ type: "suggestion", message: "High use of adverbs. Consider using stronger verbs instead." });
  }
  
  const filterMatches = content.match(PATTERNS.FILTER) || [];
  if (filterMatches.length > 2) {
    suggestions.push("Consider removing filter words like 'very', 'really', 'just' for stronger prose.");
  }
  
  const startPatterns = /^[^.!?]*\b(saw|heard|noticed|watched|looked|felt)\b/gi; // Keep this locally as it's start-of-line specific
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
      percentComplete: chScenes.length > 0 ? (chScenes.filter(s => s.status === "complete").length / chScenes.length * 100) : 0,
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

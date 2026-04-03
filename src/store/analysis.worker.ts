import { analyzeText } from "../services/localAI";

/**
 * Web Worker entry point for off-thread literary analysis.
 * Prevents UI stuttering during heavy NLP tasks.
 */
self.onmessage = (e: MessageEvent<string>) => {
  const content = e.data;
  const result = analyzeText(content);
  self.postMessage(result);
};
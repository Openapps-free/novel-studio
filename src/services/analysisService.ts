import { TextAnalysis } from "./localAI";

// This handles the communication with the Web Worker
export class AnalysisService {
  private worker: Worker;

  constructor() {
    // Note: In Vite, we use ?worker to import as a worker
    this.worker = new Worker(new URL('../workers/analysis.worker.ts', import.meta.url), { type: 'module' });
  }

  analyze(content: string): Promise<TextAnalysis> {
    return new Promise((resolve) => {
      this.worker.onmessage = (e) => resolve(e.data);
      this.worker.postMessage(content);
    });
  }
}

export const analysisService = new AnalysisService();
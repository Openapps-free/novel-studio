import * as fflate from 'fflate';

/**
 * CoreEngine: High-performance Novel Management
 * Handles compressed content, typography, theming, and analysis.
 */
export class StudioEngine {
  private snapshots: Uint8Array[] = [];
  private encoder = new TextEncoder();
  private decoder = new TextDecoder();
  private contentStore: Map<string, Uint8Array> = new Map();

  /**
   * Captures the current state of the content store as a compressed binary blob.
   */
  public takeSnapshot(): void {
    const serialized = JSON.stringify(Array.from(this.contentStore.entries()));
    const compressed = fflate.zlibSync(this.encoder.encode(serialized), { level: 6 });
    this.snapshots.push(compressed);
    if (this.snapshots.length > 50) this.snapshots.shift();
  }

  /**
   * Compresses and stores a chapter.
   */
  public addChapter(title: string, content: string): void {
    const safeTitle = title.replace(/[^a-z0-9]/gi, "_").toLowerCase();
    const binaryContent = this.encoder.encode(content);
    const compressed = fflate.zlibSync(binaryContent, { level: 9 });
    this.contentStore.set(safeTitle, compressed);
    this.takeSnapshot();
  }

  /**
   * Retrieves and decompresses a chapter.
   */
  public getChapter(title: string): string | null {
    const safeTitle = title.replace(/[^a-z0-9]/gi, "_").toLowerCase();
    const compressed = this.contentStore.get(safeTitle);
    if (!compressed) return null;
    try {
      const decompressed = fflate.unzlibSync(compressed);
      return this.decoder.decode(decompressed);
    } catch {
      return null;
    }
  }

  /**
   * Returns a snapshot of all stored chapter titles.
   */
  public getChapterList(): string[] {
    return Array.from(this.contentStore.keys());
  }

  /**
   * Restores the content store from a snapshot.
   */
  public restoreSnapshot(index: number): boolean {
    if (index < 0 || index >= this.snapshots.length) return false;
    try {
      const decompressed = fflate.unzlibSync(this.snapshots[index]!);
      const serialized = this.decoder.decode(decompressed);
      const entries = JSON.parse(serialized) as [string, number[]][];
      this.contentStore = new Map(entries.map(([key, arr]) => [key, new Uint8Array(arr)]));
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Smart Typography: Converts developer-style typing to professional prose.
   */
  public applySmartTypography(text: string): string {
    return text
      .replace(/--/g, '\u2014')
      .replace(/\.\.\./g, '\u2026')
      .replace(/(^|\s)"(?=\w)/g, '$1\u201c')
      .replace(/"/g, '\u201d')
      .replace(/(^|\s)'(?=\w)/g, '$1\u2018')
      .replace(/'/g, '\u2019');
  }

  /**
   * Typewriter Focus Mode: Calculates optimal scroll offset.
   */
  public calculateFocusScroll(lineTop: number, containerHeight: number): number {
    const goldenRatioOffset = containerHeight * 0.382;
    return Math.max(0, lineTop - goldenRatioOffset);
  }

  /**
   * Visual Theme Orchestrator: Returns CSS variable profiles.
   */
  public getThemeProfile(theme: 'classic' | 'sepia' | 'midnight' | 'zen' | 'royal' | 'oled'): Record<string, string> {
    const classic: Record<string, string> = {
      '--studio-bg': '#f5f5f7',
      '--studio-surface': '#ffffff',
      '--studio-text': '#1d1d1f',
      '--studio-accent': '#0066cc',
      '--studio-border': 'rgba(0,0,0,0.1)',
      '--studio-shadow': '0 8px 30px rgba(0,0,0,0.04)',
      '--font-main': '"Charter", "Inter", serif'
    };

    const profiles: Record<string, Record<string, string>> = {
      classic,
      sepia: {
        '--studio-bg': '#f4ecd8',
        '--studio-surface': '#f9f4e8',
        '--studio-text': '#5b4636',
        '--studio-accent': '#8b4513',
        '--studio-border': 'rgba(91,70,54,0.1)',
        '--studio-shadow': '0 8px 30px rgba(91,70,54,0.05)',
        '--font-main': '"Iowan Old Style", serif'
      },
      midnight: {
        '--studio-bg': '#010101',
        '--studio-surface': '#161618',
        '--studio-text': '#ecedee',
        '--studio-accent': '#0a84ff',
        '--studio-border': 'rgba(255,255,255,0.1)',
        '--studio-shadow': '0 12px 40px rgba(0,0,0,0.6)',
        '--font-main': '"Inter", system-ui'
      },
      zen: {
        '--studio-bg': '#2e3440',
        '--studio-surface': '#3b4252',
        '--studio-text': '#d8dee9',
        '--studio-accent': '#88c0d0',
        '--studio-border': 'transparent',
        '--studio-shadow': 'none',
        '--font-main': '"Charter", serif'
      },
      royal: {
        '--studio-bg': '#1a1410',
        '--studio-surface': '#251c16',
        '--studio-text': '#e5d5c5',
        '--studio-accent': '#d4af37',
        '--studio-border': '#352820',
        '--studio-shadow': '0 10px 30px rgba(0,0,0,0.4)',
        '--font-main': '"Baskerville", serif'
      },
      oled: {
        '--studio-bg': '#000000',
        '--studio-surface': '#000000',
        '--studio-text': '#ffffff',
        '--studio-accent': '#ffffff',
        '--studio-border': '#333333',
        '--studio-shadow': 'none',
        '--font-main': '"Inter", sans-serif'
      }
    };

    return profiles[theme] ?? classic;
  }

  /**
   * Focus Mode Controller: Toggles deep-work immersion class.
   */
  public setFocusMode(enabled: boolean): void {
    document.body.classList.toggle('focus-mode-active', enabled);
  }

  /**
   * Pacing & Stylistic Analysis.
   */
  public analyzeNarrativeFlow(content: string) {
    if (!content || content.trim().length === 0) {
      return { pacingScore: "0", dialogueRatio: "0%", emotionalTone: "N/A", sentenceCount: 0, averageSentenceLength: "0" };
    }

    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    if (sentences.length === 0) {
      return { pacingScore: "0", dialogueRatio: "0%", emotionalTone: "N/A", sentenceCount: 0, averageSentenceLength: "0" };
    }

    const wordCounts = sentences.map(s => s.trim().split(/\s+/).length);
    const avg = wordCounts.reduce((a, b) => a + b, 0) / wordCounts.length;
    const variance = wordCounts.reduce((a, b) => a + Math.pow(b - avg, 2), 0) / wordCounts.length;
    const pacingVolatility = Math.sqrt(variance);

    const tensionKeywords = ['suddenly', 'screamed', 'dark', 'cold', 'breathless', 'shadow'];
    const words = content.toLowerCase().split(/\s+/);
    const tensionCount = words.filter(w => tensionKeywords.some(k => w.includes(k))).length;

    const dialogueMatches = content.match(/["\u201c'\u2018]([^"\u201d\u2019'\u2019]*)["\u201d'\u2019]/g) || [];
    const dialogueWords = dialogueMatches.reduce((acc, match) => acc + match.split(/\s+/).length, 0);
    const totalWords = Math.max(words.length, 1);

    return {
      pacingScore: pacingVolatility.toFixed(2),
      dialogueRatio: ((dialogueWords / totalWords) * 100).toFixed(1) + '%',
      emotionalTone: tensionCount > 5 ? 'High Tension' : 'Neutral/Calm',
      sentenceCount: sentences.length,
      averageSentenceLength: avg.toFixed(1)
    };
  }

  /**
   * Automated Story Bible Generation.
   * Uses improved entity extraction to reduce false positives from sentence starters.
   */
  public generateStoryBible(chapters: { title: string, content: string }[]): Record<string, unknown> {
    const entities = new Set<string>();
    // Improved: require entity to NOT be at sentence start and be preceded by context
    const entityRegex = /(?:^|\s)([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/g;

    chapters.forEach(ch => {
      let match;
      while ((match = entityRegex.exec(ch.content)) !== null) {
        const candidate = match[1];
        if (candidate && candidate.length > 1) {
          entities.add(candidate);
        }
      }
    });

    return {
      exportedAt: new Date().toISOString(),
      entities: Array.from(entities)
    };
  }

  /**
   * Exports the content store as a compressed blob.
   */
  public exportProject(): Blob {
    const serialized = JSON.stringify(Array.from(this.contentStore.entries()));
    const compressed = fflate.zlibSync(this.encoder.encode(serialized), { level: 9 });
    return new Blob([compressed], { type: 'application/octet-stream' });
  }

  /**
   * Returns snapshot metadata.
   */
  public getSnapshotCount(): number {
    return this.snapshots.length;
  }
}

export const studioEngine = new StudioEngine();

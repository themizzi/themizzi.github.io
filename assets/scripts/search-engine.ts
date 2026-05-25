/**
 * Pure search engine logic without DOM dependencies
 */

interface SearchResult {
  title: string;
  url: string;
  content: string;
}

interface SearchResultWithScore extends SearchResult {
  score: number;
}

interface SearchIndex {
  pages: SearchResult[];
}

export interface SearchEngineEvents {
  'search:loading': { query: string };
  'search:results': { query: string; results: SearchResultWithScore[] };
  'search:no-results': { query: string };
  'search:error': { error: Error; query?: string };
}

export class SearchEngine extends EventTarget {
  private searchIndex: SearchIndex | null = null;
  private isLoading = false;

  constructor() {
    super();
    this.loadSearchIndex();
  }

  /**
   * Load the search index from the server
   */
  private async loadSearchIndex(): Promise<void> {
    try {
      this.isLoading = true;
      const response = await fetch('/search-index.json');
      if (!response.ok) {
        throw new Error(`Failed to load search index: ${response.status}`);
      }
      this.searchIndex = await response.json();
      this.isLoading = false;
    }
    catch (error) {
      this.isLoading = false;
      this.dispatchEvent(new CustomEvent('search:error', {
        detail: { error: error as Error },
      }));
    }
  }

  /**
   * Perform a search and emit results
   */
  public async search(query: string): Promise<void> {
    if (!query.trim()) {
      this.dispatchEvent(new CustomEvent('search:results', {
        detail: { query, results: [] },
      }));
      return;
    }

    if (this.isLoading) {
      this.dispatchEvent(new CustomEvent('search:loading', {
        detail: { query },
      }));
      return;
    }

    if (!this.searchIndex) {
      this.dispatchEvent(new CustomEvent('search:error', {
        detail: {
          error: new Error('Search index not loaded'),
          query,
        },
      }));
      return;
    }

    const results = this.searchPages(query);

    if (results.length === 0) {
      this.dispatchEvent(new CustomEvent('search:no-results', {
        detail: { query },
      }));
    }
    else {
      this.dispatchEvent(new CustomEvent('search:results', {
        detail: { query, results },
      }));
    }
  }

  /**
   * Search through the pages
   */
  private searchPages(query: string): SearchResultWithScore[] {
    if (!this.searchIndex) return [];

    const queryLower = query.toLowerCase();
    const searchTerms = queryLower.split(/\s+/).filter(term => term.length > 0);

    return this.searchIndex.pages
      .map((page): SearchResultWithScore => {
        const titleScore = this.calculateRelevanceScore(page.title.toLowerCase(), searchTerms);
        const contentScore = this.calculateRelevanceScore(page.content.toLowerCase(), searchTerms);
        const totalScore = titleScore * 2 + contentScore;

        return {
          ...page,
          score: totalScore,
        };
      })
      .filter((page): page is SearchResultWithScore => page.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 20);
  }

  /**
   * Calculate relevance score for a text against search terms
   */
  private calculateRelevanceScore(text: string, searchTerms: string[]): number {
    let score = 0;

    for (const term of searchTerms) {
      if (text.includes(term)) {
        score += term.length;
      }

      const wordRegex = new RegExp(`\\b${this.escapeRegex(term)}`, 'gi');
      const matches = text.match(wordRegex);
      if (matches) {
        score += matches.length * 2;
      }
    }

    return score;
  }

  /**
   * Escape special characters for regex
   */
  private escapeRegex(string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /**
   * Check if search index is loaded
   */
  public isReady(): boolean {
    return this.searchIndex !== null && !this.isLoading;
  }
}

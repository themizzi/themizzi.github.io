/**
 * Search Custom Element that handles DOM interactions
 */

import { SearchEngine } from './search-engine.js';

interface SearchResult {
  title: string;
  url: string;
  content: string;
}

interface SearchResultWithScore extends SearchResult {
  score: number;
}

export class SearchElement extends HTMLElement {
  private searchEngine: SearchEngine;
  private debounceTimer: number | null = null;

  // DOM elements
  private searchInput: HTMLInputElement | null = null;
  private searchForm: HTMLFormElement | null = null;
  private resultsContainer: HTMLElement | null = null;
  private loadingIndicator: HTMLElement | null = null;

  static get observedAttributes() {
    return ['placeholder', 'debounce-delay', 'template-id', 'form-template-id', 'no-results-template-id', 'error-template-id'];
  }

  constructor() {
    super();
    this.searchEngine = new SearchEngine();
  }

  connectedCallback() {
    this.render();
    this.bindElements();
    this.attachEventListeners();
    this.attachSearchEngineListeners();
  }

  disconnectedCallback() {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
  }

  attributeChangedCallback(name: string, oldValue: string, newValue: string) {
    if (oldValue !== newValue) {
      this.handleAttributeChange(name, newValue);
    }
  }

  /**
   * Render the search element HTML
   */
  private render(): void {
    const formTemplateId = this.getAttribute('form-template-id') || 'search-form-template';
    const formTemplate = document.getElementById(formTemplateId) as HTMLTemplateElement;

    if (!formTemplate) {
      console.warn(`Search form template with id "${formTemplateId}" not found`);
      return;
    }

    const clone = formTemplate.content.cloneNode(true) as DocumentFragment;
    this.appendChild(clone);

    // Update placeholder if specified
    const placeholder = this.getAttribute('placeholder');
    if (placeholder) {
      const searchInput = this.querySelector('#search-input') as HTMLInputElement;
      if (searchInput) {
        searchInput.placeholder = placeholder;
      }
    }
  }

  /**
   * Bind DOM elements
   */
  private bindElements(): void {
    this.searchInput = this.querySelector('#search-input') as HTMLInputElement;
    this.searchForm = this.querySelector('.search-form') as HTMLFormElement;
    this.resultsContainer = this.querySelector('#search-results') as HTMLElement;
    this.loadingIndicator = this.querySelector('#search-loading') as HTMLElement;
  }

  /**
   * Attach DOM event listeners
   */
  private attachEventListeners(): void {
    if (this.searchForm) {
      this.searchForm.addEventListener('submit', this.handleFormSubmit.bind(this));
    }

    if (this.searchInput) {
      this.searchInput.addEventListener('input', this.handleSearchInput.bind(this));
    }
  }

  /**
   * Attach search engine event listeners
   */
  private attachSearchEngineListeners(): void {
    this.searchEngine.addEventListener('search:loading', this.handleSearchLoading.bind(this));
    this.searchEngine.addEventListener('search:results', this.handleSearchResults.bind(this));
    this.searchEngine.addEventListener('search:no-results', this.handleNoResults.bind(this));
    this.searchEngine.addEventListener('search:error', this.handleSearchError.bind(this));
  }

  /**
   * Handle attribute changes
   */
  private handleAttributeChange(name: string, newValue: string): void {
    switch (name) {
      case 'placeholder':
        if (this.searchInput) {
          this.searchInput.placeholder = newValue;
        }
        break;
    }
  }

  /**
   * Handle form submission
   */
  private handleFormSubmit(event: Event): void {
    event.preventDefault();
    // Form submission is now handled by reactive typing only
  }

  /**
   * Handle search input with debouncing
   */
  private handleSearchInput(event: Event): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    const target = event.target as HTMLInputElement;
    const query = target.value.trim();
    const debounceDelay = parseInt(this.getAttribute('debounce-delay') || '300');

    this.debounceTimer = window.setTimeout(() => {
      if (query.length > 0) {
        this.searchEngine.search(query);
      }
      else {
        this.clearResults();
      }
    }, debounceDelay);
  }

  /**
   * Handle search loading state
   */
  private handleSearchLoading(): void {
    this.showLoading();
  }

  /**
   * Handle search results
   */
  private handleSearchResults(event: Event): void {
    const customEvent = event as CustomEvent<{ query: string; results: SearchResultWithScore[] }>;
    const { query, results } = customEvent.detail;
    this.hideLoading();
    this.displayResults(results, query);
  }

  /**
   * Handle no results
   */
  private handleNoResults(event: Event): void {
    const customEvent = event as CustomEvent<{ query: string }>;
    const { query } = customEvent.detail;
    this.hideLoading();
    this.displayNoResults(query);
  }

  /**
   * Handle search errors
   */
  private handleSearchError(event: Event): void {
    const customEvent = event as CustomEvent<{ error: Error; query?: string }>;
    const { error, query } = customEvent.detail;
    this.hideLoading();
    this.displayError(error, query);
  }

  /**
   * Show loading indicator
   */
  private showLoading(): void {
    if (this.loadingIndicator) {
      this.loadingIndicator.style.display = 'flex';
    }
  }

  /**
   * Hide loading indicator
   */
  private hideLoading(): void {
    if (this.loadingIndicator) {
      this.loadingIndicator.style.display = 'none';
    }
  }

  /**
   * Display search results
   */
  private displayResults(results: SearchResultWithScore[], query: string): void {
    if (!this.resultsContainer) return;

    this.clearResults();

    results.forEach((result) => {
      const resultElement = this.createResultElement(result, query);
      if (resultElement && this.resultsContainer) {
        this.resultsContainer.appendChild(resultElement);
      }
    });

    // Dispatch custom event for external listeners
    this.dispatchEvent(new CustomEvent('search-results', {
      detail: { query, results },
      bubbles: true,
    }));
  }

  /**
   * Create a result element from the template
   */
  private createResultElement(result: SearchResult, query: string): DocumentFragment | null {
    const templateId = this.getAttribute('template-id') || 'search-result-template';
    const resultTemplate = document.getElementById(templateId) as HTMLTemplateElement;

    if (!resultTemplate) {
      console.warn(`Search result template with id "${templateId}" not found`);
      return null;
    }

    const clone = resultTemplate.content.cloneNode(true) as DocumentFragment;

    const link = clone.querySelector('.search-result-link') as HTMLAnchorElement;
    const url = clone.querySelector('.search-result-url') as HTMLElement;
    const excerpt = clone.querySelector('.search-result-excerpt') as HTMLElement;

    if (link) {
      link.innerHTML = this.highlightSearchTerms(result.title, query);
      link.href = result.url;
    }

    if (url) {
      url.textContent = result.url;
    }

    if (excerpt) {
      excerpt.innerHTML = this.createExcerpt(result.content, query);
    }

    return clone;
  }

  /**
   * Create an excerpt with highlighted search terms
   */
  private createExcerpt(content: string, query: string, maxLength = 200): string {
    const queryLower = query.toLowerCase();
    const contentLower = content.toLowerCase();

    let startPos = 0;
    const queryIndex = contentLower.indexOf(queryLower);

    if (queryIndex !== -1) {
      startPos = Math.max(0, queryIndex - 50);
    }

    let excerpt = content.slice(startPos, startPos + maxLength);

    if (startPos > 0) excerpt = '...' + excerpt;
    if (startPos + maxLength < content.length) excerpt = excerpt + '...';

    excerpt = this.highlightSearchTerms(excerpt, query);

    return excerpt;
  }

  /**
   * Highlight search terms in text
   */
  private highlightSearchTerms(text: string, query: string): string {
    const searchTerms = query.split(/\s+/).filter(term => term.length > 0);
    let highlightedText = text;

    for (const term of searchTerms) {
      const regex = new RegExp(`(${this.escapeRegex(term)})`, 'gi');
      highlightedText = highlightedText.replace(regex, '<mark>$1</mark>');
    }

    return highlightedText;
  }

  /**
   * Escape special characters for regex
   */
  private escapeRegex(string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /**
   * Display no results message
   */
  private displayNoResults(query: string): void {
    if (!this.resultsContainer) return;

    this.clearResults();

    const templateId = this.getAttribute('no-results-template-id') || 'search-no-results-template';
    const noResultsTemplate = document.getElementById(templateId) as HTMLTemplateElement;

    if (!noResultsTemplate) {
      console.warn(`No results template with id "${templateId}" not found`);
      return;
    }

    const clone = noResultsTemplate.content.cloneNode(true) as DocumentFragment;

    // Update the query text
    const queryElement = clone.querySelector('.search-query') as HTMLElement;
    if (queryElement) {
      queryElement.textContent = query;
    }

    this.resultsContainer.appendChild(clone);

    // Dispatch custom event
    this.dispatchEvent(new CustomEvent('search-no-results', {
      detail: { query },
      bubbles: true,
    }));
  }

  /**
   * Display error message
   */
  private displayError(error: Error, query?: string): void {
    if (!this.resultsContainer) return;

    this.clearResults();

    const templateId = this.getAttribute('error-template-id') || 'search-error-template';
    const errorTemplate = document.getElementById(templateId) as HTMLTemplateElement;

    if (!errorTemplate) {
      console.warn(`Error template with id "${templateId}" not found`);
      return;
    }

    const clone = errorTemplate.content.cloneNode(true) as DocumentFragment;

    // Update the query text if provided
    const queryTextElement = clone.querySelector('.search-query-text') as HTMLElement;
    if (queryTextElement && query) {
      queryTextElement.textContent = ` for "${query}"`;
    }

    this.resultsContainer.appendChild(clone);

    // Dispatch custom event
    this.dispatchEvent(new CustomEvent('search-error', {
      detail: { error, query },
      bubbles: true,
    }));
  }

  /**
   * Clear search results
   */
  private clearResults(): void {
    if (this.resultsContainer) {
      this.resultsContainer.innerHTML = '';
    }
  }

  /**
   * Escape HTML to prevent XSS
   */
  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Public API methods
   */
  public search(query: string): void {
    this.searchEngine.search(query);
  }

  public clear(): void {
    if (this.searchInput) {
      this.searchInput.value = '';
    }
    this.clearResults();
  }

  public focus(): void {
    if (this.searchInput) {
      this.searchInput.focus();
    }
  }
}

// Register the custom element
customElements.define('search-element', SearchElement);

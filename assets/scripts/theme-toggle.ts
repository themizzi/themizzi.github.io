export class ThemeToggle {
  constructor(
    private themeColorMeta: HTMLElement,
    private themeToggles: HTMLElement[],
    private documentElement: HTMLElement,
  ) {
    // load theme from localStorage
    const theme = localStorage.getItem('theme') || 'system';

    // initialize toggles
    this.themeToggles.forEach((toggle) => {
      const value = toggle.getAttribute('value');
      if (value === theme) {
        toggle.setAttribute('checked', '');
      }
      else {
        toggle.removeAttribute('checked');
      }
    });

    this.setTheme();

    // add event listeners
    this.themeToggles.forEach((toggle) => {
      toggle.addEventListener('click', () => {
        const theme = toggle.getAttribute('value') || 'system';
        if (theme === 'system') {
          localStorage.removeItem('theme');
        }
        else {
          localStorage.setItem('theme', theme);
        }
        this.setTheme();
      });
    });
  }

  private setTheme(): void {
    const backgroundColor = getComputedStyle(this.documentElement).getPropertyValue('--background-color').trim();
    this.themeColorMeta.setAttribute('content', backgroundColor);
  }
}

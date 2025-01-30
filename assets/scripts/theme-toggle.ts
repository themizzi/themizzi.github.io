export class ThemeToggle {
  constructor(
    private themeColorMeta: HTMLElement,
    private themeIconSystem: HTMLElement,
    private themeIconLight: HTMLElement,
    private themeIconDark: HTMLElement,
    private documentElement: HTMLElement,
  ) {
    const savedTheme = localStorage.getItem('theme') || 'system';
    this.setTheme(savedTheme);
    this.themeIconSystem.addEventListener('click', () => this.setTheme('light'));
    this.themeIconLight.addEventListener('click', () => this.setTheme('dark'));
    this.themeIconDark.addEventListener('click', () => this.setTheme('system'));
  }

  private setTheme(theme: string): void {
    if (theme !== 'system') {
      document.documentElement.setAttribute('data-theme', theme);
    }
    else {
      document.documentElement.removeAttribute('data-theme');
    }
    localStorage.setItem('theme', theme);

    // Hide all icons initially
    this.themeIconSystem.style.display = 'none';
    this.themeIconLight.style.display = 'none';
    this.themeIconDark.style.display = 'none';

    // Show the correct icon based on the selected theme
    if (theme === 'light' && this.themeIconLight) {
      this.themeIconLight.style.display = 'inline';
    }
    else if (theme === 'dark' && this.themeIconDark) {
      this.themeIconDark.style.display = 'inline';
    }
    else if (this.themeIconSystem) {
      this.themeIconSystem.style.display = 'inline';
    }

    const backgroundColor = getComputedStyle(this.documentElement).getPropertyValue('--background-color').trim();
    this.themeColorMeta.setAttribute('content', backgroundColor);
  }
}

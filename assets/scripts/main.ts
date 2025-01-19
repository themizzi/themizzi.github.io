import { ThemeToggle } from './theme-toggle';

// Initialize the ThemeToggle class with the necessary elements
document.addEventListener('DOMContentLoaded', () => {
  const themeColorMeta = document.getElementById('theme-color-meta') as HTMLElement;
  const themeIconSystem = document.getElementById('theme-icon-system') as HTMLElement;
  const themeIconLight = document.getElementById('theme-icon-light') as HTMLElement;
  const themeIconDark = document.getElementById('theme-icon-dark') as HTMLElement;

  if (themeColorMeta && themeIconSystem && themeIconLight && themeIconDark) {
    new ThemeToggle(
      themeColorMeta,
      themeIconSystem,
      themeIconLight,
      themeIconDark,
      document.documentElement,
    );
  }
  else {
    console.error('One or more theme elements are missing');
  }
});

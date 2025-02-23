import { ThemeToggle } from './theme-toggle';

// Initialize the ThemeToggle class with the necessary elements
document.addEventListener('DOMContentLoaded', () => {
  const themeColorMeta = document.getElementById('theme-color-meta') as HTMLElement;
  const themeIconSystem = document.getElementById('theme-system') as HTMLElement;
  const themeIconLight = document.getElementById('theme-light') as HTMLElement;
  const themeIconDark = document.getElementById('theme-dark') as HTMLElement;

  if (themeColorMeta && themeIconSystem && themeIconLight && themeIconDark) {
    new ThemeToggle(
      themeColorMeta,
      [
        themeIconSystem,
        themeIconLight,
        themeIconDark,
      ],
      document.documentElement,
    );
  }
  else {
    console.error('One or more theme elements are missing');
  }
});

document.addEventListener('DOMContentLoaded', function () {
  // show all elements with .javascript-enable class
  document.querySelectorAll('.javascript-enable').forEach((element) => {
    // remove the hidden attribute
    element.removeAttribute('hidden');
  });

  // hide all elements with .javascript-disable class
  document.querySelectorAll('.javascript-disable').forEach((element) => {
    // add the hidden attribute
    element.setAttribute('hidden', '');
  });

  const audios = document.querySelectorAll('audio');
  audios.forEach((audio) => {
    audio.addEventListener('play', () => {
      audios.forEach((otherAudio) => {
        if (otherAudio !== audio) {
          otherAudio.pause();
        }
      });
    });
  });
});

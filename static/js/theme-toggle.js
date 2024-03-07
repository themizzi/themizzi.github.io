document.addEventListener('DOMContentLoaded', () => {
  const setTheme = (theme) => {
      document.documentElement.setAttribute('data-theme', theme);
      localStorage.setItem('theme', theme);
      // Hide all icons initially
      document.getElementById('theme-icon-system').style.display = 'none';
      document.getElementById('theme-icon-light').style.display = 'none';
      document.getElementById('theme-icon-dark').style.display = 'none';
      // Show the correct icon based on the selected theme
      if (theme === 'light') {
          document.getElementById('theme-icon-light').style.display = 'inline';
      } else if (theme === 'dark') {
          document.getElementById('theme-icon-dark').style.display = 'inline';
      } else {
          document.getElementById('theme-icon-system').style.display = 'inline';
      }
  };

  // Initialize theme from local storage or system preference
  const savedTheme = localStorage.getItem('theme') || 'system';
  setTheme(savedTheme);

  // Add event listeners for each icon to change the theme
  document.getElementById('theme-icon-system').addEventListener('click', () => setTheme('light'));
  document.getElementById('theme-icon-light').addEventListener('click', () => setTheme('dark'));
  document.getElementById('theme-icon-dark').addEventListener('click', () => setTheme('system'));
});

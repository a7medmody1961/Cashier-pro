/*
  File: src/scripts/ui/theme.js
  Version: 2.0 (New File)
  Description: Manages theme switching (light/dark).
*/
export function initTheme() {
    const themeSwitcher = document.getElementById('theme-switcher');
    if (!themeSwitcher) return;

    const applyTheme = (theme) => {
        document.body.classList.toggle('dark-mode', theme === 'dark');
        themeSwitcher.innerHTML = theme === 'dark' ? '<i class="fa-solid fa-sun"></i>' : '<i class="fa-solid fa-moon"></i>';
    };

    const savedTheme = localStorage.getItem('theme') || 'light';
    applyTheme(savedTheme);

    themeSwitcher.addEventListener('click', () => {
        const newTheme = document.body.classList.contains('dark-mode') ? 'light' : 'dark';
        localStorage.setItem('theme', newTheme);
        applyTheme(newTheme);
    });
}
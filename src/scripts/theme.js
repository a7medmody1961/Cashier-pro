const applyTheme = (theme) => {
    document.body.classList.toggle('dark-mode', theme === 'dark');
    const themeSwitcher = document.getElementById('theme-switcher');
    if (themeSwitcher) {
        themeSwitcher.textContent = theme === 'dark' ? '☀️' : '🌙';
    }
};

const applyLanguage = (lang) => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    const langSwitcher = document.getElementById('lang-switcher');
    if (langSwitcher) {
        langSwitcher.textContent = lang === 'ar' ? 'EN' : 'AR';
    }
};

document.addEventListener('DOMContentLoaded', () => {
    const themeSwitcher = document.getElementById('theme-switcher');
    const langSwitcher = document.getElementById('lang-switcher');

    const savedTheme = localStorage.getItem('theme') || 'light';
    applyTheme(savedTheme);

    const savedLang = localStorage.getItem('language') || 'ar';
    applyLanguage(savedLang);

    if (themeSwitcher) {
        themeSwitcher.addEventListener('click', () => {
            const newTheme = document.body.classList.toggle('dark-mode') ? 'dark' : 'light';
            localStorage.setItem('theme', newTheme);
            applyTheme(newTheme);
        });
    }

    if (langSwitcher) {
        langSwitcher.addEventListener('click', () => {
            const newLang = document.documentElement.lang === 'ar' ? 'en' : 'ar';
            localStorage.setItem('language', newLang);
            window.location.reload(); // إعادة تحميل الصفحة لتطبيق اللغة الجديدة
        });
    }
});

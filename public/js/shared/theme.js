/* =====================================================
   SHARED THEME & AVATAR CONTROLLER (LIGHT & DARK MODE)
===================================================== */

(function () {
    // Early theme execution to prevent flash of incorrect theme
    try {
        const savedTheme = localStorage.getItem('app_theme') || 'light';
        document.documentElement.setAttribute('data-theme', savedTheme);
    } catch (e) {}
})();

document.addEventListener('DOMContentLoaded', () => {

    const themeToggle = document.getElementById('themeToggle');
    const root = document.documentElement;

    function applyTheme(theme) {
        root.setAttribute('data-theme', theme);
        localStorage.setItem('app_theme', theme);
        localStorage.setItem('user_theme', theme);

        if (themeToggle) {
            if (theme === 'dark') {
                themeToggle.setAttribute('title', 'Mode Terang (Klik untuk beralih)');
                themeToggle.classList.add('theme-active');
            } else {
                themeToggle.setAttribute('title', 'Mode Gelap (Klik untuk beralih)');
                themeToggle.classList.remove('theme-active');
            }
        }
    }

    // Initialize button state
    const currentTheme = root.getAttribute('data-theme') || localStorage.getItem('app_theme') || 'light';
    applyTheme(currentTheme);

    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            const activeTheme = root.getAttribute('data-theme');
            const newTheme = activeTheme === 'dark' ? 'light' : 'dark';
            applyTheme(newTheme);
        });
    }

    // Synchronize photo avatar in navbar if saved in localStorage
    try {
        const savedPhoto = localStorage.getItem('user_photo');
        if (savedPhoto && savedPhoto.startsWith('data:image')) {
            const navbarAvatar = document.querySelector('.navbar-avatar:not(.navbar-avatar-admin)');
            if (navbarAvatar) {
                navbarAvatar.innerHTML = `<img src="${savedPhoto}" alt="Avatar" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`;
            }
        }
    } catch (e) {}

});

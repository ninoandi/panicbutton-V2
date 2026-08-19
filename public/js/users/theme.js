/* =====================================================
   THEME TOGGLE - LIGHT & DARK MODE CONTROLLER
===================================================== */

(function () {
    const THEME_KEY = 'user_theme';

    function initTheme() {
        const themeToggle = document.getElementById('themeToggle');
        if (!themeToggle) return;

        const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
        updateToggleState(themeToggle, currentTheme);

        themeToggle.addEventListener('click', () => {
            const activeTheme = document.documentElement.getAttribute('data-theme') || 'light';
            const nextTheme = activeTheme === 'dark' ? 'light' : 'dark';
            
            document.documentElement.setAttribute('data-theme', nextTheme);
            try {
                localStorage.setItem(THEME_KEY, nextTheme);
            } catch (e) {}

            updateToggleState(themeToggle, nextTheme);
        });
    }

    function updateToggleState(btn, theme) {
        btn.setAttribute('aria-pressed', theme === 'dark' ? 'true' : 'false');
        btn.setAttribute('title', theme === 'dark' ? 'Ganti ke Light Mode (Tema Terang)' : 'Ganti ke Dark Mode (Tema Gelap)');
    }

    function syncNavbarAvatar() {
        try {
            const savedPhoto = localStorage.getItem('user_photo');
            if (savedPhoto && savedPhoto.startsWith('data:image')) {
                const navbarAvatar = document.querySelector('.navbar-avatar');
                if (navbarAvatar) {
                    navbarAvatar.innerHTML = `<img src="${savedPhoto}" alt="Avatar" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`;
                }
            }
        } catch (e) {}
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            initTheme();
            syncNavbarAvatar();
        });
    } else {
        initTheme();
        syncNavbarAvatar();
    }
})();

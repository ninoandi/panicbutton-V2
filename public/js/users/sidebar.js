document.addEventListener('DOMContentLoaded', () => {

    const sidebarToggle = document.getElementById('sidebarToggle');
    const userLayout = document.querySelector('.user-layout');

    if (!sidebarToggle || !userLayout) {
        console.warn('Sidebar toggle atau user layout tidak ditemukan.');
        return;
    }

    sidebarToggle.addEventListener('click', () => {

        const isCollapsed =
            userLayout.classList.toggle('sidebar-collapsed');

        /*
         * IKON TIDAK DIUBAH.
         * Tetap menggunakan fa-bars.
         */

        sidebarToggle.setAttribute(
            'aria-expanded',
            String(!isCollapsed)
        );

    });

});
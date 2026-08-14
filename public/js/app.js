document.addEventListener('DOMContentLoaded', function () {

    console.log('Admin Panel Laravel berhasil dimuat');

    const sidebarToggle = document.getElementById('sidebarToggle');
    const sidebar = document.getElementById('sidebar');
    const sidebarOverlay = document.getElementById('sidebarOverlay');
    const mainWrapper = document.querySelector('.main-wrapper');

    // Pastikan elemen tersedia
    if (!sidebarToggle) {
        console.error('sidebarToggle tidak ditemukan');
        return;
    }

    if (!sidebar) {
        console.error('sidebar tidak ditemukan');
        return;
    }

    // Toggle sidebar
    sidebarToggle.addEventListener('click', function () {
        sidebar.classList.toggle('open');

        if (sidebarOverlay) {
            sidebarOverlay.classList.toggle('show');
        }

        if (mainWrapper) {
            mainWrapper.classList.toggle('sidebar-open');
        }
    });

    // Klik overlay untuk menutup sidebar
    if (sidebarOverlay) {
        sidebarOverlay.addEventListener('click', function () {
            sidebar.classList.remove('open');
            sidebarOverlay.classList.remove('show');

            if (mainWrapper) {
                mainWrapper.classList.remove('sidebar-open');
            }
        });
    }

    // Tombol Escape untuk menutup sidebar
    document.addEventListener('keydown', function (event) {
        if (event.key === 'Escape') {
            sidebar.classList.remove('open');

            if (sidebarOverlay) {
                sidebarOverlay.classList.remove('show');
            }

            if (mainWrapper) {
                mainWrapper.classList.remove('sidebar-open');
            }
        }
    });

});